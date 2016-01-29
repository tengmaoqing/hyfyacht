/**
 * Created by qxj on 15/10/21.
 */
var Owner = require('hyfbase').Owner;
var Boat = require('hyfbase').Boat;

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

    doc.name = owner.name;
    doc.mobile = owner.mobile;
    doc.email = owner.email;
    doc.nickname = owner.nickname;
    doc.customLink = owner.customLink;
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


exports.getBoats = function(req, res, next){
  var ownerId = req.session.user.relatedOwner;
  var page = req.query.page || 1;

  Boat.paginate({
    owner: ownerId,
    display: true
  },{
    page: page,
    limit: 10,
    columns: '_id serialNumber name length capacity type baseCharge currency thumbnail createDate',
    sort: {
      createDate: -1
    }
  }, function(err, result){
    if(err){
      err.status = 400;
      return next(err);
    }

    var pager = {
      current: parseInt(page),
      count: result.pages,
      pages: []
    };
    for (var i = 1; i <= result.pages; i++) {
      pager.pages.push(i);
    }

    return res.render('owner-boat', {boats: result.docs, pager: pager, itemCount: result.total})
  });
}