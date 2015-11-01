/**
 * Created by qxj on 15/10/13.
 */
var express = require('express');
var router = express.Router();

var booking = require('../controllers/booking');

router.get('/', function(req, res, next){
  res.render('booking-info');
});

router.get('/result', function(req, res, next){
  res.render('booking-result');
});

router.get('/insert', booking.insert);

module.exports = router;