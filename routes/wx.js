/**
 * Created by 2nd on 15/11/14.
 */
var express = require('express');
var router = express.Router();

//var alipay = require('../lib/alipay/alipay');

router.get('/event', function(req, res, next){
  return res.render('wx/event');
});

router.get('/event/join', function(req, res, next){
  var redirect_url = encodeURI('http://test.hgboating.com');

  return res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx61213aad8ea25f76&redirect_uri=' + redirect_url + '&response_type=code&scope=snsapi_userinfo#wechat_redirect');
});

module.exports = router;