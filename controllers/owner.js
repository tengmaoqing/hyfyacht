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

exports.getOwnerInformation = function(req, res, next) {
  var ownerId = req.session.user.relatedOwner;

  Owner.findOne({
    _id:ownerId
  }).exec(function(err, owner){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(owner){
      return res.json(owner);
    }

    var httpErr = new Error('Not Found');
    httpErr.status = 404;
    return next(httpErr);

  });
};

exports.updateOwnerInformation = function(req, res, next){
  var owner = req.body;

  Owner.findOne({
    _id:owner._id
  }).exec(function(err, doc){
    if(err){
      err.status = 400;
      return next(err);
    }
    console.log(doc)

    doc.name = owner.name;
    doc.mobile = owner.mobile;
    doc.email = owner.email;
    doc.nickname = owner.nickname;
    doc.currency = owner.currency ? owner.currency.value : '';
    doc.location = owner.location ? {
      country : owner.location.country ? owner.location.country.value : '',
      city : owner.location.city ? owner.location.city.value : ''
    } : {};
    doc.locale = owner.locale ? owner.locale.value : '';
    doc.description = owner.description;

    doc.save(function(err, newOwner){
      if(err){
        err.status = 400;
        return next(err);
      }

      res.json(newOwner);
    });
  });
};
