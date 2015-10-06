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
    'email': {
      notEmpty: true,
      isEmail: true,
      errorMessage: 'Invalid Email'
    },
    'password': {
      notEmpty: true,
      isLength: {
        options: [6, 30]
      },
      errorMessage: 'Invalid Password'
    },
    'username': {
      notEmpty: true,
      isLength: {
        options: [1, 30]
      },
      errorMessage: 'Invalid Username'
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return next(err);
  }

  var user = new User({
    username: req.body.username,
    email: req.body.email,
    hashedPassword: hashPassword(req.body.password)
  });

  user.save(function (err) {
    if (err) {
      err.status = 400;
      return next(err);
    } else {
      req.session.username = user.username;
      res.cookie('client_attributes', user.id, config.cookieOption);
      res.cookie('client_uid', randomString({length: 6}), config.cookieOption);

      res.redirect('/');
    }
  });
};

exports.login = function(req, res, next){
  req.checkBody({
    'email': {
      notEmpty: true,
      isEmail: true,
      errorMessage: 'Invalid Email'
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
    email: req.body.email
  }, 'username hashedPassword', function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if (!user || hashPassword(req.body.password) != user.hashedPassword) {
        res.render('login', { title: 'Login', error: 'Invalid Email or Password.' });
      } else {
        req.session.username = user.username;
        res.cookie('client_attributes', user.id, config.cookieOption);
        res.cookie('client_uid', randomString({length: 6}), config.cookieOption);

        res.redirect('/');
      }
    }
  });
};