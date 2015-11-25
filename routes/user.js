/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var booking = require('../controllers/booking');

router.get('/booking', booking.getBookingsByUserId);

router.get('/booking/detail/:bookingId', booking.getBookingByBookingId);

module.exports = router;