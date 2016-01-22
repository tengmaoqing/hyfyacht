/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var booking = require('../controllers/booking');
var eventOrder = require('../controllers/event-order');
var user = require('../controllers/user');

router.get('/booking', booking.getBookingsByUserId);

router.get('/booking/detail/:bookingId', booking.getBookingByBookingId);

router.get('/event', eventOrder.getEventsByUserId);

router.get('/event/detail/:orderId', eventOrder.getEventByOrderId);

router.get('/setting', function(req, res, next){
  return res.render('user-setting')
});

router.post('/setting/updataUserInformation', user.updataUserInformation);

router.get('/setting/getUserInformation', user.getUserInformation);

module.exports = router;