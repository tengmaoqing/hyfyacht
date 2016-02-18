/**
 * Created by qxj on 15/12/22.
 */
var Event = require('hyfbase').Event;
var wechatCore = require('wechat-core');
var moment = require('moment');

exports.getEvent = function(req, res, next) {
  Event.findOne({
    _id: req.params.id,
    inStock: true
  }).populate({
    path: 'organiser',
    select: 'nickname'
  }).exec(function(err, event){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(!event){
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(err);
    }

    if(!req.isFromWechat){
      return res.render('event', {event: event});
    }

    var url = 'http://' + req.hostname + req.originalUrl.split('#')[0];
    return res.render('event', {event: event, wechatConfig: wechatCore.getConfigForFrontPage(url)});
  });
};

exports.getMoreEvents = function(req, res, next){

  var date = new Date(parseInt(req.query.dateStart));
  var days = date.getDate();
  Event.paginate({
    _id : {$ne: req.query.eventId},
    dateStart : {
      $gt: date.setDate(days-3),
      $lt: date.setDate(days+3)
    }
  },{
    page: 1,
    limit: 2,
    sort: {
      createDate: -1
    }
  }, function(err, result) {
    if(err){
      console.log(err);
      err.status = 400;
      return next(err);
    }

    return res.json({events: result.docs});

  });
};

exports.getEvents = function(req, res, next) {
  var page = req.query.page || 1;

  var query = req.query;
  var obj = {
    inStock: true
  };

  (query.type && query.type != 'all') && (obj.type = query.type);
  (query.status && query.status != 'all') && (obj.attendedDate = { $gt : new Date() });

  if ( query.selectDate ) {
    // var date = new Date(query.selectDate);
    var date = moment(query.selectDate, 'YYYY-MM-DD');
    // var hours = date.getHours();
    console.log(date.toDate());
    // console.log(date.add(1, 'days').toDate());
    // console.log(new Date(date.setHours(hours-8)));
    // console.log(new Date(date.setHours(hours+16)));
    // console.log(new Date(date.setHours(hours-8)));
    // console.log(new Date(date.setHours(hours+16)));
    obj.dateEnd = {
      // $gt: date.setHours(hours-8)
      $gt: date.toDate()
    };
    obj.dateStart = {
      // $lt: date.setHours(hours+16)
      $lt: date.add(1, 'days').toDate()
    };
  }

  Event.paginate(obj, {
    page: page,
    limit: 10,
    columns: 'title dateStart dateEnd summary location baseCharge currency thumbnail organiser createDate attendedDate',
    populate:[{
      path: 'organiser',
      select: 'nickname'
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

    return res.render('event-list', {events: result.docs, pager: pager, itemCount: result.total, dateNow: new Date(), query: query});
  });
};