/**
 * Created by qxj on 15/11/15.
 */
var wechatCore = require('./wechat-core');
var xml2js = require('xml2js');
var xmlBuilder = new xml2js.Builder();
var tools = require('../tools');

exports.notify = function(req, res, next){
  console.log(req.body);

  var data = req.body;

  data = tools.ripXMLCDATA(data.xml);

  var result = {
    return_code: 'FAIL'
  };

  if(wechatCore.verifySign(data)){
    result = {
      return_code: 'SUCCESS'
    };
  }

  result = xmlBuilder.buildObject(result);
  res.set('Content-Type', 'text/xml');
  res.send(result);
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