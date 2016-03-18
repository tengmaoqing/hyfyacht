var express = require('express');
var URI = require('urijs');
var util = require('util');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var xmlParser = require('express-xml-bodyparser');
var mongoose = require('mongoose');
var csurf = require('csurf');
var expressValidator = require('express-validator');
var i18n = require('i18n');
var swig = require('swig');
var moment = require('moment');
var CronJob = require('cron').CronJob;
var cache = require('memory-cache');
var Booking = require('hyfbase').Booking;

var wechatCore = require('wechat-core');
var alipayCore = require('alipay-core');
var paypal = require('paypal-rest-sdk');
var config = require('./config');

//routes
var index = require('./routes/index');
var api = require('./routes/api');
var boat = require('./routes/boat');
var product = require('./routes/product');
var booking = require('./routes/booking');
var user = require('./routes/user');
var owner = require('./routes/owner');
var pay = require('./routes/pay');
var notify = require('./routes/notify');
var sms = require('./routes/sms');
var event = require('./routes/event');
var eventOrder = require('./routes/event-order');
var article = require('./routes/article');
var news = require('./routes/news');

var userController = require('./controllers/user');

var app = express();
app.set('trust proxy', 1);

//Environment mode
app.set('env', config.env);

//console log
app.use(logger('dev'));

// mongodb connection
mongoose.connect(config.dbPath);

// view engine setup
app.engine('.html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.set('view cache', false);
swig.setDefaults({
  cache: false
});

alipayCore.configure(config.alipayConfig);

wechatCore.configure(config.wechatConfig);
//wechatCore.getAppAccessToken();

//paypal.configure(config.paypalConfig);

//i18n init
i18n.configure({
  locales: ['en', 'zh-cn', 'zh-hk'],
  defaultLocale: 'zh-cn',
  cookie: 'client_locale',
  directory: path.join(__dirname, 'locales'),
  updateFiles: false,
  extension: '.json',
  objectNotation: true
});

app.use(i18n.init);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  type: function(req){
    return /x-www-form-urlencoded/.test(req.headers['content-type']);
  },
  extended: false
}));
app.use(xmlParser());
app.use(expressValidator());
app.use(cookieParser(config.cookieSecret));

if(config.staticMode === 'express') {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use(expressSession({
  secret: config.sessionSecret,
  //cookie:{
  //  maxAge: 20 * 60 * 1000
  //},
  resave: false,
  saveUninitialized: false
}));

//preset
var preset = {};

app.use(function(req, res, next){
  var ua = req.headers['user-agent'];

  var mobile = /mobile/i.test(ua);

  var wechat = ua.match(/micromessenger\/\d+\.\d+/i);
  var version = false;

  if(wechat) {
    version = String(wechat).split('/');
    version = parseInt(version[1].split('.')[0]);
    req.isFromWechat = version >= 5 ? true : false;
  }

  util._extend(preset,{
    ua: {
      mobile: mobile,
      wechat: version
    }
  });

  next();
});

//set i18n
app.use(function(req, res, next){
  var lang = req.query.lang || req.cookies['client_locale'];
  if(lang){
    req.setLocale(lang);
    res.cookie('client_locale', lang, config.unsignedCookieOption);
  }

  next();
});

//auto login
app.use(userController.autoLogin);

var removeSubdomain = function(req){
  if(req.subdomains && req.subdomains.length > 0){
    var arr = req.hostname.split('.');

    var result = arr.slice(req.subdomains.length);

    return result.join('.');

  }else{
    return req.hostname;
  }
};

app.use(function(req, res, next){
  var username = false;

  var avatar = null;
  if(req.signedCookies['client_username']){
    username = req.signedCookies['client_username'];
    avatar =  req.session.user.avatar ?  req.session.user.avatar : null;
  }

  util._extend(preset, {
    staticHost: config.staticMode === 'express' ? '' : 'http://static.' + removeSubdomain(req),
    imgHost: config.staticMode === 'express' ? '/img' : 'http://img.' + removeSubdomain(req) + '/base',
    originalUrl: req.originalUrl,
    username: username,
    avatar: avatar,
    locale: req.getLocale(),
    getUrlWithQuery: function(key, value){
      return URI(req.originalUrl).setQuery(key, value).toString();
    },
    getDateString: function(date){
      return moment(date).format('YYYY-MM-DD HH:mm');
    }
  });

  next();
});

//set currency
app.use(function(req, res, next){
  var currency = req.query.curr || req.cookies['client_currency'] || ( preset.locale == 'zh-cn' ? 'cny' : 'hkd');
  if(req.isFromWechat){
    currency = 'cny';
  }

  req.session.currency = currency;

  currency = currency == 'hkd' ? 'hkd' : 'cny';
  var prefix = currency == 'hkd' ? '$' : '￥';

  res.cookie('client_currency', currency, config.unsignedCookieOption);

  util._extend(preset, {
    currency: currency,
    configCurrency: config.currency,
    generateCharge: function(charge, baseCurrency){
      var amount = parseInt(charge * config.currency[currency] / config.currency[baseCurrency]);
      return prefix + (amount / 100).toFixed(2);
    }
  });

  next();
});

app.use(function(req, res, next){
  if(req.session.owner && req.session.owner != undefined){
    util._extend(preset, {
      owner: true
    });
  }else{
    util._extend(preset, {
      owner: false
    });
  }

  next();
});

//set default var
app.use(function(req, res, next){
  res.locals.preset = preset;

  next();
});

app.use('/notify', notify);
app.use('/api', api);

app.use(csurf());

app.use(function(req, res, next){
  res.locals._csrf = req.csrfToken();
  next();
});

//check user login status
app.use('/user', function(req, res, next){
  if (!req.session.user) {
    return res.redirect('/login?from=' + req.originalUrl);
  } else {
    next();
  }
});

//check owner login status
app.use('/owner', function(req, res, next){
  if (!req.session.owner) {
    if (!req.session.user) {
      return res.redirect('/login?from=' + req.originalUrl);
    }else{
      var err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
  } else {
    next();
  }
});

app.use('/boat', boat);
app.use('/product', product);
app.use('/event', event);
app.use('/eventorder', eventOrder);
app.use('/booking', booking);
app.use('/user', user);
app.use('/owner', owner);
app.use('/pay', pay);
app.use('/sms', sms);
app.use('/article', article);
app.use('/news', news);
app.use('/', index);

//check bookings, auto cancel booking if user do not pay after booking by 30m
var job = new CronJob({
  cronTime: '0 0-59/5 * * * *',
  onTick: function(){
    var date = moment().add(-30, 'minutes');
    Booking.update({
      status: 'db.booking.wait_to_pay',
      createDate: { $lte: date.toDate() }
    },{
      $set:{
        status: 'db.booking.cancel'
      },
      $push:{
        statusLogs: {
          status: 'db.booking.cancel',
          description: 'auto_cancel',
          updateDate: new Date()
        }
      }
    }, function(err){
    });
  },
  start: false
});

job.start();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {
      status: err.status
    }
  });
});

module.exports = app;
