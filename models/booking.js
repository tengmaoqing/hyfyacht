/**
 * Created by qxj on 15/10/28.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate'),
  Counter = require('./counter');

var StatusLogsSchema = new Schema({
  status: String,
  description: String,
  updateDate: Date
},{
  _id: false
})

var BookingSchema = new Schema({
  bookingId: String,
  userId: {type: Schema.Types.ObjectId, ref: 'User'},
  boatId: {type: Schema.Types.ObjectId, ref: 'Boat'},
  boatName: String,
  boatLocation: Object,
  ownerId: {type: Schema.Types.ObjectId, ref: 'Owner'},
  ownerName: String,
  productId: {type: Schema.Types.ObjectId, ref: 'Product'},
  productName: String,
  packageId: {type: Schema.Types.ObjectId, ref: 'Package'},
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
  status: String,
  statusLogs: [StatusLogsSchema],
  payment: {type: Schema.Types.ObjectId, ref: 'Payment'},
  createDate: {type: Date, default: Date.now}
}, {
  versionKey: false
});

BookingSchema.plugin(mongoosePaginate);

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