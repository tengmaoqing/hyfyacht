/**
 * Created by qxj on 16/1/16.
 */
var wechatCore = require('wechat-core');
var wechatConfig = require('../config').wechatConfig;
var xml2js = require('xml2js');
var xmlBuilder = new xml2js.Builder({
  rootName: 'xml'
});
var tools = require('./lib/tools');
var message = require('./lib/message');
var Payment = require('hyfbase').Payment;
var Booking = require('hyfbase').Booking;
var EventOrder = require('hyfbase').EventOrder;
var co = require('co');

var resultFAIL = xmlBuilder.buildObject({
  return_code: 'FAIL'
});

var resultSUCCESS = xmlBuilder.buildObject({
  return_code: 'SUCCESS',
  return_msg: 'OK'
});

exports.notify = function(req, res, next){
  res.set('Content-Type', 'text/xml');

  var data = req.body;

  data = tools.ripXMLCDATA(data.xml);

  if(!wechatCore.verifySign(data) || data.return_code !== 'SUCCESS'){
    return res.send(resultFAIL);
  }

  if(data.result_code !== 'SUCCESS') {
    return res.send(resultSUCCESS);
  }

  var bookingId = data.out_trade_no;
  var product = data.attach;

  co(function *(){
    var order = false;

    try {
      var payment = yield Payment.findOne({
        bookingId: bookingId,
        product: product
      }).exec();

      if(product === 'boat'){
        order = yield Booking.findOne({bookingId: bookingId}).exec();
      }

      if(product === 'event'){
        order = yield EventOrder.findOne({orderId: bookingId}).exec();
      }

    } catch (err){
      err.status = 500;
      throw err;
    }

    if(!order){
      throw new Error('Order Not Found');
    }

    if(payment){
      if(payment.status === data.result_code) {
        return res.send(resultSUCCESS);
      }

      payment.status = data.result_code;

      payment.notify.push({
        notify_id: data.transaction_id,
        notify_type: 'wechat',
        notify_time: new Date(),
        trade_status: data.result_code
      });
    }else{
      if (order.total !== parseInt(data.total_fee) || wechatConfig.appid != data.appid) {
        throw new Error('Validate Fail');
      }

      payment = new Payment({
        bookingId: bookingId,
        product: product,
        type: 'wechat',
        tradeNo: data.transaction_id,
        status: data.result_code,
        detail: data,
        notify: [{
          notify_id: data.transaction_id,
          notify_type: 'wechat',
          notify_time: new Date(),
          trade_status: data.result_code
        }]
      });
    }

    try {
      var savedPayment = yield payment.save();

      if(!savedPayment){
        throw new Error('Save Payment Fail');
      }

      order.status = 'db.booking.pay_success';
      order.statusLogs.push({
        status: 'db.booking.pay_success',
        description: 'pay_success_wechat',
        updateDate: new Date()
      });

      order.payment = savedPayment.id;

      var savedOrder = yield order.save();

      if(!savedOrder){
        throw new Error('Save Order Fail');
      }

      message.sendPaySuccessMessage(product, bookingId);

      return res.send(resultSUCCESS);
    } catch (err){
      err.status = 500;
      throw err;
    }

  }).catch(function(err){
    console.log(err.message);
    return res.send(resultFAIL);
  });
};