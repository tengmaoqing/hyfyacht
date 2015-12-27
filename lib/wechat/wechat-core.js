/**
 * Created by qxj on 15/11/15.
 */
var crypto = require('crypto');
var wechatConfig = require('./wechat-config');
var request = require('request');
var randomString = require('random-string');
var util = require('util');
var cache = require('memory-cache');
var xml2js = require('xml2js');
var xmlBuilder = new xml2js.Builder({
  rootName: 'xml'
});

function md5 (text, key) {
  text += '&key=' + key;
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
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

function getSign(params){
  var result = paramFilter(params);
  result = paramSort(result);
  result = createLinkstring(result);
  return md5(result, wechatConfig.key).toUpperCase();
}

function getAuthAccessToken(code, callback){
  var access_token_url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wechatConfig.appid + '&secret=' + wechatConfig.secret + '&code=' + code + '&grant_type=authorization_code';
  request.get(access_token_url, function(err, res, body){
    if(err){
      callback(false);
    }else{
      callback(body);
    }
  });
}

function getUserInfoByToken(token, openId, callback){
  var userinfo_url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + token + '&openid=' + openId + '&lang=zh_CN';

  request.get(userinfo_url, function(err, res, body){
    if(err){
      callback(false);
    }else{
      callback(body);
    }
  });
}

function getAppAccessToken(){
  request.get(wechatConfig.access_token_url, function(err, res, body){
    var data = JSON.parse(body);
    if(data.access_token){
      console.log(data.access_token);
      cache.put('wechatAccessToken', data.access_token, 7200000, function(){
        getAppAccessToken();
      });
    }else{
      console.log(data.errmsg);
    }
  });
}

function getParamsForUnifiedorder(req, paramsData, type){
  if(type == 'boat') {
    return {
      appid: wechatConfig.appid,
      mch_id: wechatConfig.mch_id,
      device_info: wechatConfig.device_info,
      nonce_str: randomString({length: 32}),
      body: paramsData.boatName + '-' + paramsData.productName + '-' + paramsData.packageName,
      attach: 'boat',
      out_trade_no: paramsData.bookingId,
      fee_type: 'CNY',
      total_fee: paramsData.total,
      spbill_create_ip: req.headers['x-real-ip'],
      notify_url: wechatConfig.notify_url,
      trade_type: 'JSAPI',
      openid: req.session.wechat
    };
  }else if(type == 'event'){
    return {
      appid: wechatConfig.appid,
      mch_id: wechatConfig.mch_id,
      device_info: wechatConfig.device_info,
      nonce_str: randomString({length: 32}),
      body: paramsData.eventName,
      attach: 'event',
      out_trade_no: paramsData.orderId,
      fee_type: 'CNY',
      total_fee: paramsData.total,
      spbill_create_ip: req.headers['x-real-ip'],
      notify_url: wechatConfig.notify_url,
      trade_type: 'JSAPI',
      openid: req.session.wechat
    };
  }
}

var wechat_core = {
  getAppAccessToken: getAppAccessToken,
  verifySign: function(params){
    var sign = getSign(params);
    return sign == params.sign;
  },
  getUrlForCodeScopeBase: function(url){
    //scope = snsapi_base, state = 1
    return 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + wechatConfig.appid + '&redirect_uri=' + url + '&response_type=code&scope=snsapi_base&state=1#wechat_redirect';
  },
  getUrlForCodeScopeUserInfo: function(url){
    //scope = snsapi_userinfo, state = 2
    return 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + wechatConfig.appid + '&redirect_uri=' + url + '&response_type=code&scope=snsapi_userinfo&state=2#wechat_redirect';
  },
  getAccessToken: function(code, callback){
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wechatConfig.appid + '&secret=' + wechatConfig.secret + '&code=' + code + '&grant_type=authorization_code';

    request.get(url, function(err, res, body){
      if(err){
        callback(false);
      }else{
        callback(body);
      }
    });
  },
  checkAccessTokenAndRefresh: function(data, callback){
    var data = JSON.parse(data);

    var check_url = 'https://api.weixin.qq.com/sns/auth?access_token=' + data.access_token + '&openid=' + data.openid;
    var refresh_url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + wechatConfig.appid + '&grant_type=refresh_token&refresh_token=' + data.access_token;

    request.get(check_url, function(err, res, body){
      if(err){
        callback(false);
      }else{
        body = JSON.parse(body);
        if(body.errcode == 0){
          callback(data)
        }else{
          request.get(refresh_url, function(refresh_err, refresh_res, refresh_body){
            if(err){
              callback(false);
            }else{
              callback(JSON.parse(refresh_body));
            }
          });
        }
      }
    });
  },
  getUserInfo: function(token, openId, callback){
    var userinfo_url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + token + '&openid=' + openId + '&lang=zh_CN';

    request.get(userinfo_url, function(err, res, body){
      if(err){
        callback(false);
      }else{
        callback(body);
      }
    });
  },
  unifiedorder: function(req, paramsData, type, callback){
    var params = getParamsForUnifiedorder(req, paramsData, type);

    var sign = getSign(params);

    util._extend(params, {
      sign: sign
    });

    var xml = xmlBuilder.buildObject(params);

    request.post({
      url: wechatConfig.api_unifiedorder_url,
      body: xml,
      headers: {
        'Content-Type': 'text/xml'
      }
    }, function(err, res, body){
      if(!err && res.statusCode == '200'){
        callback(body);
      }
    });
  },
  closeorder: function(bookingId, callback){
    var params = {
      appid: wechatConfig.appid,
      mch_id: wechatConfig.mch_id,
      nonce_str: randomString({length: 32}),
      out_trade_no: bookingId
    };

    var sign = getSign(params);

    util._extend(params, {
      sign: sign
    });

    var xml = xmlBuilder.buildObject(params);

    request.post({
      url: wechatConfig.api_closeorder_url,
      body: xml,
      headers: {
        'Content-Type': 'text/xml'
      }
    }, function(err, res, body){
      if(!err && res.statusCode == '200'){
        callback(body);
      }
    });
  },
  getJSAPIParamsByPrepayId: function(prepayId){
    var params = {
      appId: wechatConfig.appid,
      timeStamp: ((new Date()).getTime() / 1000).toFixed(0),
      nonceStr: randomString({length: 32}),
      package: "prepay_id=" + prepayId,
      signType:"MD5"
    };

    var sign = getSign(params);

    util._extend(params, {
      paySign: sign
    });

    return params;
  },
  sendMessage: function(msg){
    request.post({
      url:wechatConfig.send_message_url + cache.get('wechatAccessToken'),
      body: JSON.stringify(msg),
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(err, res, body){
      if(!err && res.statusCode == '200'){

      }
    });
  },
  getConfigForFrontPage: function(){
    var config = {
      appId: wechatConfig.appid,
      timeStamp: ((new Date()).getTime() / 1000).toFixed(0),
      nonceStr: randomString({length: 32}),
      signType:"MD5"
    };

    var sign = getSign(config);

    util._extend(config, {
      signature: sign
    });

    return config;
  }
};

module.exports = wechat_core;