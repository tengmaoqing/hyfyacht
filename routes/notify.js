/**
 * Created by qxj on 15/11/5.
 */
var express = require('express');
var router = express.Router();

var alipay = require('../lib/alipay/alipay');

router.post('/alipay/notify', alipay.notify);
router.get('/alipay/return', alipay.return);

module.exports = router;