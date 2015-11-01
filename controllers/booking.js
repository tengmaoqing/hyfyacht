/**
 * Created by qxj on 15/11/1.
 */
var Booking = require('../models/booking');

exports.insert = function(req, res, next){
  var booking = new Booking({
    boat: 'test'
  });

  booking.save(function(err){
    if(err) {
      console.log(err);
    }else{
      res.send('ok');
    }
  });
};