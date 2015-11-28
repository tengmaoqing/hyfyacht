var express = require('express');
var router = express.Router();
var index = require('../controllers/index');

/* GET home page. */
router.get('/', index.renderIndex);

router.get('/signup', function(req, res, next){
  res.render('signup');
});

router.get('/logout', function(req, res, next){
  res.clearCookie('client_uid');
  res.clearCookie('client_username');
  res.clearCookie('client_attributes');
  req.session.destroy();
  res.redirect('/');
});

var user = require('../controllers/user');

router.get('/login', user.login);
router.post('/signup', user.signup);
router.post('/login', user.loginSubmit);

var owner = require('../controllers/owner');

router.get('/:id', owner.getOwner);
router.get('/:id/:name', owner.getOwner);
router.get('/:link', owner.getOwnerByCustomLink);

module.exports = router;
