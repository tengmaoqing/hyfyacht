/**
 * Created by qxj on 15/10/21.
 */
var Owner = require('../models/owner');
var Boat = require('../models/boat');
var Booking = require('../models/booking');

exports.getOwnerByCustomLink = function(req, res, next) {
  Owner.findOne({customLink:req.params.link}).select('nickname location description boats').populate('boats', 'id name type baseCharge currency location photos').exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(owner){
        return res.render('owner-boat-list', {owner: owner});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      }
    }
  });
};

exports.getOwner = function(req, res, next) {
  Owner.findOne({_id:req.params.id}).select('nickname location description boats').populate('boats', 'id name type baseCharge currency location photos').exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(owner){
        return res.render('owner-boat-list', {owner: owner});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      }
    }
  });
};
