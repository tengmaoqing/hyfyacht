/**
 * Created by 2nd on 15/9/24.
 */
var crypto = require('crypto');
var User = require('../models/user');
var config = require('../config');
var randomString = require('random-string');
var util = require('util');
var moment = require('moment');
var wechatCore = require('../lib/wechat/wechat-core');

function hashPassword(password){
  return crypto.createHash('sha256').update(password).digest('base64').toString();
}

function setSessionAndCookie(req, res, user){
  req.session.user = user;

  if(user.wechatOpenId){
    req.session.wechat = user.wechatOpenId;
  }

  if(user.role && user.role == 'owner'){
    req.session.owner = user.relatedOwner;
  }else{
    req.session.owner = false;
  }
  res.cookie('client_username', user.nickname, config.cookieOption);
  res.cookie('client_attributes', user.id, config.cookieOption);
  res.cookie('client_uid', randomString({length: 6}), config.cookieOption);
}

exports.signup = function(req, res, next){
  var from = req.query.from || false;

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
        hashedPassword: hashPassword(req.body.password),
        role: 'client'
      });

      newUser.save(function (err) {
        if (err) {
          err.status = 400;
          return next(err);
        } else {
          setSessionAndCookie(req, res, newUser);

          if(from){
            return res.redirect(encodeURI(from));
          }else {
            return res.redirect('/');
          }
        }
      });
    }
  });
};

exports.login = function(req, res, next){
  var from = req.query.from || false;

  if(req.isFromWechat && !req.session.user){
    if(req.query.state == '2' && req.query.code){
      var code = req.query.code;

      wechatCore.getAccessToken(code, function(data){
        if(data){
          wechatCore.checkAccessTokenAndRefresh(data, function(wechat){
            req.session.wechat = wechat.openid;
            req.session.wechatCreateTime = new Date();
            wechatCore.getUserInfo(wechat.access_token, wechat.openid, function(wechat_user){
              var wechat_user = JSON.parse(wechat_user);

              var user = new User({
                nickname: wechat_user.nickname,
                wechatOpenId: wechat.openid,
                role: 'client'
              });

              user.save(function (err) {
                if (err) {
                  err.status = 400;
                  return next(err);
                } else {
                  setSessionAndCookie(req, res, user);

                  var from = req.query.from;

                  if(!from) {
                    return res.redirect('/');
                  }else{
                    return res.redirect(encodeURI(from));
                  }
                }
              });
            });
          });
        }else {
          res.render('login', { from: from});
        }
      });
    }else{
      var origin_url = encodeURI('http://' + req.hostname + req.originalUrl);
      return res.redirect(wechatCore.getUrlForCodeScopeUserInfo(origin_url));
    }
  }else if(req.isFromWechat && req.session.user){
    var from = req.query.from || false;

    if(!from) {
      return res.redirect('/');
    }else{
      return res.redirect(encodeURI(from));
    }
  } else {
    res.render('login', { from: from});
  }
};

exports.loginSubmit = function(req, res, next){
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
  }).select('nickname hashedPassword role relatedOwner').populate('relatedOwner', 'id').exec(function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if (!user || hashPassword(req.body.password) != user.hashedPassword) {
        return res.render('login', { error: 'error.login.donotmatch', from: from });
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
  if(req.session.user){
    return next();
  }

  var uid = req.signedCookies['client_attributes'];

  if(uid){
    User.findOne({
      _id: uid
    }).select('nickname role relatedOwner wechatOpenId').populate('relatedOwner', 'id').exec(function(err, user){
      if (!err && user) {
        setSessionAndCookie(req, res, user);
      }
      return next();
    });
  }else{
    if(req.isFromWechat && !req.session.wechat){
      if(req.query.state == '1' && req.query.code){
        wechatCore.getAccessToken(req.query.code, function(data){
          if(!data) {
            return next();
          }

          var wechat = JSON.parse(data);

          if(wechat.errcode) {
            return next();
          }

          req.session.wechat = wechat.openid;
          req.session.wechatCreateTime = new Date();

          User.findOne({
            wechatOpenId: wechat.openid
          }).select('nickname role relatedOwner').populate('relatedOwner', 'id').exec(function(err, user){
            if (!err && user) {
              setSessionAndCookie(req, res, user);
            }
            return next();
          });
        });
      }else{
        var origin_url = encodeURI('http://' + req.hostname + req.originalUrl);
        return res.redirect(wechatCore.getUrlForCodeScopeBase(origin_url));
      }
    }else{
      return next();
    }
  }
};