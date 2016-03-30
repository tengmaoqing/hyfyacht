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

  var date = new Date();
  Event.paginate({
    _id : {$ne: req.query.eventId},
    attendedDate : {
      $gt: date
    },
    inStock : true
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

  query.type && query.type !== "all" && (obj.type = "db.event.type."+query.type);
  query.free === '1' && (obj.baseCharge = 0);
  (query.status && query.status != 'all') && (obj.attendedDate = { $gt : new Date() });

  if ( query.selectStartDate ) {
    var startDate = moment(query.selectStartDate, 'YYYY-MM-DD');
    obj.dateEnd = {
      $gt: startDate.toDate()
    };

    if( query.selectEndDate && query.selectEndDate <= query.selectStartDate) {
      query.selectEndDate = '';
    }
    
  }

  if ( query.selectEndDate ) {
    var endDate = moment(query.selectEndDate, 'YYYY-MM-DD');
    obj.dateStart = {
      $lt: endDate.toDate()
    };
  }

  if (startDate && endDate) {
    var newStartDate = moment(startDate),
        weekDay = [],
        len = endDate.dayOfYear() - startDate.dayOfYear()+1;
    
    if (len<7) {
      weekDay.push(newStartDate.day());//星期
      for (var i=0; i<len-1; i++) {
        weekDay.push(newStartDate.add(1, 'days').day())
      }
      obj.$or = [
        {
          availableDays: {
            $in: weekDay
          }
        },
        {
          longTerm: false
        },
        {
          longTerm:{ $exists : false }
        }
      ];
    }
  }

  Event.paginate(obj, {
    page: page,
    limit: 10,
    columns: 'title dateStart dateEnd summary location baseCharge currency thumbnail nickname createDate attendedDate',
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

    return res.render('event-list', {
      events: result.docs, 
      pager: pager, 
      itemCount: result.total, 
      dateNow: new Date(), 
      query: query
    });
  });
};