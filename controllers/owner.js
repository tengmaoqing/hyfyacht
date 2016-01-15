/**
 * Created by qxj on 15/10/21.
 */
var Owner = require('hyfbase').Owner;

exports.getOwnerByCustomLink = function(req, res, next) {
  Owner.getOwnerAndBoats({
    customLink:req.params.link
  }).exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(owner){
      return res.render('owner-boat-list', {owner: owner});
    }

    var httpErr = new Error('Not Found');
    httpErr.status = 404;
    return next(httpErr);
  });
};

exports.getOwner = function(req, res, next) {
  Owner.getOwnerAndBoats({
    _id:req.params.id
  }).exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(owner){
      return res.render('owner-boat-list', {owner: owner});
    }

    var httpErr = new Error('Not Found');
    httpErr.status = 404;
    return next(httpErr);
  });
};
