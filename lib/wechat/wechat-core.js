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
  }
};

module.exports = wechat_core;