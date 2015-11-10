/**
 * Created by 2nd on 15/9/24.
 */
var crypto = require('crypto');
var User = require('../models/user');
var config = require('../config');
var randomString = require('random-string');
var util = require('util');
var moment = require('moment');

function hashPassword(password){
  return crypto.createHash('sha256').update(password).digest('base64').toString();
}

function setSessionAndCookie(req, res, user){
  req.session.userId = user.id;
  res.cookie('client_username', user.nickname, config.cookieOption);
  res.cookie('client_attributes', user.id, config.cookieOption);
  res.cookie('client_uid', randomString({length: 6}), config.cookieOption);
}

exports.signup = function(req, res, next){
  req.checkBody({
    'area_code': {
      notEmpty: true,
      errorMessage: 'Invalid Area Code'
    },
    'mobile': {
      notEmpty: true,
      errorMessage: 'Invalid Mobile Number'
    },
    'password': {
      notEmpty: true,
      isLength: {
        options: [6, 30]
      },
      errorMessage: 'Invalid Password'
    },
    'code': {
      notEmpty: true,
      errorMessage: 'Invalid SMS Code'
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return next(err);
  }

  var mobile = req.body.area_code + req.body.mobile;

  var now = moment();

  if(req.session.smsLast){
    var last = moment(req.session.smsLast);

    last.add(20, 'm');
    if(last < now){
      return res.render('signup', { error: 'error.signup.sms_expired' });
    }
  }

  if(!req.session.smsCode || !req.session.smsMobile || req.session.smsCode != req.body.code || req.session.smsMobile != mobile){
    return res.render('signup', { error: 'error.signup.sms' });
  }

  req.session.smsLast = null;
  req.session.smsCode = null;
  req.session.smsMobile = null;

  User.findOne({
    mobile: mobile
  }, 'mobile', function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(user){
        return res.render('signup', { error: 'error.signup.registered' });
      }

      var newUser = new User({
        mobile: mobile,
        nickname: req.body.mobile,
        hashedPassword: hashPassword(req.body.password)
      });

      newUser.save(function (err) {
        if (err) {
          err.status = 400;
          return next(err);
        } else {
          setSessionAndCookie(req, res, newUser);

          return res.redirect('/');
        }
      });
    }
  });
};

exports.login = function(req, res, next){
  var from = req.query.from || false;

  req.checkBody({
    'area_code': {
      notEmpty: true,
      errorMessage: 'Invalid Area Code'
    },
    'mobile': {
      notEmpty: true,
      errorMessage: 'Invalid Mobile'
    },
    'password': {
      notEmpty: true,
      isLength: {
        options: [6, 30]
      },
      errorMessage: 'Invalid Password'
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return next(err);
  }

  var mobile = req.body.area_code + req.body.mobile;

  User.findOne({
    mobile: mobile
  }, 'nickname hashedPassword', function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if (!user || hashPassword(req.body.password) != user.hashedPassword) {
        return res.render('login', { error: 'error.login.donotmatch' });
      } else {
        setSessionAndCookie(req, res, user);

        if(!from) {
          return res.redirect('/');
        }else{
          return res.redirect(encodeURI(from));
        }
      }
    }
  });
};

exports.autoLogin = function(req, res, next){
  var uid = req.signedCookies['client_attributes'];

  if(!req.session.userId && uid){
    User.findOne({
      _id: uid
    }, 'nickname', function(err, user){
      if (!err && user) {
        setSessionAndCookie(req, res, user);
      }
      return next();
    });
  }else{
    return next();
  }
};