/**
 * Created by qxj on 15/12/22.
 */
var Event = require('hyfbase').Event;

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
    }else {
      if(event) {
        res.render('event', {event: event});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      }
    }
  });
};

exports.getEvents = function(req, res, next) {
  res.render('event-list');
};