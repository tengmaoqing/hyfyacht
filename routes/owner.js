/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('owner-calendar');
});

router.get('/booking', function(req, res, next){
  res.render('owner-booking-list');
});

router.get('/booking/detail', function(req, res, next){
  res.render('owner-booking-detail');
});

module.exports = router;