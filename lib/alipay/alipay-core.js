/**
 * Created by qxj on 15/11/5.
 */
var crypto = require('crypto');
var alipayConfig = require('./alipay-config');
var request = require('request');

function md5 (text, key) {
  text += key;
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

function md5Verify(text, key, sign) {
  var sign_temp = md5(text, key);

  if(sign == sign_temp) {
    return true;
  }
  else {
    return false;
  }
}

function paramFilter(params) {
  var param_filter = [];

  for(var key in params){
    if(params.hasOwnProperty(key)){
      if(key == 'sign' || key == 'sign_type' || !params[key]){
        continue;
      }else{
        param_filter.push(
          {
            'key': key,
            'value': params[key]
          }
        );
      }
    }
  }

  return param_filter;
}

function paramSort(params){
  return params.sort(function (a, b) {
    return a.key > b.key ? 1 : -1;
  });
}

function createLinkstring(params){
  var link = '';
  for(var i = 0; i < params.length; i++){
    link += params[i].key + '=' + params[i].value + '&';
  }

  var link = link.slice(0, link.length - 1);

  return link;
}

function buildRequestSign(params){
  var link = createLinkstring(params);

  var sign = '';

  switch (alipayConfig.sign_type.toLocaleUpperCase()){
    case 'MD5':
      sign = md5(link, alipayConfig.key);
      break;
    default:
      break;
  }

  return sign;
}

function getSignVerify(params, sign){
  var result = [];
  result = paramFilter(params);
  result = paramSort(result);
  var link = createLinkstring(result);

  var isSign = false;

  switch (alipayConfig.sign_type.toLocaleUpperCase()){
    case 'MD5':
      isSign = md5Verify(link, alipayConfig.key, sign);
      break;
    default:
      isSign = false;
      break;
  }

  return isSign;
}

function getResponse(notify_id, callback){
  var verify_url = '';

  if(alipayConfig.transport.toLocaleLowerCase() == 'https'){
    verify_url = alipayConfig.https_verify_url;
  }else{
    verify_url = alipayConfig.http_verify_url;
  }

  verify_url = verify_url + 'partner=' + alipayConfig.partner + '&notify_id=' + notify_id;

  request.get(verify_url, function(err, res, body){
      if(err){
        callback(false)
      }else{
        callback(body);
      }
    }
  );
}

var alipay_core = {
  buildRequestFormParams: function(params){
    var result = [];
    result = paramFilter(params);
    result = paramSort(result);

    var sign = buildRequestSign(result);

    result.push({
      key: 'sign',
      value: sign
    });

    result.push({
      key: 'sign_type',
      value: alipayConfig.sign_type.toLocaleUpperCase()
    });

    return result;
  },
  verifyNotify: function(req, callback){
    if(!req.body){
      callback(false);
    }else{
      console.log(req.body);
      var isSign = getSignVerify(req.body, req.body.sign);
      console.log(isSign);

      if(req.body.notify_id && isSign){
        getResponse(req.body.notify_id, callback);
      }else{
        callback(false);
      }
    }
  },
  verifyReturn: function(req, callback){
    if(!req.query){
      callback(false);
    }else{
      var isSign = getSignVerify(req.query, req.query.sign);

      if(req.query.notify_id && isSign){
       getResponse(req.query.notify_id, callback);
      }else{
        callback(false);
      }
    }
  }
};

module.exports = alipay_core;