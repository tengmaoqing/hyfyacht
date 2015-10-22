/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var owner = require('../controllers/owner');

router.get('/', function(req, res, next){
  res.render('owner-calendar');
});

router.get('/booking', function(req, res, next){
  res.render('owner-booking-list');
});

router.get('/booking/detail', function(req, res, next){
  res.render('owner-booking-detail');
});

router.get('/:id', owner.getOwner);
router.get('/:id/:name', owner.getOwner);

module.exports = router;