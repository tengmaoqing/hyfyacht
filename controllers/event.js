/**
 * Created by qxj on 15/12/22.
 */
var Event = require('hyfbase').Event;
var wechatCore = require('../lib/wechat/wechat-core');

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

exports.getEvents = function(req, res, next) {
  var page = req.query.page || 1;

  Event.paginate({
    inStock: true
  }, {
    page: page,
    limit: 10,
    columns: 'title dateStart dateEnd summary location baseCharge currency thumbnail organiser createDate',
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

    return res.render('event-list', {events: result.docs, pager: pager, itemCount: result.total});
  });
};