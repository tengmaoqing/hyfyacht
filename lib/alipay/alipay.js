/**
 * Created by qxj on 15/11/5.
 */
var alipayConfig = require('./alipay-config');
var alipayCore = require('./alipay-core');
var message = require('../message');
var Payment = require('hyfbase').Payment;
var Booking = require('hyfbase').Booking;
var EventOrder = require('hyfbase').EventOrder;

exports.submitDirectPayByUser = function(req, res, next){
  var parameter = {
    service: 'create_direct_pay_by_user',
    partner: alipayConfig.partner,
    seller_email: alipayConfig.seller_email,
    payment_type: '1',
    notify_url: alipayConfig.notify_url,
    return_url: alipayConfig.return_url,
    out_trade_no: req.body.WIDout_trade_no,
    extra_common_param: req.body.WIDextra_common_param,
    subject: req.body.WIDsubject,
    total_fee: req.body.WIDtotal_fee,
    body: req.body.WIDbody,
    show_url: req.body.WIDshow_url,
    anti_phishing_key: '',
    exter_invoke_ip: '',
    _input_charset: alipayConfig.input_charset
  };

  var params = alipayCore.buildRequestFormParams(parameter);

  var action = alipayConfig.alipay_gateway_new + '_input_charset=' + alipayConfig.input_charset.toLocaleLowerCase();

  return res.render('payment/alipay', {action: action, params: params});
};

exports.notify = function(req, res, next){
  alipayCore.verifyNotify(req, function(result){
    console.log(req.body);
    if(result.toLocaleLowerCase() == 'true'){
      var bookingId = req.body.out_trade_no;
      var product = req.body.extra_common_param;

      Payment.findOne({
        bookingId: bookingId,
        product: product
      }, function(err, payment){
        if(err){
          console.log('find payment err');
          return res.send('fail');
        }else{
          if(payment){

            if(payment.status != req.body.trade_status && payment.status != req.body.refund_status) {
              payment.status = req.body.trade_status || req.body.refund_status;

              payment.notify.push({
                notify_id: req.body.notify_id,
                notify_type: req.body.notify_type,
                notify_time: new Date(req.body.notify_time),
                trade_status: req.body.trade_status,
                refund_status: req.body.refund_status
              });

              payment.save(function (err) {
                if (err) {
                  console.log('save payment err');
                  return res.send('fail');
                } else {
                  if (req.body.trade_status == 'TRADE_SUCCESS') {
                    if (product == 'boat') {
                      Booking.update({
                        bookingId: bookingId
                      }, {
                        $set: {
                          status: 'db.booking.pay_success'
                        }
                      }, function (err) {
                        if (err) {
                          console.log('update booking err');
                          return res.send('fail');
                        } else {
                          message.sendPaySuccessMessage('boat', bookingId);
                          console.log('update booking success');
                          return res.send('success');
                        }
                      });
                    }else if(product == 'event'){
                      EventOrder.update({
                        orderId: bookingId
                      }, {
                        $set: {
                          status: 'db.booking.pay_success'
                        }
                      }, function (err) {
                        if (err) {
                          console.log('update event err');
                          return res.send('fail');
                        } else {
                          message.sendPaySuccessMessage('event', bookingId);
                          console.log('update event success');
                          return res.send('success');
                        }
                      });
                    }
                  }
                }
              });
            }else{
              console.log('status not change success');
              return res.send('success');
            }
          }else{
            if(product == 'boat') {
              Booking.findOne({
                bookingId: bookingId
              }, function (err, booking) {
                if (err || !booking) {
                  console.log('find booking err');
                  return res.send('fail');
                } else {
                  if ((booking.total / 100).toFixed(2) != req.body.total_fee || alipayConfig.seller_email != req.body.seller_email) {
                    console.log('info booking err');
                    return res.send('fail');
                  }

                  var newPayment = new Payment({
                    bookingId: bookingId,
                    product: product,
                    type: 'alipay',
                    tradeNo: req.body.trade_no,
                    status: req.body.trade_status,
                    detail: req.body,
                    notify: [{
                      notify_id: req.body.notify_id,
                      notify_type: req.body.notify_type,
                      notify_time: new Date(req.body.notify_time),
                      trade_status: req.body.trade_status,
                      refund_status: req.body.refund_status
                    }]
                  });

                  newPayment.save(function (err, result) {
                    if (err) {
                      console.log('new payment err');
                      return res.send('fail');
                    } else {
                      if (req.body.trade_status == 'TRADE_SUCCESS') {
                        booking.status = 'db.booking.pay_success';
                        booking.statusLogs.push({
                          status: 'db.booking.pay_success',
                          description: 'pay_success_alipay',
                          updateDate: new Date()
                        });
                        booking.payment = result.id;
                        booking.save(function (err) {
                          if (err) {
                            console.log('save booking err');
                            return res.send('fail');
                          } else {
                            message.sendPaySuccessMessage('boat', bookingId);
                            console.log('save booking success');
                            return res.send('success');
                          }
                        });
                      } else {
                        return res.send('success');
                      }
                    }
                  });
                }
              });
            }else if(product == 'event') {
              EventOrder.findOne({
                orderId: bookingId
              }, function (err, order) {
                if (err || !order) {
                  console.log('find order err');
                  return res.send('fail');
                } else {
                  if ((order.total / 100).toFixed(2) != req.body.total_fee || alipayConfig.seller_email != req.body.seller_email) {
                    console.log('info order err');
                    return res.send('fail');
                  }

                  var newPayment = new Payment({
                    bookingId: bookingId,
                    product: product,
                    type: 'alipay',
                    tradeNo: req.body.trade_no,
                    status: req.body.trade_status,
                    detail: req.body,
                    notify: [{
                      notify_id: req.body.notify_id,
                      notify_type: req.body.notify_type,
                      notify_time: new Date(req.body.notify_time),
                      trade_status: req.body.trade_status,
                      refund_status: req.body.refund_status
                    }]
                  });

                  newPayment.save(function (err, result) {
                    if (err) {
                      console.log('new payment err');
                      return res.send('fail');
                    } else {
                      if (req.body.trade_status == 'TRADE_SUCCESS') {
                        order.status = 'db.booking.pay_success';
                        order.statusLogs.push({
                          status: 'db.booking.pay_success',
                          description: 'pay_success_alipay',
                          updateDate: new Date()
                        });
                        order.payment = result.id;
                        order.save(function (err) {
                          if (err) {
                            console.log('save booking err');
                            return res.send('fail');
                          } else {
                            message.sendPaySuccessMessage('event', bookingId);
                            console.log('save booking success');
                            return res.send('success');
                          }
                        });
                      } else {
                        return res.send('success');
                      }
                    }
                  });
                }
              });
            }
          }
        }
      });
    }else{
      console.log('verify  err');
      return res.send('fail');
    }
  });
};

exports.return = function(req, res, next){
  alipayCore.verifyReturn(req, function(result){
    if(result.toLocaleLowerCase() == 'true'){
      if(req.query.trade_status == 'TRADE_FINISHED' || req.query.trade_status == 'TRADE_SUCCESS') {
        return res.render('payment/result', {result: 'success', bookingId: req.query.out_trade_no, product: req.query.subject, type: req.query.extra_common_param});
      }
    }

    return res.render('payment/result', {result: 'fail', bookingId: req.query.out_trade_no, product: req.query.subject, type: req.query.extra_common_param});
  });
};