/**
 * Created by qxj on 16/1/20.
 */
var request = require('request');

exports.getPublicHolidays = function(start, end, country, region){
  var url = 'http://kayaposoft.com/enrico/json/v1.0/index.php?action=getPublicHolidaysForDateRange&fromDate=' + start.format('DD-MM-YYYY') + '&toDate=' + end.format('DD-MM-YYYY') + '&country=' + country;
  if(region){
    url += '&region' + region;
  }

  return new Promise(function(resolve, reject) {
    request(url, function (err, res, result) {
      if(!err && result){
        resolve(result);
      }

      reject();
    });
  });
};

exports.isPublicHoliday = function(dateToCheck, country, region){
  var url = 'http://kayaposoft.com/enrico/json/v1.0/index.php?action=isPublicHoliday&date=' + dateToCheck.format('DD-MM-YYYY') + '&country=' + country;
  
  if(region){
    url += '&region' + region;
  }
  
  return new Promise(function(resolve, reject) {
    request(url, function (err, res, result) {
      if(!err && result){
        resolve(result);
      }

      reject();
    });
  });
};