var express = require('express');
var router = express.Router();
var index = require('../controllers/index');

/* GET home page. */
router.get('/', index.renderIndex);

router.get('/about.html', function(req, res, next){
  return res.render('static', {page: 'about'});
});

router.get('/contact.html', function(req, res, next){
  return res.render('static', {page: 'contact'});
});

router.get('/terms.html', function(req, res, next){
  return res.render('static', {page: 'terms'});
});

router.get('/privacy.html', function(req, res, next){
  return res.render('static', {page: 'privacy'});
});

router.get('/disclaimer.html', function(req, res, next){
  return res.render('static', {page: 'disclaimer'});
});

router.get('/copyright.html', function(req, res, next){
  return res.render('static', {page: 'copyright'});
});

router.get('/resetpass', function(req, res, next){
  return res.render('reset-password');
});

router.get('/signup', function(req, res, next){
  return res.render('signup');
});

router.get('/logout', function(req, res, next){
  res.clearCookie('client_uid');
  res.clearCookie('client_username');
  res.clearCookie('client_attributes');
  req.session.destroy();
  return res.redirect('/');
});

var user = require('../controllers/user');

router.get('/login', user.login);
router.post('/signup', user.signup);
router.post('/login', user.loginSubmit);
router.post('/resetpass', user.resetPassword);

var owner = require('../controllers/owner');

router.get('/:link', owner.getOwnerByCustomLink);

router.get('/:id', owner.getOwner);
router.get('/:id/:name', owner.getOwner);

module.exports = router;
