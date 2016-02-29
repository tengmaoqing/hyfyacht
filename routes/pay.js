/**
 * Created by qxj on 15/11/5.
 */
var express = require('express');
var router = express.Router();

var alipay = require('../controllers/alipay');
var paypal = require('../controllers/paypal');

router.get('/alipay', alipay.submitDirectPayByUser);
router.get('/paypal', paypal.createPayment);

module.exports = router;