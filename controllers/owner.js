/**
 * Created by qxj on 15/10/21.
 */
var Owner = require('../models/owner');
var Boat = require('../models/boat');
var tools = require('../tools');

exports.getOwnerByCustomLink = function(req, res, next) {
  Owner.findOne({customLink:req.params.link}).select('nickname location boats').populate('boats', '_id name type baseCharge location photos').exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(owner){
        res.render('owner-boat-list', {owner: owner, code: tools.code});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
};

exports.getOwner = function(req, res, next) {
  Owner.findOne({_id:tools.decode(req.params.id)}).select('nickname location boats').populate('boats', '_id name type baseCharge location photos').exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(owner){
        res.render('owner-boat-list', {owner: owner, code: tools.code});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
};
