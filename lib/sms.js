/**
 * Created by qxj on 15/10/27.
 */

var request = require('request');

var apiUrl = "http://m.5c.com.cn/api/send/";
var username = "haiyunfan";
var password = "asdf1234";
var apikey = "4fd6d2fba9f69c49a7268a68680e09ba";

exports.sendSMS = function(mobile, content){
  var form = {
    username: username,
    password: password,
    apikey: apikey,
    mobile: mobile,
    content: content
  };

  request.post(apiUrl, {form: form}, function(err, res, body){
      if(err){
        console.log(err);
      }else{
        console.log((new Date()).toLocaleString() + ' ' + body);
      }
    }
  );
};