/**
 * Created by qxj on 15/11/15.
 */
var wechatConfig = require('./wechat-config');
var request = require('request');

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

var wechat_core = {
  getUrlForCodeByBase: function(url){
    return 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + wechatConfig.appid + '&redirect_uri=' + url + '&response_type=code&scope=snsapi_base&state=1#wechat_redirect';
  },
  getAccessTokenByBase: function(code, callback){
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wechatConfig.appid + '&secret=' + wechatConfig.secret + '&code=' + code + '&grant_type=authorization_code';

    request.get(url, function(err, res, body){
      if(err){
        callback(false);
      }else{
        callback(body);
      }
    });
  },
  getUserInfo: function(req, callback){
    var code = req.query.code;
    if(code) {
      if (req.session.auth_access_token) {
        var tokenObject = JSON.parse(req.session.auth_access_token);
        getUserInfoByToken(tokenObject.access_token, tokenObject.openid, callback);
      } else {
        getAuthAccessToken(code, function(token){
          if(token){
            req.session.auth_access_token = token;
            var tokenObject = JSON.parse(token);
            getUserInfoByToken(tokenObject.access_token, tokenObject.openid, callback);
          }else{
            callback(false);
          }
        });
      }
    }else{
      callback(false);
    }
  }
};

module.exports = wechat_core;