/**
 * Created by 2nd on 15/11/9.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PaymentSchema = new Schema({
  bookingId: ObjectId,
  type: String,
  notify: []
});

var Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;