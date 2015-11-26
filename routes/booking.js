/**
 * Created by qxj on 15/10/13.
 */
var express = require('express');
var router = express.Router();

var booking = require('../controllers/booking');

router.get('/', function(req, res, next){
  res.render('booking-info');
});

router.get('/cal/:bid', booking.getBookingsForCalendarEvent);

router.get('/submit', booking.checkBooking);
router.post('/submit', booking.checkBooking);

module.exports = router;