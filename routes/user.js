/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

router.get('/booking', function(req, res, next){
  res.render('user-booking-list');
});

router.get('/booking/detail', function(req, res, next){
  res.render('user-booking-detail');
});

module.exports = router;