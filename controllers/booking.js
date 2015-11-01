/**
 * Created by qxj on 15/11/1.
 */
var Booking = require('../models/booking');
var util = require('util');

exports.checkBooking = function(req, res, next){
  req.checkBody({
    'productId': {
      notEmpty: true,
      errorMessage: 'Invalid Product'
    },
    'boatId': {
      notEmpty: true,
      errorMessage: 'Invalid Boat'
    },
    'packageId': {
      notEmpty: true,
      errorMessage: 'Invalid Package'
    },
    'dateStart': {
      notEmpty: true,
      errorMessage: 'Invalid Start Time'
    },
    'dateEnd': {
      notEmpty: true,
      errorMessage: 'Invalid End Time'
    },
    'total': {
      notEmpty: true,
      errorMessage: 'Invalid total'
    },
    'numberOfPersons': {
      notEmpty: true,
      errorMessage: 'Invalid Number Of Persons'
    },
    'contact': {
      notEmpty: true,
      errorMessage: 'Invalid Contact'
    },
    'mobile': {
      notEmpty: true,
      errorMessage: 'Invalid Mobile'
    },
    'email': {
      notEmpty: true,
      errorMessage: 'Invalid E-mail'
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    var err = new Error('There have been validation errors: ' + util.inspect(errors));
    err.status = 400;
    return next(err);
  }

};

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