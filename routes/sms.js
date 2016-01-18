/**
 * Created by 2nd on 15/11/10.
 */
var express = require('express');
var router = express.Router();
var sms = require('../controllers/sms');

router.get('/getcode', sms.sendSMSCode);

module.exports = router;