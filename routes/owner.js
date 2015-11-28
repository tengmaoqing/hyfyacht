/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var owner = require('../controllers/owner');
var boat = require('../controllers/boat');
var booking = require('../controllers/booking');
var unavailable = require('../controllers/unavailable');

router.get('/', boat.getBoatsByOwnerId);


router.get('/booking', booking.getBookingsByOwnerId);

router.get('/booking/detail/:bookingId', booking.getBookingByBookingIdForOwner);

router.get('/booking/cal/:bid', booking.getBookingsForOwnerCalendarEvent);
router.get('/booking/cal/unavailable/:bid', unavailable.getUnavailableEventByBoatId);

router.get('/unavailable/remove/:uid', unavailable.removeUnavailable);
router.post('/unavailable/set', unavailable.setUnavailable);

router.get('/:index', boat.getBoatsByOwnerId);

module.exports = router;