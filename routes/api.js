/**
 * Created by qxj on 16/1/20.
 */
var express = require('express');
var router = express.Router();

var holiday = require('../controllers/holiday');

router.get('/getHoliday', holiday.getPublicHolidaysForCal);
router.get('/checkHoliday', holiday.isPublicHoliday);

module.exports = router;