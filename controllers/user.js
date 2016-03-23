/**
 * Created by 2nd on 15/9/24.
 */
var crypto = require('crypto');
var User = require('hyfbase').User;
var config = require('../config');
var randomString = require('random-string');
var util = require('util');
var moment = require('moment');
var wechatCore = require('wechat-core');
var co = require('co');
var URI = require('urijs');

function hashPassword(password){
  return crypto.createHash('sha256').update(password).digest('base64').toString();
}

function setSessionAndCookie(req, res, user){
  req.session.user = user;

  if(user.wechatOpenId){
    req.session.wechat = user.wechatOpenId;
  }

  req.session.owner = false;

  if(user.role && user.role === 'owner'){
    req.session.owner = user.relatedOwner;
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
    }

    if(user){
      return res.render('signup', { error: 'error.signup.registered' });
    }

    var newUser = new User({
      mobile: mobile,
      nickname: req.body.mobile,
      hashedPassword: hashPassword(req.body.password),
      role: 'client',
      locale: req.getLocale()
    });

    newUser.save(function (err, savedUser) {
      if (err) {
        err.status = 400;
        return next(err);
      }

      setSessionAndCookie(req, res, savedUser);

      if(from){
        return res.redirect(encodeURI(from));
      }

      return res.redirect('/');
    });
  });
};

exports.login = function(req, res, next){
  var from = req.query.from || false;

  if(req.session.user){
    if(from) {
      return res.redirect(encodeURI(from));
    }

    return res.redirect('/');
  }

  if(!req.isFromWechat) {
    return res.render('login', {from: from});
  }

  if(req.query.state === '2' && req.query.code){
    var code = req.query.code;

    co(function *(){

      try {
        var data = yield new Promise(function (resolve, reject) {
          wechatCore.getUserAccessToken(code, function (err, response, result) {
            if (!result || err) {
              reject();
            } else {
              resolve(result);
            }
          })
        });

        data = JSON.parse(data);

        var checkResult = yield new Promise(function (resolve, reject) {
          wechatCore.checkUserAccessToken(data.access_token, data.openid, function (err, response, result) {
            if (err || !result) {
              reject();
            } else {
              resolve(result);
            }
          });
        });

        checkResult = JSON.parse(checkResult);

        if (checkResult.errcode !== 0) {
          var refreshResult = yield new Promise(function (resolve, reject) {
            wechatCore.refreshAccessToken(data.access_token, function (err, response, result) {
              if (err || !result) {
                reject();
              } else {
                resolve(result);
              }
            })
          });

          refreshResult = JSON.parse(refreshResult);

          data.access_token = refreshResult.access_token;
        }

        var userinfo = yield new Promise(function (resolve, reject) {
          wechatCore.getUserInfo(data.access_token, data.openid, function (err, response, result) {
            if (err || !result) {
              reject();
            } else {
              resolve(result);
            }
          })
        });
      }catch (e){
        throw e;
      }

      userinfo = JSON.parse(userinfo);

      var user = new User({
        nickname: userinfo.nickname,
        wechatOpenId: userinfo.openid,
        role: 'client',
        locale: req.getLocale(),
        sex: userinfo.sex,
        wechatUnionId: userinfo.unionid,
        avatar: userinfo.headimgurl
      });

      user.save(function (err) {
        if (err) {
          err.status = 400;
          return next(err);
        }

        setSessionAndCookie(req, res, user);

        var from = req.query.from;

        if(from) {
          return res.redirect(encodeURI(from));
        }

        return res.redirect('/');
      });
    }).catch(function(err){
      console.log(err.message);
      return res.render('login', {from: from});
    });
  }else{
    var origin_url = encodeURI('http://' + req.hostname + req.originalUrl);
    origin_url = URI(origin_url).query('');
    from = URI(from).removeQuery('code').removeQuery('state');
    origin_url.addQuery('from', from.toString());
    return res.redirect(wechatCore.getUrlForCodeScopeUserInfo(origin_url.toString(), '2'));
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
  }).select('mobile nickname hashedPassword role relatedOwner wechatOpenId').populate('relatedOwner', 'id').exec(function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }

    if (!user || hashPassword(req.body.password) != user.hashedPassword) {
      return res.render('login', { error: 'error.login.donotmatch', from: from });
    }

    setSessionAndCookie(req, res, user);

    if(from) {
      return res.redirect(encodeURI(from));
    }

    return res.redirect('/');
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
    }).select('mobile nickname role relatedOwner wechatOpenId avatar').populate('relatedOwner', 'id').exec(function(err, user){
      if (!err && user) {
        setSessionAndCookie(req, res, user);
      }
      return next();
    });
  }else{
    if(req.isFromWechat && !req.session.wechat){
      if(req.query.state === '1' && req.query.code){
        wechatCore.getUserAccessToken(req.query.code, function(err, response, data){
          if(!data || err) {
            return next();
          }

          var wechat = JSON.parse(data);

          if(wechat.errcode) {
            return next();
          }

          req.session.wechat = wechat.openid;

          User.findOne({
            wechatOpenId: wechat.openid
          }).select('mobile nickname role relatedOwner wechatOpenId avatar').populate('relatedOwner', 'id').exec(function(err, user){
            if (!err && user) {
              setSessionAndCookie(req, res, user);
            }
            return next();
          });
        });
      }else{
        var origin_url = encodeURI('http://' + req.hostname + req.originalUrl);
        return res.redirect(wechatCore.getUrlForCodeScopeBase(origin_url, '1'));
      }
    }else{
      return next();
    }
  }
};

exports.resetPassword = function(req, res, next){
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
      return res.render('reset-password', { error: 'error.signup.sms_expired' });
    }
  }

  if(!req.session.smsCode || !req.session.smsMobile || req.session.smsCode != req.body.code || req.session.smsMobile != mobile){
    return res.render('reset-password', { error: 'error.signup.sms' });
  }

  req.session.smsLast = null;
  req.session.smsCode = null;
  req.session.smsMobile = null;

  User.findOne({
    mobile: mobile
  }, function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(!user){
      return res.render('reset-password', { error: 'error.reset_password.noUser' });
    }

    user.hashedPassword = hashPassword(req.body.password);

    user.save(function (err, savedUser) {
      if (err) {
        err.status = 400;
        return next(err);
      }

      setSessionAndCookie(req, res, savedUser);

      if(from){
        return res.redirect(encodeURI(from));
      }

      return res.redirect('/');
    });
  });
};

exports.getUserInformation = function(req, res, next){
  var user = req.session.user;

  User.findOne({
    _id: user._id
  }, function(err, user){
    if(err){
      err.status = 400;
      return next(err);
    }

    if(user){
      return res.json(user);
    }

    var httpErr = new Error('Not Found');
    httpErr.status = 404;
    return next(httpErr);

  });
};

exports.updataUserInformation = function(req, res, next){
  var user = req.body;
  var flag = false;

  if (user.nickname) {
    req.checkBody ({
      'nickname' : {
        notEmpty : true,
        isLength : {
          options: [0, 16]
        },
        errorMessage: 'Invalid nickname'
      }
    });
  }

  if (user.newPwd) {
    req.checkBody({
      'newPwd' :{
        notEmpty:true,
        isLength: {
          options: [6, 30]
        },
        errorMessage: 'Invalid newPwd1'
      }
    });
  }

  if (user.newPwd1) {
    req.checkBody({
      'newPwd1' :{
        notEmpty:true,
        isLength: {
          options: [6, 30]
        },
        errorMessage: 'Invalid newPwd1'
      }
    });
  }

  if (user.email) {
    req.checkBody ({
      'email' : {
        notEmpty : true,
        isEmail : {

        },
        errorMessage: 'Invalid Email'
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

  var newMobile = user.area_code + user.newMobile;

  co(function *(){
    try {
      if (user.newMobile) {
        var hasMobile = yield User.findOne({
          mobile: newMobile
        }).exec();
      }
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if (user.newMobile) {

      if (hasMobile) {
        return res.json({ error: 'error.signup.registered' });
      }

      var now = moment();

      if(req.session.smsLast){
        var last = moment(req.session.smsLast);

        last.add(20, 'm');
        if(last < now){
          return res.json({ error: 'error.signup.sms_expired' });
        }
      }

      if(!req.session.smsCode || !req.session.smsMobile || req.session.smsCode != user.code || req.session.smsMobile != newMobile){
        return res.json({ error: 'error.signup.sms' });
      }

      req.session.smsLast = null;
      req.session.smsCode = null;
      req.session.smsMobile = null;

      flag = true;
    }
    

    User.findOne({
      _id: user._id
    }, function(err, doc){
      if(err){
        err.status = 400;
        return next(err);
      }
      
      if( doc.hashedPassword && user.newPwd1 ){
        if( !user.oldPwd || doc.hashedPassword != hashPassword(user.oldPwd) ){
          return res.json({ error: 'error.user_setting.notmatch' });
        }
      }
      
      if(!user.newPwd1 && !user.newMobile){
        doc.nickname = user.nickname;
        doc.email = user.email;
        doc.locale = user.locale;
        doc.currency = user.currency;
        doc.location = user.location ? {
          country : user.location.country,
          city : user.location.city
        } : {};
      } 
      if ( user.newPwd1 ) {
        doc.hashedPassword = hashPassword(user.newPwd1);
      }

      if (flag) {
        doc.mobile = newMobile;
        doc.hashedPassword = hashPassword(user.newPwd);
      }
      
      doc.save(function(err, savedUser){
        if(err){
          err.status = 400;
          return next(err);
        }

        if(user.newPwd1){
          return res.redirect('/');
        }
        
        return res.json(savedUser);
      });
    });
  });
};

exports.bindMobile = function (req, res, next) {
  
};
