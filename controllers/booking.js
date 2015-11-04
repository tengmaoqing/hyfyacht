/**
 * Created by qxj on 15/11/1.
 */
var Booking = require('../models/booking');
var Package = require('../models/package');
var config = require('../config');
var util = require('util');
var i18n = require('i18n');
var moment = require('moment');

exports.checkBooking = function(req, res, next) {
  if (!req.session.bookingForm) {
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

    req.session.bookingForm = req.body;
  }

  if (!req.session.userId) {
    return res.redirect('/login?from=' + req.originalUrl);
  } else {
    var bookingForm = req.session.bookingForm;

    Package.findOne({_id: bookingForm.packageId}).populate('owner', 'nickname').populate('product', 'name workingHours').populate('boats', 'name capacity location').exec(function(err, package){
      if(err){
        err.status = 400;
        return next(err);
      }else{
        if(package){
          var generateCharge = function(charge){
            return parseFloat((charge * config.currency[req.session.currency] / config.currency[package.currency] / 100).toFixed(2));
          };

          var fail = function(error){
            req.session.bookingForm = null;
            req.session.bookingResult = {
              success: false
            };
            return res.render('booking-result', {error: error});
          };

          //Check product
          if(package.product.id != bookingForm.productId){
            return fail('product.booking.result.error.other');
          }

          var boatIndex = package.boats.map(function(b){return b.id}).indexOf(bookingForm.boatId);

          //Check boat
          if(boatIndex < 0){
            return fail('product.booking.result.error.other');
          }

          var items = JSON.parse(bookingForm.items);
          var selectedItems = [];

          selectedItems.push({
            name: i18n.__('product.booking.package.base'),
            charge: generateCharge(package.baseCharge),
            originCharge: package.baseCharge,
            amount: 1,
            subtotal: generateCharge(package.baseCharge)
          });

          var extraPersons = bookingForm.numberOfPersons - package.basePersons;

          if(extraPersons > 0){
            selectedItems.push({
              name: i18n.__('product.booking.package.extra'),
              charge: generateCharge(package.extraCharge),
              originCharge: package.extraCharge,
              amount: extraPersons,
              subtotal: generateCharge(package.extraCharge) * extraPersons
            });
          }

          //Check items
          for(var item in items){
            if(items.hasOwnProperty(item)){
              var index = package.items.map(function(i){return i.name}).indexOf(items[item].name);
              if(index > -1){
                var data = package.items[index];
                selectedItems.push({
                  name: data.name,
                  charge: generateCharge(data.charge),
                  originCharge: data.charge,
                  amount: items[item].amount,
                  subtotal: generateCharge(data.charge) * items[item].amount
                });
              }else{
                return fail('product.booking.result.error.other');
              }
            }
          }

          var total = 0;

          for(var i = 0; i < selectedItems.length; i++){
            total += selectedItems[i].subtotal;
          }

          //Check total
          if(total != bookingForm.total){
            return fail('product.booking.result.error.other');
          }

          //Check number of persons
          if(parseInt(bookingForm.numberOfPersons) > package.boats[boatIndex].capacity){
            return fail('product.booking.result.error.other');
          }

          var dateStart = moment(bookingForm.dateStart);
          var dateEnd = moment(bookingForm.dateEnd);

          var workingHoursStart = moment(package.product.workingHours.start, 'H:mm');
          var workingHoursEnd = moment(package.product.workingHours.end, 'H:mm');

          //Check working hours
          if(dateStart.hours() < workingHoursStart.hours() || dateEnd.hours() > workingHoursEnd.hours()){
            return fail('product.booking.result.error.other');
          }

          //Check package availableDate
          if(!package.availableMonths[dateStart.months()] || !package.availableDays[dateStart.days()] || !package.availableMonths[dateEnd.months()] || !package.availableDays[dateEnd.days()]){
            return fail('product.booking.result.error.other');
          }

          //Check booking date
          Booking.count().and([
            {
              boatId: package.boats[boatIndex].id
            },
            {
              $or:[
                {
                  $and:[
                    {
                      dateStart: {
                        $gte: dateStart.toDate()
                      }
                    },
                    {
                      dateStart: {
                        $lte: dateEnd.toDate()
                      }
                    }
                ]},
                {
                  dateStart: {
                    $lte: dateStart.toDate()
                  },
                  dateEnd: {
                    $gte: dateStart.toDate()
                  }
                }
              ]
            }
          ]).exec(function (err, count) {
            if(err){
              err.status = 400;
              return next(err);
            }else{
              if(count > 0){
                return fail('product.booking.result.error.date');
              }else{
                var booking = new Booking({
                  boatId: package.boats[boatIndex].id,
                  userId: req.session.userId,
                  boatName: package.boats[boatIndex].name,
                  boatLocation: package.boats[boatIndex].location,
                  ownerId: package.owner.id,
                  ownerName: package.owner.nickname,
                  productId: package.product.id,
                  productName: package.product.name,
                  packageId: package.id,
                  packageName: package.name,
                  items: selectedItems,
                  dateStart: bookingForm.dateStart,
                  dateEnd: bookingForm.dateEnd,
                  numberOfPersons: bookingForm.numberOfPersons,
                  total: total,
                  currency: config.currency,
                  settlementCurrency: req.session.currency,
                  baseCurrency: package.currency,
                  contact: {
                    name: bookingForm.contact,
                    mobile: bookingForm.mobile,
                    email: bookingForm.email
                  },
                  status: 'notpay'
                });

                booking.save(function(err, savedBooing){
                  if(err){
                    err.status = 400;
                    return next(err);
                  }else{
                    req.session.bookingForm = null;
                    req.session.bookingResult = {
                      success: true,
                      id: savedBooing.bookingId
                    };
                    return res.redirect('/booking/result');
                  }
                });
              }
            }
          });

        }else{
          var err = new Error('Not Found');
          err.status = 404;
          return next(err);
        }
      }
    });
  }
};

exports.result = function(req, res, next){
  if(req.session.bookingResult) {
    if(req.session.bookingResult.success) {
      Booking.findOne({
        bookingId: req.session.bookingResult.id
      }, function (err, booking) {
        if (err) {
          err.status = 400;
          return next(err);
        } else {
          if (booking.userId != req.session.userId) {
            var err = new Error('Forbidden');
            err.status = 403;
            return next(err);
          } else {
            return res.render('booking-result', {booking: booking});
          }
        }
      });
    }else{
      return res.render('booking-result');
    }
  }else{
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }
};

exports.getBookingsByUserId = function(req, res, next){
  if (!req.session.userId) {
    return res.redirect('/login?from=' + req.originalUrl);
  } else {
    Booking.find({
      userId: req.session.userId
    }).sort( {
      bookingId: -1
    }).exec(
    function(err, bookings){
      if(err){
        err.status = 400;
        return next(err);
      }else{
        return res.render('user-booking-list', {bookings: bookings});
      }
    });
  }
};

exports.getBookingsForCalendarEvent = function(req, res, next){
  Booking.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: new Date()
    }
  }).select('dateStart dateEnd').exec(function(err, bookings){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(!bookings){
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      }else{
        var events = [];
        for(var i = 0; i < bookings.length; i++){
          events.push({
            title: " ",
            start: moment(bookings[i].dateStart).format('YYYY-MM-DDTHH:mm'),
            end: moment(bookings[i].dateEnd).format('YYYY-MM-DDTHH:mm'),
            allDay: false
          });
        }
        return res.json(events);
      }
    }
  });
}