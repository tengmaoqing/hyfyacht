/**
 * Created by qxj on 15/11/13.
 */

var appid = "wx61213aad8ea25f76";
var secret = "ea4c8648aa6fbe93b16ffb835a654897";

var config = {
  appid: appid,
  secret: secret,
  key: "y7G30CLhMfkEIHv4aPyVjsaKNw3kwnD7",
  mch_id: "1275569101",
  device_info: "WEB",
  notify_url: "http://hgboating.com/notify/wechat/notify",
  api_unifiedorder_url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
  api_closeorder_url: "https://api.mch.weixin.qq.com/pay/closeorder",
  access_token_url: "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + secret,
  jsapi_ticket_url: "https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=",
  send_message_url: "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="
};

module.exports = config;