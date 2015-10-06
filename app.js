var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var mongoStore = require('connect-mongo')(expressSession);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var csurf = require('csurf');
var expressValidator = require('express-validator');
var FileStreamRotator = require('file-stream-rotator');
var fs = require('fs');

//config
var config = require('./config');

var routes = require('./routes/index');

var app = express();

//Environment mode
//app.set('env', 'production');

//Access Log
var accessLogDirectory = __dirname + '/log/access';

fs.existsSync(accessLogDirectory) || fs.mkdirSync(accessLogDirectory);

var accessLogStream = FileStreamRotator.getStream({
  filename: accessLogDirectory + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false,
  date_format: 'YYYYMMDD'
});

app.use(logger('combined', {stream: accessLogStream}));

//console log
app.use(logger('dev'));

// mongodb connection
var conn = mongoose.connect(config.dbPath);

// view engine setup
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser(config.cookieSecret));
app.use(express.static(path.join(__dirname, 'public')));

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
