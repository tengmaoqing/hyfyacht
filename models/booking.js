/**
 * Created by qxj on 15/10/28.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var BookingSchema = new Schema({
  bookingId: String
});

var Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;