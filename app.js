var express = require('express');
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

//config
var config = require('./config');

var routes = require('./routes/index');

var app = express();

//Environment mode
//app.set('env', 'production');

//console log
app.use(logger('dev'));

// mongodb connection
mongoose.connect(config.dbPath);

// view engine setup
app.engine('.html', require('swig').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

//i18n
i18n.configure({
  locales: ['en', 'zh-cn', 'zh-hk', 'zh-tw'],
  defaultLocale: 'zh-cn',
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

app.use(function(req, res, next){
  var _render = res.render;

  var username = false;

  if(req.session.username){
    username = req.session.username;
  }else if(req.signedCookies['client_attributes']){
    username = req.signedCookies['client_attributes'];
  }

  res.render = function(view, options, fn){
    util._extend(options, {
      preset: {
        staticHost: config.staticMode === 'express' ? '' : 'http://static.' + req.hostname,
        username: username
      }
    });
    _render.call(this, view, options, fn);
  };

  next();
});

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
    error: {}
  });
});

module.exports = app;
