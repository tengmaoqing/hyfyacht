/**
 * Created by qxj on 15/11/15.
 */
var wechatCore = require('./wechat-core');

exports.joinEvent = function(req, res, next){
  var redirect_url = encodeURI('http://test.hgboating.com/wx/userinfo');

  return res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx61213aad8ea25f76&redirect_uri=' + redirect_url + '&response_type=code&scope=snsapi_userinfo#wechat_redirect');
};

exports.userinfo = function(req, res, next){
  wechatCore.getUserInfo(req, function(user){
    if(user){
      user = JSON.parse(user);
      return res.send(JSON.stringify(user));
    }else{
      var err = new Error('Not Found');
      err.status = 404;
      return next(err);
    }
  });
};