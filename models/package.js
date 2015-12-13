/**
 * Created by qxj on 15/10/25.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PackageSchema = new Schema({
  name: String,
  owner: {type: Schema.Types.ObjectId, ref: 'Owner'},
  product: {type: Schema.Types.ObjectId, ref: 'Product'},
  summary: String,
  currency: String,
  availableMonths: [],
  availableDays: [],
  type: Object,
  baseCharge: Number,
  extraCharge: Number,
  basePersons: Number,
  maxPersons: Number,
  items: [],
  boats: [{type: Schema.Types.ObjectId, ref: 'Boat'}],
  inStock: Boolean
});

var Package = mongoose.model('Package', PackageSchema);

module.exports = Package;