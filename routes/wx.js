/**
 * Created by 2nd on 15/11/14.
 */
var express = require('express');
var router = express.Router();

var wechat = require('../lib/wechat/wechat');

router.get('/event', function(req, res, next){
  return res.render('wx/event');
});

router.get('/event/join', wechat.joinEvent);

router.get('/userinfo', wechat.userinfo);

module.exports = router;