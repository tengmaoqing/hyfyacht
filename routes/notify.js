/**
 * Created by qxj on 15/11/5.
 */
var express = require('express');
var router = express.Router();

var alipay = require('../controllers/alipay');
var paypal = require('../controllers/paypal');
var wechat = require('../controllers/wechat-pay');

router.post('/alipay/notify', alipay.notify);
router.get('/alipay/return', alipay.return);

router.get('/paypal/execute', paypal.executePayment);

router.post('/wechat/notify', wechat.notify);

module.exports = router;