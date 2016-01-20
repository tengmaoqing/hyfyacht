/**
 * Created by qxj on 16/1/20.
 */
var moment = require('moment');
var holiday = require('../lib/holiday');
var co = require('co');

exports.getPublicHolidaysForCal = function(req, res, next){
  var start = moment(req.query.start);
  var end = moment(req.query.end);
  var country = req.query.country;
  var region = req.query.region;

  co(function *(){
    try {
      var holidays = yield holiday.getPublicHolidays(start, end, country, region);
    } catch (err){
      err.status = 500;
      throw err;
    }

    if(!holidays){
      throw new Error('No holidays');
    }

    holidays = JSON.parse(holidays);

    var events = [];

    var locale = req.getLocale();

    for(var i = 0; i < holidays.length; i++){
      var date = holidays[i].date;
      var startDate = moment(date.year + '-' + date.month + '-' + date.day, 'YYYY-MM-DD');
      var title = locale === 'en' ? holidays[i].englishName : holidays[i].localName.split(' / ')[0];
      events.push({
        title: title,
        start: startDate.format('YYYY-MM-DDTHH:mm'),
        allDay: true
      });
    }

    return res.json(events);
  }).catch(function(err){
    return res.json(err);
  })
};