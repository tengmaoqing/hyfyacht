/**
 * Created by qxj on 15/10/27.
 */
var request = require('request');

var apiUrl = "http://sms.haiguizc.com/sms.php";

exports.sendSMS = function(mobile, content){

  var form = {
    mobile: mobile,
    content: content
  };

  request.post({
    url: apiUrl,
    form: form
  }, function(err, res, body){
      if(err){
        console.log(err);
      }else{
        console.log((new Date()).toLocaleString() + ' ' + body);
      }
    }
  );
};