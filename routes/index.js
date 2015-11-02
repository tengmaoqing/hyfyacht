var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/signup', function(req, res, next){
  res.render('signup');
});

router.get('/login', function(req, res, next){
  res.render('login');
});

router.get('/logout', function(req, res, next){
  res.clearCookie('client_uid');
  res.clearCookie('client_username');
  res.clearCookie('client_attributes');
  req.session.destroy();
  res.redirect('/');
});

var user = require('../controllers/user');

router.post('/signup', user.signup);
router.post('/login', user.login);

var owner = require('../controllers/owner');

router.get('/:link', owner.getOwnerByCustomLink);

module.exports = router;
