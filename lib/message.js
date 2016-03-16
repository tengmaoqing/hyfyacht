/**
 * Created by qxj on 15/12/8.
 */
var wechatCore = require('wechat-core');
var sms = require('./sms');
var Booking = require('hyfbase').Booking;
var EventOrder = require('hyfbase').EventOrder;
var co = require('co');
var request = require('request');

var wechat_template_id = 'co3s1wdHWpjcMef6gHNEtEQJ_cwAsUfFES1ohP9lfKI';
var cs_mobile = '8615820450807';
var cs_wechatOpenId = 'oshuAuITA3K7jMRSltVi3BkAjvZo';
var cs_url = 'http://op.haiguizc.com';
var owner_notify_booking_url = 'http://owner.hgboating.com/notify/booking/pay/success?bookingId=';

exports.sendPaySuccessMessage = function(res, product, bookingId){
  var userMobile,
      contactMobile,
      userWechatOpenId,
      userSMSMessage,
      userWechatMessage,
      ownerMobile,
      ownerWechatOpenId,
      ownerSMSMessage,
      ownerWechatMessage,
      csSMSMessage,
      csWechatMessage;

  co(function *(){
    var booking = false;

    var productMsg = '';
    var url = '';
    var ownerUrl = '';

    try {
      if(product === 'boat') {
        booking = yield Booking.findOne({
          bookingId: bookingId
        }).select('id bookingId userId ownerId boatName productName packageName total settlementCurrency contact').populate('userId ownerId').exec();

        productMsg = booking.boatName + '-' + booking.productName + '-' + booking.packageName;
        var url = 'http://hgboating.com/user/booking/detail/' + bookingId;
        var ownerUrl = 'http://hgboating.com/owner/booking/detail/' + bookingId;
      }

      if(product === 'event'){
        booking = yield EventOrder.findOne({
          orderId: bookingId
        }).select('id orderId userId eventName total settlementCurrency').populate('userId').exec();

        productMsg = booking.eventName;
        var url = 'http://hgboating.com/user/event';
      }
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if (!booking) {
      throw new Error('Booking Not Found');
    }

    var total = booking.settlementCurrency == 'hkd' ? '$' : '￥';
    total += (booking.total / 100).toFixed(2);

    var locale = booking.userId.locale ? booking.userId.locale : 'zh-cn';

    userMobile = booking.userId.mobile;
    contactMobile = booking.contact.mobile;
    userSMSMessage = res.__({phrase: 'sms.pay_success_sms', locale: locale}, bookingId);
    userWechatOpenId = booking.userId.wechatOpenId;
    userWechatMessage = {
      touser: booking.userId.wechatOpenId,
      template_id: wechat_template_id,
      url: url,
      data: {
        first: {value:res.__({phrase: 'sms.pay_success_wechat', locale: locale})},
        keyword1: {value:bookingId},
        keyword2: {value:productMsg},
        keyword3: {value:total}
      }
    };

    if(product === 'boat') {
      request.get(owner_notify_booking_url);

      var ownerLocale = booking.ownerId.locale ? booking.ownerId.locale : 'zh-cn';

      ownerMobile = booking.ownerId.mobile;
      ownerSMSMessage = res.__({phrase: 'sms.pay_success_sms_owner', locale: ownerLocale}, booking.userId.nickname, productMsg);
      ownerWechatOpenId = booking.ownerId.wechatOpenId;
      ownerWechatMessage = {
        touser: booking.ownerId.wechatOpenId,
        template_id: wechat_template_id,
        url: ownerUrl,
        data: {
          first: {value: res.__({phrase: 'sms.pay_success_wechat_owner', locale: ownerLocale}, booking.userId.nickname, productMsg)},
          keyword1: {value: bookingId},
          keyword2: {value: productMsg},
          keyword3: {value: total}
        }
      };
    }

    csSMSMessage = '客户:' + booking.userId.nickname + ' 预定了产品:' + productMsg;
    csWechatMessage = {
      touser: cs_wechatOpenId,
      template_id: wechat_template_id,
      url: cs_url,
      data: {
        first: {value:'客户:' + booking.userId.nickname + ' 预定了产品:'},
        keyword1: {value:bookingId},
        keyword2: {value:productMsg},
        keyword3: {value:total}
      }
    };

    if(userMobile){
      sms.sendSMS(userMobile, userSMSMessage);
    }
    
    if(contactMobile){
      sms.sendSMS(contactMobile, userSMSMessage);
    }

    if(userWechatOpenId){
      wechatCore.sendMessage(userWechatMessage);
    }

    if(ownerMobile){
      sms.sendSMS(ownerMobile, ownerSMSMessage);
    }

    if(ownerWechatOpenId){
      wechatCore.sendMessage(ownerWechatMessage);
    }

    sms.sendSMS(cs_mobile, csSMSMessage);
    wechatCore.sendMessage(csWechatMessage);


  }).catch(function(error){
    console.log('Send Message Fail: ' + error.message);
  });
};