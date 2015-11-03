/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var booking = require('../controllers/booking');

router.get('/booking', booking.getBookings);

router.get('/booking/detail', function(req, res, next){
  res.render('user-booking-detail');
});

module.exports = router;