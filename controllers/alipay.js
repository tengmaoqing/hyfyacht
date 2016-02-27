/**
 * Created by qxj on 16/1/19.
 */
var alipayConfig = require('../config').alipayConfig;
var alipayCore = require('alipay-core');
var message = require('../lib/message');
var Payment = require('hyfbase').Payment;
var Booking = require('hyfbase').Booking;
var EventOrder = require('hyfbase').EventOrder;
var co = require('co');

exports.submitDirectPayByUser = function(req, res, next){
  var product = req.query.product;
  var bookingId = req.query.order;

  co(function *() {
    var order = null;
    var show_url = null;
    var paymentDescription = null;

    try {
      if(product === 'boat'){
        order = yield Booking.findOne({bookingId: bookingId}).exec();
        show_url = 'http://localhost:3000/user/booking/detail/' + order.bookingId;
        paymentDescription = order.boatName + '-' + order.productName + '-' + order.packageName;
      }

      if(product === 'event'){
        order = yield EventOrder.findOne({orderId: bookingId}).exec();
        show_url = 'http://localhost:3000/user/event';
        paymentDescription = order.eventName;
      }
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if(!order){
      throw new Error('Order Not Found');
    }

    var total = (order.total / 100).toFixed(2);

    var parameter = {
      service: 'create_direct_pay_by_user',
      partner: alipayConfig.partner,
      seller_email: alipayConfig.seller_email,
      payment_type: '1',
      notify_url: alipayConfig.notify_url,
      return_url: alipayConfig.return_url,
      out_trade_no: bookingId,
      extra_common_param: product,
      it_b_pay: '29m',
      subject: paymentDescription,
      total_fee: total,
      body: paymentDescription,
      show_url: show_url,
      anti_phishing_key: '',
      exter_invoke_ip: req.headers['x-real-ip'],
      _input_charset: alipayConfig.input_charset
    };

    var params = alipayCore.buildRequestFormParams(parameter);

    var action = alipayConfig.alipay_gateway_new + '_input_charset=' + alipayConfig.input_charset.toLocaleLowerCase();

    return res.render('payment/alipay', {action: action, params: params});
  }).catch(function (err) {
    return next(err);
  });
};

exports.notify = function(req, res, next){
  co(function *(){
    var data = req.body;
    if(!data){
      throw new Error('No Body');
    }

    var isSign = alipayCore.getSignVerify(data, data.sign);

    if(!data.notify_id || !isSign){
      throw new Error('Sign Verify Fail');
    }

    try {
      var verifyResult = yield new Promise(function (resolve, reject) {
        alipayCore.verifyNotify(data.notify_id, function (err, response, result) {
          if (err) {
            reject();
          }

          resolve(result);
        });
      });
    } catch (err){
      throw err;
    }

    if(verifyResult.toLocaleLowerCase() !== 'true'){
      throw new Error('Notify Verify Fail');
    }

    var bookingId = data.out_trade_no;
    var product = data.extra_common_param;

    var order = null;

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
      if(payment.status === data.trade_status || payment.status === data.refund_status) {
        return res.send('success');
      }

      payment.status = data.trade_status || data.refund_status;

      payment.notify.push({
        notify_id: data.notify_id,
        notify_type: data.notify_type,
        notify_time: new Date(data.notify_time),
        trade_status: data.trade_status,
        refund_status: data.refund_status
      });
    }else{
      if((order.total / 100).toFixed(2) !== data.total_fee || alipayConfig.seller_email !== data.seller_email){
        throw new Error('Validate Fail');
      }

      payment = new Payment({
        bookingId: bookingId,
        product: product,
        type: 'alipay',
        tradeNo: data.trade_no,
        status: data.trade_status,
        detail: data,
        notify: [{
          notify_id: data.notify_id,
          notify_type: data.notify_type,
          notify_time: new Date(data.notify_time),
          trade_status: data.trade_status,
          refund_status: data.refund_status
        }]
      });
    }

    try {
      var savedPayment = yield payment.save();

      if(!savedPayment){
        throw new Error('Save Payment Fail');
      }

      if (data.trade_status !== 'TRADE_SUCCESS'){
        return res.send('success');
      }

      order.status = 'db.booking.pay_success';
      order.statusLogs.push({
        status: 'db.booking.pay_success',
        description: 'pay_success_alipay',
        updateDate: new Date()
      });

      order.payment = savedPayment.id;

      var savedOrder = yield order.save();

      if(!savedOrder){
        throw new Error('Save Order Fail');
      }

      message.sendPaySuccessMessage(res, product, bookingId);

      return res.send('success');
    } catch (err){
      err.status = 500;
      throw err;
    }
  }).catch(function(err){
    console.log(err.message);
    return res.send('fail');
  });

};

exports.return = function(req, res, next){
  var data = req.query;

  alipayCore.verifyNotify(data.notify_id, function(err, response, result){
    if(!err && result && result.toLocaleLowerCase() === 'true'){
      if(data.trade_status === 'TRADE_FINISHED' || data.trade_status === 'TRADE_SUCCESS') {
        return res.render('payment/result', {result: 'success', bookingId: data.out_trade_no, product: data.subject, type: data.extra_common_param});
      }
    }

    return res.render('payment/result', {result: 'fail', bookingId: data.out_trade_no, product: data.subject, type: data.extra_common_param});
  });
};