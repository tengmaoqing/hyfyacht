/**
 * Created by qxj on 15/10/27.
 */
var request = require('request');

var apiUrl = "http://sms.haiguizc.com/sms.php";

exports.generateCode = function(){
  var code = parseInt(Math.random() * 10000);
  code = String(code);
  while(code.length < 4){
    code += '0';
  }

  return code;
};

exports.sendSMS = function(mobile, content, callback){
  var form = {
    mobile: mobile,
    content: content
  };

  request.post({
    url: apiUrl,
    form: form
  }, callback);
};