var express = require('express');
var URI = require('urijs');
var util = require('util');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var mongoStore = require('connect-mongo')(expressSession);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var csurf = require('csurf');
var expressValidator = require('express-validator');
var i18n = require('i18n');
var swig = require('swig');

//config
var config = require('./config');

var tools = require('./tools');

//routes
var routes = require('./routes/index');
var boat = require('./routes/boat');
var product = require('./routes/product');
var booking = require('./routes/booking');
var user = require('./routes/user');
var owner = require('./routes/owner');

var app = express();

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

//i18n init
i18n.configure({
  locales: ['en', 'zh-cn', 'zh-hk'],
  defaultLocale: 'zh-cn',
  cookie: 'client_locale',
  directory: path.join(__dirname, 'locales'),
  updateFiles: false,
  extension: '.js',
  objectNotation: true
});

app.use(i18n.init);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser(config.cookieSecret));

if(config.staticMode === 'express') {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use(expressSession({
  secret: config.sessionSecret,
  //cookie: {
  //  maxAge: 10*60*1000,
  //  httpOnly: true
  //},
  store: new mongoStore({
    mongooseConnection: mongoose.connection
  }),
  resave: false,
  saveUninitialized: false
}));

app.use(csurf());

app.use(function(req, res, next){
  res.locals._csrf = req.csrfToken();
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

var preset = {};

//preset
app.use(function(req, res, next){
  var username = false;

  if(req.session.username){
    username = req.session.username;
  }else if(req.signedCookies['client_attributes']){
    username = req.signedCookies['client_attributes'];
  }

  util._extend(preset, {
    staticHost: config.staticMode === 'express' ? '' : 'http://static.' + req.hostname,
    imgHost: config.staticMode === 'express' ? '/img' : 'http://img.' + req.hostname + '/base',
    originalUrl: req.originalUrl,
    username: username,
    locale: req.getLocale(),
    code: tools.code,
    getUrlWithQuery: function(key, value){
      return URI(req.originalUrl).setQuery(key, value).toString();
    }
  });

  next();
});

//set currency
app.use(function(req, res, next){
  if(req.query.curr){
    res.cookie('client_currency', req.query.curr, config.unsignedCookieOption);
  }

  next();
});

//set default var before view engine render views
app.use(function(req, res, next){
  var _render = res.render;

  res.render = function(view, options, fn){
    options = options || {};

    util._extend(options, {
      preset: preset
    });
    _render.call(this, view, options, fn);
  };

  next();
});

app.use('/boat', boat);
app.use('/product', product);
app.use('/booking', booking);
app.use('/user', user);
app.use('/owner', owner);
app.use('/', routes);


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
