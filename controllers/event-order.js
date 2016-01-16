/**
 * Created by qxj on 15/12/22.
 */
var mongoose = require('mongoose');
var Event = require('hyfbase').Event;
var EventOrder = require('hyfbase').EventOrder;
var config = require('../config');
var wechatCore = require('wechat-core');
var parseXML2String = require('xml2js').parseString;
var tools = require('../lib/tools');
var moment = require('moment');
var util = require('util');
var co = require('co');

exports.getEventOrderNumberByEventId = function(req, res, next){
  var eventId = req.params.eventId;

  EventOrder.aggregate([
    {
      $match:{
        eventId: mongoose.Types.ObjectId(eventId),
        status: 'db.booking.pay_success'
      }
    },
    {
      $group:{
        _id: '$eventId',
        count: {
          $sum: '$numberOfPersons'
        }
      }
    }
  ], function (err, result) {
    if(err){
      return res.json({code:0});
    }

    var count = result.length > 0 ? result[0].count : 0;

    return res.json({code: 1, count: count});
  });
};

exports.submit = function(req, res, next) {
  if (!req.session.eventForm) {
    req.checkBody({
      'eventId': {
        notEmpty: true,
        errorMessage: 'Invalid Event'
      },
      'contact': {
        notEmpty: true,
        errorMessage: 'Invalid Contact'
      },
      'area_code': {
        notEmpty: true,
        errorMessage: 'Invalid Mobile'
      },
      'mobile': {
        notEmpty: true,
        errorMessage: 'Invalid Mobile'
      }
    });

    var errors = req.validationErrors();
    if (errors) {
      var err = new Error('There have been validation errors: ' + util.inspect(errors));
      err.status = 400;
      return next(err);
    }

    req.session.eventForm = req.body;
  }

  if (!req.session.user) {
    return res.redirect('/login?from=' + req.originalUrl);
  }

  var eventForm = req.session.eventForm;

  co(function *(){
    try{
      var event = yield Event.findOne({
        _id: eventForm.eventId,
        inStock: true
      }).exec();

      var orders = yield EventOrder.find({
        eventId: eventForm.eventId,
        userId: req.session.user._id
      }).exec();

      var attendedPeople = yield EventOrder.aggregate([
        {
          $match:{
            eventId: mongoose.Types.ObjectId(eventForm.eventId),
            status: 'db.booking.pay_success'
          }
        },
        {
          $group:{
            _id: '$eventId',
            count: {
              $sum: '$numberOfPersons'
            }
          }
        }
      ]).exec();
    }catch (err){
      err.status = 500;
      throw err;
    }

    if(!event){
      var err = new Error('Invalid Event');
      err.status = 400;
      throw err;
    }

    var fail = function(error){
      var eventInfo = new EventOrder({
        eventName: event.title
      });

      req.session.eventForm = null;
      return res.render('event-result', {error: error, eventOrder: eventInfo});
    };

    var generateCharge = function(charge){
      return parseInt(charge * config.currency[req.session.currency] / config.currency[event.currency]);
    };

    if(event.type === 'free' && orders.length > 0){
      return fail('event.result.error.multiorder');
    }

    if(event.type === 'free'){
      eventForm.numberOfPersons = 1;
    }

    var total = generateCharge(event.baseCharge) * eventForm.numberOfPersons;

    var now = moment();

    if(moment(event.attendedDate) <= now){
      return fail('event.result.error.out_date');
    }

    if( attendedPeople.length > 0 && (attendedPeople[0].count + parseInt(eventForm.numberOfPersons)) > event.maxPersons ){
      return fail('event.result.error.full');
    }

    var eventOrder = new EventOrder({
      userId: req.session.user._id,
      eventId: event.id,
      eventName: event.title,
      baseCharge: event.baseCharge,
      numberOfPersons: eventForm.numberOfPersons,
      total: total,
      currency: config.currency,
      settlementCurrency: req.session.currency,
      baseCurrency: event.currency,
      contact: {
        name: eventForm.contact,
        mobile: eventForm.area_code + eventForm.mobile
      },
      status: 'db.booking.wait_to_pay',
      statusLogs: [
        {
          status: 'db.booking.wait_to_pay',
          description: 'create',
          updateDate: new Date()
        }
      ]
    });

    if(event.type === 'free'){
      eventOrder.status = 'db.booking.pay_success';
      eventOrder.statusLogs.push({
        status: 'db.booking.pay_success',
        description: 'free event',
        updateDate: new Date()
      });
    }

    try {
      var savedOrder = yield eventOrder.save();
    } catch (err){
      err.status = 500;
      throw err;
    }

    req.session.eventForm = null;

    if(!savedOrder){
      return res.render('event-result', {error: 'event.result.error.other'});
    }

    if(event.type === 'free') {
      return res.redirect('/user/event');
    }

    if (!req.isFromWechat) {
      return res.render('event-result', {eventOrder: savedOrder});
    }

    var payParams = {
      body: savedOrder.eventName,
      attach: 'event',
      out_trade_no: savedOrder.orderId,
      total_fee: savedOrder.total,
      spbill_create_ip: req.headers['x-real-ip'],
      openid: req.session.wechat
    };

    try {
      var unifiedorderResult = yield new Promise(function (resolve, reject) {
        wechatCore.unifiedorder(payParams, function (err, response, result) {
          if (!err && response.statusCode === 200) {
            resolve(result);
          } else {
            reject(result);
          }
        });
      });
    } catch(err) {
      err.status = 500;
      throw err;
    }

    parseXML2String(unifiedorderResult, function (err, wpResult) {
      if (!err) {
        wpResult = tools.ripXMLCDATA(wpResult.xml);
        if (wechatCore.verifySign(wpResult) && wpResult.return_code === 'SUCCESS' && wpResult.result_code === 'SUCCESS') {
          var wpParams = wechatCore.getJSAPIParamsByPrepayId(wpResult.prepay_id);

          return res.render('event-result', {eventOrder: savedOrder, wpParams: wpParams});
        }
      }

      return res.render('event-result', {eventOrder: savedOrder});
    });
  }).catch(function(err){
    return next(err);
  });
};

exports.getEventsByUserId = function(req, res, next){
  var page = req.query.page || 1;

  EventOrder.paginate({
    userId: req.session.user._id,
    status: 'db.booking.pay_success'
  }, {
    page: page,
    limit: 10,
    columns: 'orderId eventId eventName total settlementCurrency status createDate',
    populate:[{
      path: 'eventId',
      select: 'thumbnail dateStart dateEnd'
    }],
    sort: {
      createDate: -1
    }
  }, function (err, result) {
    if(err){
      err.status = 400;
      return next(err);
    }

    var pager = {
      current: parseInt(page),
      count: result.pages,
      pages: []
    };

    for(var i = 1; i <= result.pages; i++){
      pager.pages.push(i);
    }

    return res.render('user-event-list', {events: result.docs, pager: pager, itemCount: result.total});
  });
};

exports.getEventByOrderId = function(req, res, next){
  var orderId = req.params.orderId;

  if(!orderId){
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }

  EventOrder.findOne({
    orderId: orderId,
    userId: req.session.user._id,
    status: 'db.booking.pay_success'
  }, function (err, order) {
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!order){
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(httpErr);
    }

    return res.render('user-event-detail', {order: order});
  });
};