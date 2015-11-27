/**
 * Created by 2nd on 15/11/10.
 */
var express = require('express');
var router = express.Router();
var moment = require('moment');

var sms = require('../lib/sms');

function generateCode(){
  var code = parseInt(Math.random() * 10000);
  code = String(code);
  while(code.length < 4){
    code += '0';
  }

  return code;
}

router.get('/getcode', function(req, res, next){
  var mobile = req.query.mobile;
  if(mobile){
    var now = moment();

    if(req.session.smsLast){
      var last = moment(req.session.smsLast);

      last.add(1, 'm');
      if(last > now){
        return res.json({
          code: 0,
          error: 'less than 1m'
        });
      }
    }
    req.session.smsLast = now;

    var code = generateCode();
    req.session.smsCode = code;
    req.session.smsMobile = mobile;
    //console.log(code);

    sms.sendSMS(mobile, code);

    return res.json({code: 1});
  }else {
    return res.json({
      code: 0,
      error: 'required mobile'
    });
  }
});

module.exports = router;