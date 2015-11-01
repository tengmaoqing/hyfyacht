/**
 * Created by qxj on 15/10/28.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  Counter = require('./counter');

var BookingSchema = new Schema({
  bookingId: String,
  boatId: Schema.Types.ObjectId,
  ownerId: Schema.Types.ObjectId,
  productId: Schema.Types.ObjectId,
  packageId: Schema.Types.ObjectId,
  items: [],
  dateStart: Date,
  dateEnd: Date,
  numberOfPersons: Number,
  total: Number,
  currency: String,
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