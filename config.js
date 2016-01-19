/**
 * Created by qxj on 15/10/7.
 */
var config = {
  env: "development",
  staticMode: "express",
  cookieSecret: "eTCLgSutWMsZ3aGEELZT0XFfqWjfvvGQDG2iV200WFT3NOr3LNb6lW5HgkO5z6GqmnpsZGVEznVXKJogkfQH6wVpLfXDXgonwgrqAoByeexa2bJtHlcFM6C0TxUemR7t",
  sessionSecret: "x0pgTx2ws3W8Qf2os9JdcqGfksSNavWtXD8fdH1dv0xDW7DPvoaC6BCzIm8wLCDH0Phy5w6hweoIBqiH0TFpZG3EjI4WNZv0fxTggBKqUwINHH5MApCbKu1wPqguhzGs",
  cookieOption: {
    httpOnly: true,
    signed: true,
    maxAge: 30*24*60*60*1000
  },
  unsignedCookieOption: {
    httpOnly: true,
    maxAge: 30*24*60*60*1000
  },
  currency: {
    cny: 10000,
    hkd: 11765
  },
  dbPath: "mongodb://localhost/hyfyacht",
  wechatConfig: {
    appid: "wx273c41008f499625",
    secret: "d4624c36b6795d1d99dcf0547af5443d",
    key: "y7G30CLhMfkEIHv4aPyVjsaKNw3kwnD7",
    mch_id: "1275569101",
    device_info: "WEB",
    notify_url: "http://test.hgboating.com/notify/wechat/notify"
  },
  alipayConfig: {
    partner: "2088021832429490",
    seller_email: "2799627600@qq.com",
    key: "z8rq5n5eyuctgoxeni1ml5byuxigy7vo",
    sign_type: "MD5",
    input_charset: "utf-8",
    transport: "https",
    notify_url: "http://hgboating.com/notify/alipay/notify",
    return_url: "http://hgboating.com/notify/alipay/return",
    alipay_gateway_new: 'https://mapi.alipay.com/gateway.do?',
    https_verify_url: "https://mapi.alipay.com/gateway.do?service=notify_verify&",
    http_verify_url: "http://notify.alipay.com/trade/notify_query.do?"
  }
};

module.exports = config;