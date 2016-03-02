/**
 * Created by qxj on 15/10/21.
 */
var Owner = require('hyfbase').Owner;
var Boat = require('hyfbase').Boat;
var customLinkTest = require('../public/js/customLinkTest');
var co = require('co');

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

  req.checkBody({
    'nickname':{
      notEmpty:true,
      errorMessage: 'Invalid nickname'
    },
    'name':{
      notEmpty:true,
      errorMessage: 'Invalid name'
    },
    'mobile' :{
      notEmpty: true,
      errorMessage: 'Invalid mobile'
    }
  });

  if (owner.email){
    req.checkBody ({
      'email' : {
        notEmpty : true,
        isEmail : {

        },
        errorMessage: 'Invalid Email'
      }
    });
  }

  if(owner.newCustomLink){
    req.checkBody ({
      'newCustomLink' : {
        notEmpty : true,
        errorMessage: 'Invalid customLink'
      }
    });
  }

  var errors = req.validationErrors();
  if(errors){
    console.log(errors);
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return next(err);
  }

  if (owner.newCustomLink && customLinkTest[owner.newCustomLink]) {
    return res.json({ error: 'error.user_setting.customLink' });
  };

  co(function *(){
    try {
      var findCustomLink;
      if (owner.newCustomLink) {

        findCustomLink = yield Owner.findOne({
          customLink: owner.newCustomLink
        }).exec();
      }
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if (findCustomLink) {
      return res.json({ error: 'error.user_setting.customLink' });
    }

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
      owner.newCustomLink && (doc.customLink = owner.newCustomLink);
      doc.currency = owner.currency ;
      doc.location = owner.location ? {
        country : owner.location.country ,
        city : owner.location.city 
      } : {};
      doc.locale = owner.locale ;
      doc.description = owner.description;

      doc.save(function(err, newOwner){
        if(err){
          err.status = 400;
          return next(err);
        }

        res.json(newOwner);
      });
    });

  });
};


exports.getBoats = function(req, res, next){
  var ownerId = req.session.user.relatedOwner;
  var page = req.query.page || 1;

  Boat.paginate({
    owner: ownerId
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