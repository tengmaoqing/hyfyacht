/**
 * Created by qxj on 16/1/18.
 */
var moment = require('moment');
var sms = require('../lib/sms');

exports.sendSMSCode = function(req, res, next){
  var mobile = req.query.mobile;
  var type = req.query.type;

  if(!mobile || !type){
    return res.json({
      code: 0,
      error: 'required mobile and type'
    });
  }

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

  var code = sms.generateCode();
  req.session.smsCode = code;
  req.session.smsMobile = mobile;

  var message = code;
  
  if(type === 'signup'){
    message = res.__('sms.signup') + message;
  }

  if(type === 'bind'){
    message = res.__('sms.bind') + message;
  }

  if(type === 'reset'){
    message = res.__('sms.reset_password') + message;
  }

  sms.sendSMS(mobile, message, function(err, response, result){
    if(err || !result){
      return res.json({
        code: 0,
        error: 'send failed'
      });
    }

    return res.json({code: 1});
  });
};