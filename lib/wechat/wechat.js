/**
 * Created by qxj on 15/11/15.
 */
var wechatCore = require('./wechat-core');
var wechatConfig = require('./wechat-config');
var xml2js = require('xml2js');
var xmlBuilder = new xml2js.Builder({
  rootName: 'xml'
});
var tools = require('../tools');
var Payment = require('../../models/payment');
var Booking = require('../../models/booking');

var resultFAIL = xmlBuilder.buildObject({
  return_code: 'FAIL'
},{
  cdata: true
});

var resultSUCCESS = xmlBuilder.buildObject({
  return_code: 'SUCCESS',
  return_msg: 'OK'
});

exports.notify = function(req, res, next){
  res.set('Content-Type', 'text/xml');

  var data = req.body;


  data = tools.ripXMLCDATA(data.xml);

  if(wechatCore.verifySign(data) && data.return_code == 'SUCCESS'){
    if(data.result_code == 'SUCCESS') {
      var bookingId = data.out_trade_no;
      var product = data.attach;

      Payment.findOne({
        bookingId: bookingId,
        product: product
      }, function(err, payment){
        if(err){
          console.log('find payment err');
          return res.send(resultFAIL);
        }else{
          if(payment){

            if(payment.status != data.result_code) {
              payment.status = data.result_code;

              payment.notify.push({
                notify_id: data.transaction_id,
                notify_type: 'wechat',
                notify_time: new Date(),
                trade_status: data.result_code,
                refund_status: ''
              });

              payment.save(function (err) {
                if (err) {
                  console.log('save payment err');
                  return res.send(resultFAIL);
                } else {
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
                        return res.send(resultFAIL);
                      } else {
                        console.log('update booking success');
                        return res.send(resultSUCCESS);
                      }
                    });
                  }
                }
              });
            }else{
              console.log('status not change success');
              return res.send(resultSUCCESS);
            }
          }else{
            if(product == 'boat') {
              Booking.findOne({
                bookingId: bookingId
              }, function (err, booking) {
                if (err || !booking) {
                  console.log('find booking err');
                  return res.send(resultFAIL);
                } else {
                  if (booking.total != data.total_fee || wechatConfig.appid != data.appid) {
                    console.log('info booking err');
                    return res.send(resultFAIL);
                  }

                  var newPayment = new Payment({
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
                      trade_status: data.result_code,
                      refund_status: ''
                    }]
                  });

                  newPayment.save(function (err, result) {
                    console.log(result);
                    if (err) {
                      console.log('new payment err');
                      return res.send(resultFAIL);
                    } else {
                      booking.status = 'db.booking.pay_success';
                      booking.statusLogs.push({
                        status: 'db.booking.pay_success',
                        description: 'pay_success_wechat',
                        updateDate: new Date()
                      });
                      booking.payment = result.id;
                      console.log('after asign payment');
                      booking.save(function (err) {
                        if (err) {
                          console.log('save booking err');
                          return res.send(resultFAIL);
                        } else {
                          console.log('save booking success');
                          return res.send(resultSUCCESS);
                        }
                      });
                    }
                  });
                }
              });
            }
          }
        }
      });
    }else{
      return res.send(resultSUCCESS);
    }
  }else{
    return res.send(resultFAIL);
  }
};

/*
 { xml:
 { appid: [ 'wx61213aad8ea25f76' ],
 attach: [ 'boat' ],
 bank_type: [ 'CFT' ],
 cash_fee: [ '1' ],
 device_info: [ 'WEB' ],
 fee_type: [ 'CNY' ],
 is_subscribe: [ 'Y' ],
 mch_id: [ '1275569101' ],
 nonce_str: [ 'JrhyQo3tjdtFXQ6FuS24f54TTtlnlsq1' ],
 openid: [ 'oshuAuPEBu2FGx1j5tvT8DspTGxY' ],
 out_trade_no: [ '14490480361' ],
 result_code: [ 'SUCCESS' ],
 return_code: [ 'SUCCESS' ],
 sign: [ '072862B895D3A50662FAEB936C7A3966' ],
 time_end: [ '20151202172049' ],
 total_fee: [ '1' ],
 trade_type: [ 'JSAPI' ],
 transaction_id: [ '1008820467201512021869441069' ] } }
 */