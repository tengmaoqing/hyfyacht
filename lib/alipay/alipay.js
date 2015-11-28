/**
 * Created by qxj on 15/11/5.
 */
var alipayConfig = require('./alipay-config');
var alipayCore = require('./alipay-core');
var Payment = require('../../models/payment');
var Booking = require('../../models/booking');

exports.submitDirectPayByUser = function(req, res, next){
  var parameter = {
    service: 'create_direct_pay_by_user',
    partner: alipayConfig.partner,
    seller_email: alipayConfig.seller_email,
    payment_type: '1',
    notify_url: alipayConfig.notify_url,
    return_url: alipayConfig.return_url,
    out_trade_no: req.body.WIDout_trade_no,
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
    if(result.toLocaleLowerCase() == 'true'){
      var bookingId = req.body.out_trade_no;

      Payment.findOne({
        bookingId: bookingId
      }, function(err, payment){
        if(err){
          return res.send('fail');
        }else{
          if(payment){
            payment.status = req.body.trade_status || req.body.refund_status;

            payment.notify.push({
              notify_id: req.body.notify_id,
              notify_type: req.body.notify_type,
              notify_time: new Date(req.body.notify_time),
              trade_status: req.body.trade_status,
              refund_status: req.body.refund_status
            });

            payment.save(function(err){
              if(err){
                return res.send('fail');
              }else{
                if(req.body.trade_status == 'TRADE_SUCCESS') {
                  Booking.update({
                    bookingId: bookingId
                  },{
                    $set: {
                      status: 'db.booking.pay_success'
                    }
                  },function(err){
                    if(err){
                      return res.send('fail');
                    }else{
                      return res.send('success');
                    }
                  });
                }else{
                  return res.send('success');
                }
              }
            });
          }else{
            Booking.findOne({
              bookingId: bookingId
            }, function(err, booking){
              if(err || !booking){
                return res.send('fail');
              }else{
                if(booking.total != req.body.total_fee || alipayConfig.seller_email != req.body.seller_email){
                  return res.send('fail');
                }

                var newPayment = new Payment({
                  bookingId: bookingId,
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

                newPayment.save(function(err, result){
                  if(err){
                    return res.send('fail');
                  }else{
                    if(req.body.trade_status == 'TRADE_SUCCESS'){
                      booking.status = 'db.booking.pay_success';
                      booking.statusLogs.push({
                        status: 'db.booking.pay_success',
                        description: 'Pay Success(Alipay)',
                        updateDate: new Date()
                      });
                      booking.payment = result.id;
                      booking.save(function(err){
                        if(err){
                          return res.send('fail');
                        }else{
                          return res.send('success');
                        }
                      });
                    }else{
                      return res.send('success');
                    }
                  }
                });
              }
            });
          }
        }
      });
    }else{
      return res.send('fail');
    }
  });
};

exports.return = function(req, res, next){
  alipayCore.verifyReturn(req, function(result){
    if(result.toLocaleLowerCase() == 'true'){
      if(req.query.trade_status == 'TRADE_FINISHED' || req.query.trade_status == 'TRADE_SUCCESS') {
        return res.render('payment/result', {result: 'success', bookingId: req.query.out_trade_no, product: req.query.subject});
      }
    }

    return res.render('payment/result', {result: 'fail', bookingId: req.query.out_trade_no, product: req.query.subject});
  });
};