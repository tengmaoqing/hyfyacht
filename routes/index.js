var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var username = false;

  if(req.session.username){
    username = req.session.username;
  }else if(req.signedCookies['client_attributes']){
    username = req.signedCookies['client_attributes'];
  }

  res.render('index', { title: 'HYF Yacht', username: username });
});

router.get('/signup', function(req, res, next){
  res.render('signup', { title: 'Sign Up' });
});

router.get('/login', function(req, res, next){
  res.render('login', { title: 'Login', error: false });
});

router.get('/logout', function(req, res, next){
  res.clearCookie('client_uid');
  res.clearCookie('client_attributes');
  req.session.destroy();
  res.redirect('/');
});

var user = require('../controllers/user');

router.post('/signup', user.signup);
router.post('/login', user.login);

module.exports = router;
