/**
 * Created by qxj on 15/11/1.
 */
var Booking = require('hyfbase').Booking;
var Package = require('hyfbase').Package;
var Unavailable = require('hyfbase').Unavailable;
var config = require('../config');
var util = require('util');
var i18n = require('i18n');
var moment = require('moment');
var wechatCore = require('../lib/wechat/wechat-core');
var parseXML2String = require('xml2js').parseString;
var tools = require('../lib/tools');

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
      'area_code': {
        notEmpty: true,
        errorMessage: 'Invalid Mobile'
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

  if (!req.session.user) {
    return res.redirect('/login?from=' + req.originalUrl);
  } else {
    var bookingForm = req.session.bookingForm;

    Package.findOne({_id: bookingForm.packageId, inStock: true}).populate('owner', 'nickname').populate('product', 'name workingHours').populate('boats', 'name capacity location').exec(function(err, package){
      if(err){
        err.status = 400;
        return next(err);
      }else{
        if(package){
          if(req.session.owner._id == package.owner.id){
            var err = new Error('Forbidden');
            err.status = 403;
            return next(err);
          }

          var generateCharge = function(charge){
            return parseInt(charge * config.currency[req.session.currency] / config.currency[package.currency]);
          };

          var boatIndex = package.boats.map(function(b){return b.id}).indexOf(bookingForm.boatId);

          var fail = function(error){

            var bookingInfo = new Booking({
              boatId: package.boats[boatIndex].id,
              boatName: package.boats[boatIndex].name,
              productId: package.product.id,
              productName: package.product.name
            });

            req.session.bookingForm = null;
            req.session.bookingResult = {
              success: false
            };
            return res.render('booking-result', {error: error, booking: bookingInfo});
          };

          //Check product
          if(package.product.id != bookingForm.productId){
            return fail('product.booking.result.error.other');
          }

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

          if(extraPersons > 0 && package.extraCharge > 0){
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
          //if(parseInt(bookingForm.numberOfPersons) > package.boats[boatIndex].capacity){
          //  return fail('product.booking.result.error.other');
          //}
          if(parseInt(bookingForm.numberOfPersons) > package.maxPersons){
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
          if(!package.availableMonths[dateStart.month()] || !package.availableDays[dateStart.days()] || !package.availableMonths[dateEnd.month()] || !package.availableDays[dateEnd.days()]){
            return fail('product.booking.result.error.other');
          }

          //Check booking date
          Booking.count().and([
            {
              boatId: package.boats[boatIndex].id,
              status: {$ne: 'db.booking.cancel'}
            },
            {
              $or:[
                {
                  $and:[
                    {
                      dateStart: {
                        $gt: dateStart.toDate()
                      }
                    },
                    {
                      dateStart: {
                        $lt: dateEnd.toDate()
                      }
                    }
                  ]
                },
                {
                  dateStart: {
                    $lt: dateStart.toDate()
                  },
                  dateEnd: {
                    $gt: dateStart.toDate()
                  }
                },
                {
                  dateStart: {
                    $gte: dateStart.toDate()
                  },
                  dateEnd: {
                    $lte: dateEnd.toDate()
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
              }else {
                Unavailable.count().and([
                  {
                    boatId: package.boats[boatIndex].id
                  },
                  {
                    $or:[
                      {
                        $and:[
                          {
                            dateStart: {
                              $gt: dateStart.toDate()
                            }
                          },
                          {
                            dateStart: {
                              $lt: dateEnd.toDate()
                            }
                          }
                        ]
                      },
                      {
                        dateStart: {
                          $lt: dateStart.toDate()
                        },
                        dateEnd: {
                          $gt: dateStart.toDate()
                        }
                      },
                      {
                        dateStart: {
                          $gte: dateStart.toDate()
                        },
                        dateEnd: {
                          $lte: dateEnd.toDate()
                        }
                      }
                    ]
                  }
                ]).exec(function (err, unavailableCount) {
                  if(err){
                    err.status = 400;
                    return next(err);
                  }else {
                    if (unavailableCount > 0) {
                      return fail('product.booking.result.error.date');
                    } else {
                      var booking = new Booking({
                        boatId: package.boats[boatIndex].id,
                        userId: req.session.user._id,
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
                          mobile: bookingForm.area_code + bookingForm.mobile,
                          email: bookingForm.email
                        },
                        status: 'db.booking.wait_to_pay',
                        statusLogs: [
                          {
                            status: 'db.booking.wait_to_pay',
                            description: 'create',
                            updateDate: new Date()
                          }
                        ]
                      });

                      booking.save(function (err, savedBooing) {
                        if (err) {
                          err.status = 400;
                          return next(err);
                        } else {
                          req.session.bookingForm = null;

                          if (savedBooing) {
                            if(req.isFromWechat){
                              wechatCore.unifiedorder(req, savedBooing, function(result){
                                parseXML2String(result, function(err, wpResult){
                                  if(!err) {
                                    wpResult = tools.ripXMLCDATA(wpResult.xml);
                                    if(wechatCore.verifySign(wpResult)){
                                      if(wpResult.return_code == 'SUCCESS' && wpResult.result_code == 'SUCCESS'){
                                        var wpParams = wechatCore.getJSAPIParamsByPrepayId(wpResult.prepay_id);

                                        return res.render('booking-result', {booking: savedBooing, wpParams: wpParams});
                                      }
                                    }
                                    return res.render('booking-result', {booking: savedBooing});
                                  }
                                });
                              });
                            }else {
                              return res.render('booking-result', {booking: savedBooing});
                            }
                          } else {
                            return res.render('booking-result', {error: 'product.booking.result.error.other'});
                          }
                        }
                      });
                    }
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

exports.getBookingByBookingId = function(req, res, next){
  var bookingId = req.params.bookingId;

  if(!bookingId){
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }

  Booking.findOne({
    bookingId: bookingId,
    userId: req.session.user._id
  }, function (err, booking) {
    if (err) {
      err.status = 400;
      return next(err);
    } else {
      if (!booking){
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      } else {
        if(req.isFromWechat && booking.status == 'db.booking.wait_to_pay'){
          wechatCore.unifiedorder(req, booking, function(result){
            parseXML2String(result, function(err, wpResult){
              if(!err) {
                wpResult = tools.ripXMLCDATA(wpResult.xml);
                if(wechatCore.verifySign(wpResult)){
                  if(wpResult.return_code == 'SUCCESS' && wpResult.result_code == 'SUCCESS'){
                    var wpParams = wechatCore.getJSAPIParamsByPrepayId(wpResult.prepay_id);

                    return res.render('user-booking-detail', {booking: booking, wpParams: wpParams});
                  }
                }
                return res.render('user-booking-detail', {booking: booking});
              }
            });
          });
        }else {
          return res.render('user-booking-detail', {booking: booking});
        }
      }
    }
  });
};

exports.getBookingByBookingIdForOwner = function(req, res, next){
  var bookingId = req.params.bookingId;

  if(!bookingId){
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }

  Booking.findOne({
    bookingId: bookingId,
    ownerId: req.session.owner._id
  }, function (err, booking) {
    if (err) {
      err.status = 400;
      return next(err);
    } else {
      if (!booking){
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      } else {
        return res.render('owner-booking-detail', {booking: booking});
      }
    }
  });
};

exports.getBookingsByUserId = function(req, res, next){
  var page = req.query.page || 1;

  Booking.paginate({
    userId: req.session.user._id
  }, {
    page: page,
    limit: 10,
    columns: 'bookingId boatId boatName productId productName packageName dateStart dateEnd total contact settlementCurrency status createDate',
    populate:[{
      path: 'productId',
      select: 'photo'
    }],
    sortBy: {
      _id: -1
    }
  }, function (err, result) {
    if(err){
      err.status = 400;
      return next(err);
    }else{
      var pager = {
        current: parseInt(page),
        count: result.pages,
        pages: []
      };
      for(var i = 1; i <= result.pages; i++){
        pager.pages.push(i);
      }
      return res.render('user-booking-list', {bookings: result.docs, pager: pager, itemCount: result.total});
    }
  });
};

exports.getBookingsByOwnerId = function(req, res, next){
  var id = req.session.owner._id;

  var page = req.query.page || 1;

  Booking.paginate({
    ownerId: id,
    status: 'db.booking.pay_success'
  }, {
    page: page,
    limit: 10,
    columns: 'bookingId boatId boatName productId productName packageName dateStart dateEnd total contact settlementCurrency status createDate',
    populate:[{
      path: 'productId',
      select: 'photo'
    }],
    sortBy: {
      _id: -1
    }
  }, function (err, result) {
    if(err){
      err.status = 400;
      return next(err);
    }else{
      var pager = {
        current: parseInt(page),
        count: result.pages,
        pages: []
      };
      for(var i = 1; i <= result.pages; i++){
        pager.pages.push(i);
      }
      return res.render('owner-booking-list', {bookings: result.docs, pager: pager, itemCount: result.total});
    }
  });
};

exports.getBookingsForCalendarEvent = function(req, res, next){
  var start = new Date(req.query.start);
  var end = new Date(req.query.end);
  Booking.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: start,
      $lt: end
    },
    status: {$ne: 'db.booking.cancel'}
  }).select('dateStart dateEnd').exec(function(err, bookings){
    if(err){
      err.status = 400;
      return res.json(err);
    }else{
      if(!bookings){
        var err = new Error('Not Found');
        err.status = 404;
        return res.json(err);
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
};

exports.getBookingsForOwnerCalendarEvent = function(req, res, next){
  var type = req.query.type;

  if(!type){
    return res.json({});
  }

  var status = type == 'success' ? 'db.booking.pay_success' : 'db.booking.wait_to_pay';

  var start = new Date(req.query.start);
  var end = new Date(req.query.end);
  Booking.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: start,
      $lt: end
    },
    status: status
  }).select('bookingId dateStart dateEnd').exec(function(err, bookings){
    if(err){
      err.status = 400;
      return res.json(err);
    }else{
      if(!bookings){
        var err = new Error('Not Found');
        err.status = 404;
        return res.json(err);
      }else{
        var events = [];
        for(var i = 0; i < bookings.length; i++){
          events.push({
            title: " ",
            start: moment(bookings[i].dateStart).format('YYYY-MM-DDTHH:mm'),
            end: moment(bookings[i].dateEnd).format('YYYY-MM-DDTHH:mm'),
            allDay: false,
            bookingId: bookings[i].bookingId
          });
        }
        return res.json(events);
      }
    }
  });
};