/**
 * Created by qxj on 15/10/27.
 */

var request = require('request');

var apiUrl = "http://m.5c.com.cn/api/send/";
var username = "haiyunfan";
var password = "asdf1234";
var apikey = "4fd6d2fba9f69c49a7268a68680e09ba";

exports.sendSMS = function(mobile, content){
  //var buffer = new Buffer(content);
  //var gbk = new Iconv('UTF-8', 'GBK').convert(buffer);
  //console.log(gbk);

  var form = {
    username: username,
    password: password,
    apikey: apikey,
    mobile: mobile,
    content: content
  };

  request.post({
    url: apiUrl,
    form: form//,
    //headers: {
    //  'Content-Type': 'application/x-www-form-urlencoded; charset=gbk'
    //}
  }, function(err, res, body){
      if(err){
        console.log(err);
      }else{
        //console.log((new Date()).toLocaleString() + ' ' + body);
      }
    }
  );
};