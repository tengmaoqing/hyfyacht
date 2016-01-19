/**
 * Created by qxj on 15/11/5.
 */
var express = require('express');
var router = express.Router();

var alipay = require('../controllers/alipay');

router.post('/alipay', alipay.submitDirectPayByUser);

module.exports = router;