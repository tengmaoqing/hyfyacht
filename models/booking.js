/**
 * Created by qxj on 15/10/28.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  Counter = require('./counter');

var BookingSchema = new Schema({
  bookingId: String,
  boatId: Schema.Types.ObjectId,
  boatName: String,
  boatLocation: Object,
  ownerId: Schema.Types.ObjectId,
  ownerName: String,
  productId: Schema.Types.ObjectId,
  productName: String,
  packageId: Schema.Types.ObjectId,
  packageName: String,
  items: [],
  dateStart: Date,
  dateEnd: Date,
  numberOfPersons: Number,
  total: Number,
  currency: Object,
  settlementCurrency: String,
  baseCurrency: String,
  contact: {
    name: String,
    mobile: String,
    email: String
  },
  status: String
}, {
  versionKey: false
});

BookingSchema.pre('save', function(next){
  var booking = this;

  if(booking.isNew) {
    var prefix = ((new Date()).getTime() / 1000).toFixed(0);

    Counter.findOneAndUpdate({
      model: 'booking',
      prefix: prefix,
      createDate: new Date()
    }, {$inc: {seq: 1}}, {new: true, upsert: true}, function (err, counter) {
      if (err) {
        next(err);
      }

      booking.bookingId = prefix + counter.seq;
      next();
    });
  }
});

var Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;