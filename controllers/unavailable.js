/**
 * Created by qxj on 15/11/28.
 */
var Unavailable = require('../models/unavailable');
var moment = require('moment');

exports.getUnavailableEventByBoatId = function(req, res, next){
  var start = new Date(req.query.start);
  var end = new Date(req.query.end);

  Unavailable.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: start,
      $lt: end
    }
  }, function(err, unavailables){
    if(err){
      err.status = 400;
      return res.json(err);
    }else{
      if(!unavailables){
        var err = new Error('Not Found');
        err.status = 404;
        return res.json(err);
      }else{
        var events = [];
        for(var i = 0; i < unavailables.length; i++){
          events.push({
            title: " ",
            start: moment(unavailables[i].dateStart).format('YYYY-MM-DDTHH:mm'),
            end: moment(unavailables[i].dateEnd).format('YYYY-MM-DDTHH:mm'),
            ownerDisabled: true,
            uid: unavailables[i].id,
            allDay: false
          });
        }
        return res.json(events);
      }
    }
  });
};

exports.setUnavailable = function(req, res, next){
  req.checkBody({
    'boatId': {
      notEmpty: true,
      errorMessage: 'Invalid Boat'
    },
    'dateStart': {
      notEmpty: true,
      errorMessage: 'Invalid Start Time'
    },
    'dateEnd': {
      notEmpty: true,
      errorMessage: 'Invalid End Time'
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return res.json(err);
  }

  var unavailable = new Unavailable({
    boatId: req.body.boatId,
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd
  });

  unavailable.save(function(err, savedUnavailable){
    if(err){
      err.status = 400;
      return res.json(err);
    }else{
      return res.json({result:true});
    }
  });
};

exports.removeUnavailable = function(req, res, next){
  var uid = req.params.uid;

  if(uid){
    Unavailable.remove({
      _id: uid
    }, function(err){
      if(err){
        err.status = 400;
        return res.json(err);
      }else{
        return res.json({result:true});
      }
    });
  }else{
    return res.json({result:false});
  }
};