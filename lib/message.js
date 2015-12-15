/**
 * Created by qxj on 15/12/8.
 */
var wechatCore = require('./wechat/wechat-core');
var sms = require('./sms');
var Booking = require('hyfbase').Booking;

var template_id = 'co3s1wdHWpjcMef6gHNEtEQJ_cwAsUfFES1ohP9lfKI';

exports.sendPaySuccessMessage = function(product, bookingId){
  if(product == 'boat'){
    Booking.findOne({
      bookingId: bookingId
    }).select('id bookingId userId ownerId boatName productName packageName total settlementCurrency').populate('userId ownerId').exec(function(err, booking){
      if(!err && booking){
        var productMsg = booking.boatName + '-' + booking.productName + '-' + booking.packageName;
        var total = booking.settlementCurrency == 'hkd' ? '$' : '￥';
        total += (booking.total / 100).toFixed(2);
        var url = 'http://hgboating.com/user/booking/detail/' + bookingId;
        var ownerUrl = 'http://hgboating.com/owner/booking/detail/' + bookingId;

        //sms.sendSMS(booking.userId.mobile, '您的订单:');

        //if(booking.userId.mobile){
        //  sms.sendSMS(booking.userId.mobile, '您的定单:' + bookingId + ' 支付成功, 登录海龟租船查看详情: ' + url);
        //}

        if(booking.userId.wechatOpenId){
          var message = {
            touser: booking.userId.wechatOpenId,
            template_id: template_id,
            url: url,
            data: {
              first: {value:'您的定单支付成功, 定单详情:'},
              keyword1: {value:bookingId},
              keyword2: {value:productMsg},
              keyword3: {value:total}
            }
          };

          wechatCore.sendMessage(message);
        }

        //if(booking.ownerId.mobile){
        //  sms.sendSMS(booking.ownerId.mobile, '客户:' + booking.userId.nickname + ' 预定了您的产品:' + productMsg + '登录海龟租船查看详情: ' + ownerUrl);
        //}

        if(booking.ownerId.wechatOpenId){
          var ownerMessage = {
            touser: booking.ownerId.wechatOpenId,
            template_id: template_id,
            url: ownerUrl,
            data: {
              first: {value:'客户:' + booking.userId.nickname + '预定了您的产品:'},
              keyword1: {value:bookingId},
              keyword2: {value:productMsg},
              keyword3: {value:total}
            }
          };

          wechatCore.sendMessage(ownerMessage);
        }
      }
    });
  }
};