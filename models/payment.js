/**
 * Created by 2nd on 15/11/9.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PaymentSchema = new Schema({
  bookingId: String,
  product: String,
  type: String,
  tradeNo: String,
  status: String,
  detail: Object,
  notify: []
});

var Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;