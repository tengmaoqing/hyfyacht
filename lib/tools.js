/**
 * Created by qxj on 15/12/2.
 */

exports.ripXMLCDATA = function (params){
  var result = {};
  for(var key in params){
    if(params.hasOwnProperty(key)){
      if(Object.prototype.toString.call(params[key]) === '[object Array]'){
        result[key] = params[key][0];
      }
    }
  }

  return result;
};