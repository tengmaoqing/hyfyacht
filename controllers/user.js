/**
 * Created by 2nd on 15/9/24.
 */
var crypto = require('crypto');
var User = require('../models/user');
var config = require('../config');
var randomString = require('random-string');
var util = require('util');

function hashPassword(password){
  return crypto.createHash('sha256').update(password).digest('base64').toString();
}

exports.signup = function(req, res, next){
  req.checkBody({
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

  //request sms code api
  if(false){
    res.render('signup', { error: 'error.signup.sms' });
    return;
  }

  User.findOne({
    mobile: req.body.mobile
  }, 'mobile', function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(user){
        res.render('signup', { error: 'error.signup.registered' });
        return;
      }

      var newUser = new User({
        mobile: req.body.mobile,
        hashedPassword: hashPassword(req.body.password),
        role: "client"
      });

      newUser.save(function (err) {
        if (err) {
          err.status = 400;
          return next(err);
        } else {
          req.session.username = newUser.mobile;
          res.cookie('client_attributes', newUser.id, config.cookieOption);
          res.cookie('client_uid', randomString({length: 6}), config.cookieOption);

          res.redirect('/');
        }
      });
    }
  });
};

exports.login = function(req, res, next){
  var from = req.query.from || false;

  req.checkBody({
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

  User.findOne({
    mobile: req.body.mobile
  }, 'mobile hashedPassword', function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if (!user || hashPassword(req.body.password) != user.hashedPassword) {
        res.render('login', { error: 'error.login.donotmatch' });
      } else {
        req.session.username = user.mobile;
        res.cookie('client_attributes', user.id, config.cookieOption);
        res.cookie('client_uid', randomString({length: 6}), config.cookieOption);

        if(!from) {
          res.redirect('/');
        }else{
          res.redirect(encodeURI(from));
        }
      }
    }
  });
};