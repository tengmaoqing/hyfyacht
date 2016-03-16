/**
 * Created by qxj on 16/2/26.
 */
var Booking = require('hyfbase').Booking;
var EventOrder = require('hyfbase').EventOrder;
var Payment = require('hyfbase').Payment;
var paypal = require('paypal-rest-sdk');
var co = require('co');
var message = require('../lib/message');

exports.createPayment = function (req, res, next) {
  var product = req.query.product;
  var bookingId = req.query.order;

  co(function *() {
    var order = null;
    var return_url = null;
    var cancel_url = null;
    var paymentDescription = null;

    try {
      if(product === 'boat'){
        order = yield Booking.findOne({bookingId: bookingId}).exec();
        return_url = 'http://hgboating.com/notify/paypal/execute?product=boat&order=' + bookingId;
        cancel_url = 'http://hgboating.com/user/booking/detail/' + order.bookingId;
        paymentDescription = order.boatName + '-' + order.productName + '-' + order.packageName;
      }

      if(product === 'event'){
        order = yield EventOrder.findOne({orderId: bookingId}).exec();
        return_url = 'http://hgboating.com/notify/paypal/execute?product=event&order=' + bookingId;
        cancel_url = 'http://hgboating.com/user/event';
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

    var create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: return_url,
        cancel_url: cancel_url
      },
      transactions: [{
        item_list: {
          items: [{
            name: bookingId + '-' + paymentDescription,
            price: total,
            currency: 'HKD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'HKD',
          total: total
        },
        description: paymentDescription
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      }

      console.log(payment);
      var links = payment.links;

      for(var i = 0; i <links.length; i ++){
        if(links[i].rel === 'approval_url'){
          return res.redirect(links[i].href);
        }
        continue;
      }

      throw new Error('Approval Url Not Found');
    });
  }).catch(function (err) {
    return next(err);
  });
};

exports.executePayment = function (req, res, next) {
  var paymentId = req.query.paymentId;
  var payerID = req.query.PayerID;
  var product = req.query.product;
  var bookingId = req.query.order;

  co(function *(){
    var order = null;
    var redirect_url = null;

    try {
      if(product === 'boat'){
        order = yield Booking.findOne({bookingId: bookingId}).exec();
        redirect_url = 'http://hgboating.com/user/booking/detail/' + order.bookingId;
      }

      if(product === 'event'){
        order = yield EventOrder.findOne({orderId: bookingId}).exec();
        redirect_url = 'http://hgboating.com/user/event';
      }
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if(!order){
      throw new Error('Order Not Found');
    }

    var total = (order.total / 100).toFixed(2);

    var execute_payment_json = {
      payer_id: payerID,
      transactions: [{
        amount: {
          currency: 'HKD',
          total: total
        }
      }]
    };

    try {
      var executedPayment = yield new Promise(function (resolve, reject) {
        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
          if (error) {
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });
    }catch (e){
      throw e;
    }

    if(executedPayment.state === 'approved') {
      var payment = new Payment({
        bookingId: bookingId,
        product: product,
        type: 'paypal-' + executedPayment.payer.payment_method,
        tradeNo: executedPayment.id,
        status: executedPayment.state,
        detail: executedPayment
      });

      try {
        var savedPayment = yield payment.save();

        if (!savedPayment) {
          throw new Error('Save Payment Fail');
        }

        order.status = 'db.booking.pay_success';
        order.statusLogs.push({
          status: 'db.booking.pay_success',
          description: 'pay_success_paypal',
          updateDate: new Date()
        });

        order.payment = savedPayment.id;

        var savedOrder = yield order.save();

        if (!savedOrder) {
          throw new Error('Save Order Fail');
        }

        message.sendPaySuccessMessage(res, product, bookingId);
      } catch (err) {
        err.status = 500;
        throw err;
      }
    }

    return res.redirect(redirect_url);
  }).catch(function(err){
    return next(err);
  });
};