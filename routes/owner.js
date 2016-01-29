/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

var boat = require('../controllers/boat');
var booking = require('../controllers/booking');
var unavailable = require('../controllers/unavailable');
var wechatCore = require('wechat-core');
var owner = require('../controllers/owner');

router.get('/', boat.getBoatsByOwnerId);

router.get('/booking', booking.getBookingsByOwnerId);

router.get('/booking/detail/:bookingId', booking.getBookingByBookingIdForOwner);

router.get('/booking/cal/:bid', booking.getBookingsForOwnerCalendarEvent);
router.get('/booking/cal/unavailable/:bid', unavailable.getUnavailableEventByBoatId);

router.get('/unavailable/remove/:uid', unavailable.removeUnavailable);
router.post('/unavailable/set', unavailable.setUnavailable);

//router.get('/qrcode', function(req, res, next){
//  if(req.isFromWechat){
//    var url = 'http://' + req.hostname + req.originalUrl.split('#')[0];
//    res.render('owner-scan-qrcode', {wechatConfig: wechatCore.getConfigForFrontPage(url)});
//  }else {
//    res.render('owner-scan-qrcode');
//  }
//});

router.get('/boat', owner.getBoats);

router.get('/setting', function(req, res, next){
  res.render('owner-setting');
});

router.get('/setting/getOwnerInformation', owner.getOwnerInformation);
router.post('/setting/updateOwnerInformation', owner.updateOwnerInformation);

router.get('/:index', boat.getBoatsByOwnerId);

module.exports = router;