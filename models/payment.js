/**
 * Created by 2nd on 15/11/9.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PaymentSchema = new Schema({

});

var Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;