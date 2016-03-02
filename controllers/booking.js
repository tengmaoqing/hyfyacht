/**
 * Created by qxj on 15/11/1.
 */
var Booking = require('hyfbase').Booking;
var Package = require('hyfbase').Package;
var Unavailable = require('hyfbase').Unavailable;
var config = require('../config');
var util = require('util');
var moment = require('moment');
var wechatCore = require('wechat-core');
var parseXML2String = require('xml2js').parseString;
var tools = require('../lib/tools');
var co = require('co');
var Boat = require('hyfbase').Boat;

exports.checkBooking = function (req, res, next) {
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
  }

  var bookingForm = req.session.bookingForm;

  var dateStart = moment(bookingForm.dateStart);
  var dateEnd = moment(bookingForm.dateEnd);

  co(function *() {
    try {
      var selectedPackage = yield Package.findByIdForCheckBooking(bookingForm.packageId).exec();

      var bookingCount = yield Booking.countBookingByDateRange({
        boatId: bookingForm.boatId,
        status: {$ne: 'db.booking.cancel'}
      }, dateStart.toDate(), dateEnd.toDate());

      var unavailableCount = yield Unavailable.countUnavailableByDateRange({
        boatId: bookingForm.boatId
      }, dateStart.toDate(), dateEnd.toDate());
    } catch (err) {
      err.status = 500;
      throw err;
    }

    if (!selectedPackage) {
      var err = new Error('Invalid Package');
      err.status = 400;
      throw err;
    }

    var generateCharge = function (charge) {
      return parseInt(charge * config.currency[req.session.currency] / config.currency[selectedPackage.currency]);
    };

    var boatIndex = selectedPackage.boats.map(function (b) {
      return b.id
    }).indexOf(bookingForm.boatId);

    var fail = function (error) {
      var bookingInfo = new Booking({
        boatId: selectedPackage.boats[boatIndex].id,
        boatName: selectedPackage.boats[boatIndex].name,
        productId: selectedPackage.product.id,
        productName: selectedPackage.product.name
      });

      req.session.bookingForm = null;
      req.session.bookingResult = {
        success: false
      };
      return res.render('booking-result', {error: error, booking: bookingInfo});
    };

    if (bookingCount > 0) {
      return fail('product.booking.result.error.date');
    }

    if (unavailableCount > 0) {
      return fail('product.booking.result.error.date');
    }

    if (req.session.owner._id === selectedPackage.owner.id) {
      var err2 = new Error('Can not book boats of yours');
      err2.status = 403;
      throw err2;
    }

    //Check product
    if (selectedPackage.product.id != bookingForm.productId) {
      return fail('product.booking.result.error.other');
    }

    //Check boat
    if (boatIndex < 0) {
      return fail('product.booking.result.error.other');
    }

    var items = JSON.parse(bookingForm.items);
    var selectedItems = [];

    var slotCount = moment(bookingForm.dateEnd).diff(moment(bookingForm.dateStart)) / 60000;
    var charges = selectedPackage.charges;

    for (var j = 0; j < charges.length; j++) {
      var condition = charges[j].condition;

      if (slotCount >= condition.start && ((condition.end != 0 && slotCount < condition.end) || (condition.end == 0))) {
        if (charges[j].type == "slot") {
          if (charges[j].baseCharge) {
            var extraSlot = (slotCount - selectedPackage.type.baseDuration) / selectedPackage.type.slotDuration;

            selectedItems.push({
              name: charges[j].name,
              charge: generateCharge(charges[j].baseCharge),
              originCharge: charges[j].baseCharge,
              amount: 1,
              subtotal: generateCharge(charges[j].baseCharge)
            });

            if(extraSlot > 0) {
              selectedItems.push({
                name: charges[j].extraName,
                charge: generateCharge(charges[j].charge),
                originCharge: charges[j].charge,
                amount: extraSlot,
                subtotal: generateCharge(charges[j].charge) * extraSlot
              });
            }
          } else {
            var baseCount = slotCount / selectedPackage.type.slotDuration;
            selectedItems.push({
              name: charges[j].name,
              charge: generateCharge(charges[j].charge),
              originCharge: charges[j].charge,
              amount: baseCount,
              subtotal: generateCharge(charges[j].charge) * baseCount
            });
          }
        } else if (charges[j].type == "all") {
          selectedItems.push({
            name: charges[j].name,
            charge: generateCharge(charges[j].charge),
            originCharge: charges[j].charge,
            amount: 1,
            subtotal: generateCharge(charges[j].charge)
          });
        }
      }
    }

    var extraPersons = bookingForm.numberOfPersons - selectedPackage.basePersons;

    if (extraPersons > 0 && selectedPackage.extraCharge > 0) {
      selectedItems.push({
        name: res.__('product.booking.package.extra'),
        charge: generateCharge(selectedPackage.extraCharge),
        originCharge: selectedPackage.extraCharge,
        amount: extraPersons,
        subtotal: generateCharge(selectedPackage.extraCharge) * extraPersons
      });
    }

    //Check items
    for (var item in items) {
      if (items.hasOwnProperty(item)) {
        var index = selectedPackage.items.map(function (i) {
          return i.name
        }).indexOf(items[item].name);
        if (index > -1 && items[item].amount > 0) {
          var data = selectedPackage.items[index];

          if (data.max && data.max < items[item].amount) {
            return fail('product.booking.result.error.other');
          }

          selectedItems.push({
            name: data.name,
            charge: generateCharge(data.charge),
            originCharge: data.charge,
            amount: items[item].amount,
            subtotal: generateCharge(data.charge) * items[item].amount
          });
        } else {
          return fail('product.booking.result.error.other');
        }
      }
    }

    var total = 0;

    for (var i = 0; i < selectedItems.length; i++) {
      total += selectedItems[i].subtotal;
    }

    //Check total
    if (total != bookingForm.total) {
      return fail('product.booking.result.error.other');
    }

    if (parseInt(bookingForm.numberOfPersons) > selectedPackage.maxPersons) {
      return fail('product.booking.result.error.other');
    }

    var slots = selectedPackage.type.slots;
    var availableDate = false;

    for (var i = 0; i < slots.length; i++) {
      var start = slots[i].start.split(':');
      var end = slots[i].end.split(':');

      var workingHoursStart = moment(dateStart).hour(start[0]).minute(start[1]);
      var workingHoursEnd = moment(dateEnd).hour(end[0]).minute(end[1]);

      if (dateStart >= workingHoursStart && dateEnd <= workingHoursEnd) {
        availableDate = true;
      }
    }

    if (!availableDate) {
      return fail('product.booking.result.error.other');
    }

    //Check package availableDate
    if (!selectedPackage.availableMonths[dateStart.month()] || !selectedPackage.availableDays[dateStart.days()] || !selectedPackage.availableMonths[dateEnd.month()] || !selectedPackage.availableDays[dateEnd.days()]) {
      return fail('product.booking.result.error.other');
    }

    var booking = new Booking({
      boatId: selectedPackage.boats[boatIndex].id,
      userId: req.session.user._id,
      boatName: selectedPackage.boats[boatIndex].name,
      boatLocation: selectedPackage.boats[boatIndex].location,
      ownerId: selectedPackage.owner.id,
      ownerName: selectedPackage.owner.nickname,
      productId: selectedPackage.product.id,
      productName: selectedPackage.product.name,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      items: selectedItems,
      dateStart: bookingForm.dateStart,
      dateEnd: bookingForm.dateEnd,
      numberOfPersons: bookingForm.numberOfPersons,
      total: total,
      currency: config.currency,
      settlementCurrency: req.session.currency,
      baseCurrency: selectedPackage.currency,
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

    try {
      var savedBooing = yield booking.save();
    } catch (err) {
      err.status = 500;
      throw err;
    }

    req.session.bookingForm = null;

    if (!savedBooing) {
      return res.render('booking-result', {error: 'product.booking.result.error.other'});
    }

    if (!req.isFromWechat) {
      return res.render('booking-result', {booking: savedBooing});
    }

    var payParams = {
      body: savedBooing.boatName + '-' + savedBooing.productName + '-' + savedBooing.packageName,
      attach: 'boat',
      out_trade_no: savedBooing.bookingId,
      total_fee: savedBooing.total,
      spbill_create_ip: req.headers['x-real-ip'],
      openid: req.session.wechat
    };

    try {
      var unifiedorderResult = yield new Promise(function (resolve, reject) {
        wechatCore.unifiedorder(payParams, function (err, response, result) {
          if (!err && response.statusCode === 200) {
            resolve(result);
          } else {
            reject(result);
          }
        });
      });
    } catch (err) {
      err.status = 500;
      throw err;
    }

    parseXML2String(unifiedorderResult, function (err, wpResult) {
      if (!err) {
        wpResult = tools.ripXMLCDATA(wpResult.xml);
        if (wechatCore.verifySign(wpResult) && wpResult.return_code === 'SUCCESS' && wpResult.result_code === 'SUCCESS') {
          var wpParams = wechatCore.getJSAPIParamsByPrepayId(wpResult.prepay_id);

          return res.render('booking-result', {
            booking: savedBooing,
            wpParams: wpParams
          });
        }
      }

      return res.render('booking-result', {booking: savedBooing});
    });
  }).catch(function (err) {
    return next(err);
  });
};

exports.getBookingByBookingId = function (req, res, next) {
  var bookingId = req.params.bookingId;

  if (!bookingId) {
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
  }

  Booking.findOne({
    bookingId: bookingId,
    userId: req.session.user._id
  }).populate('boatId', 'geospatial').populate({
    path: 'ownerId',
    select: 'nickname mobile'
  }).exec(function (err, booking) {
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!booking) {
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(httpErr);
    }

    if (req.isFromWechat && booking.status === 'db.booking.wait_to_pay') {
      var payParams = {
        body: booking.boatName + '-' + booking.productName + '-' + booking.packageName,
        attach: 'boat',
        out_trade_no: booking.bookingId,
        total_fee: booking.total,
        spbill_create_ip: req.headers['x-real-ip'],
        openid: req.session.wechat
      };

      wechatCore.unifiedorder(payParams, function (err, response, result) {
        if (err || response.statusCode !== 200) {
          return res.render('user-booking-detail', {booking: booking});
        }

        parseXML2String(result, function (xmlErr, wpResult) {
          if (!xmlErr) {
            wpResult = tools.ripXMLCDATA(wpResult.xml);
            if (wechatCore.verifySign(wpResult) && wpResult.return_code === 'SUCCESS' && wpResult.result_code === 'SUCCESS') {
              var wpParams = wechatCore.getJSAPIParamsByPrepayId(wpResult.prepay_id);

              return res.render('user-booking-detail', {
                booking: booking,
                wpParams: wpParams
              });
            }
          }
          return res.render('user-booking-detail', {booking: booking});
        });
      });
    } else {
      return res.render('user-booking-detail', {booking: booking});
    }
  });
};

exports.getBookingByBookingIdForOwner = function (req, res, next) {
  var bookingId = req.params.bookingId;

  if (!bookingId) {
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
    }

    if (!booking) {
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(httpErr);
    }

    return res.render('owner-booking-detail', {booking: booking});
  });
};

exports.getBookingsByUserId = function (req, res, next) {
  var page = req.query.page || 1;

  Booking.getBookingsAndPaginate({
    userId: req.session.user._id
  }, page, 10, function (err, result) {
    if (err) {
      err.status = 400;
      return next(err);
    }

    var pager = {
      current: parseInt(page),
      count: result.pages,
      pages: []
    };

    for (var i = 1; i <= result.pages; i++) {
      pager.pages.push(i);
    }

    return res.render('user-booking-list', {
      bookings: result.docs,
      pager: pager,
      itemCount: result.total
    });
  });
};

exports.getBookingsByOwnerId = function (req, res, next) {
  var id = req.session.owner._id;
  var page = req.query.page || 1;

  var query = req.query;
  var obj = {
    ownerId: id,
    status: 'db.booking.pay_success'
  };

  (query.selectBoat && query.selectBoat != 'all') && (obj.boatId = query.selectBoat);

  if (query.selectDate) {
    var date = moment(query.selectDate, 'YYYY-MM-DD');

    obj.dateEnd = {
      $gt: date.toDate(),
      $lt: moment(date).add(1, 'days').toDate()
    }
  }

  Booking.getBookingsAndPaginate(obj, page, 10, function (err, result) {
    if (err) {
      err.status = 400;
      return next(err);
    }

    var pager = {
      current: parseInt(page),
      count: result.pages,
      pages: []
    };

    for (var i = 1; i <= result.pages; i++) {
      pager.pages.push(i);
    }

    Boat.find({
      owner: id
    }).select('id name region').sort({
      _id: 1
    }).exec(function (err, doc) {
      if (err) {
        err.status = 400;
        return next(err);
      }

      for (var i in doc) {
        if (doc[i]._id == query.selectBoat) {
          query.boatName = doc[i].name;
          break;
        }
      }

      return res.render('owner-booking-list', {
        bookings: result.docs,
        pager: pager,
        itemCount: result.total,
        boats: doc,
        query: query
      });
    });

  });
};

exports.getBookingsForCalendarEvent = function (req, res, next) {
  var start = moment(req.query.start).toDate();
  var end = moment(req.query.end).toDate();

  Booking.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: start,
      $lt: end
    },
    status: {$ne: 'db.booking.cancel'}
  }).select('dateStart dateEnd').exec(function (err, bookings) {
    if (err) {
      err.status = 400;
      return res.json(err);
    }

    if (!bookings) {
      var err = new Error('Not Found');
      err.status = 404;
      return res.json(err);
    }

    var events = [];

    for (var i = 0; i < bookings.length; i++) {
      events.push({
        title: " ",
        start: moment(bookings[i].dateStart).format('YYYY-MM-DDTHH:mm'),
        end: moment(bookings[i].dateEnd).format('YYYY-MM-DDTHH:mm'),
        allDay: false
      });
    }

    return res.json(events);
  });
};

exports.getBookingsForOwnerCalendarEvent = function (req, res, next) {
  var type = req.query.type;

  if (!type) {
    return res.json({});
  }

  var status = type == 'success' ? 'db.booking.pay_success' : 'db.booking.wait_to_pay';

  var start = moment(req.query.start).toDate();
  var end = moment(req.query.end).toDate();
  Booking.find({
    boatId: req.params.bid,
    dateStart: {
      $gt: start,
      $lt: end
    },
    status: status
  }).select('bookingId dateStart dateEnd').exec(function (err, bookings) {
    if (err) {
      err.status = 400;
      return res.json(err);
    }

    if (!bookings) {
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return res.json(httpErr);
    }

    var events = [];

    for (var i = 0; i < bookings.length; i++) {
      events.push({
        title: ' ',
        start: moment(bookings[i].dateStart).format('YYYY-MM-DDTHH:mm'),
        end: moment(bookings[i].dateEnd).format('YYYY-MM-DDTHH:mm'),
        allDay: false,
        bookingId: bookings[i].bookingId
      });
    }

    return res.json(events);
  });
};