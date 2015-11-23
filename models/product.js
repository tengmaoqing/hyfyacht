/**
 * Created by qxj on 15/10/25.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProductSchema = new Schema({
  name: String,
  owner: {type: Schema.Types.ObjectId, ref: 'Owner'},
  photo: String,
  summary: String,
  baseCharge: Number,
  currency: String,
  duration: Number,
  workingHours: {
    start: String,
    end: String
  },
  description: String,
  chargeInclude: String,
  chargeExclude: String,
  attention: String,
  packages: [{type: Schema.Types.ObjectId, ref: 'Package'}]
});

var Product = mongoose.model('Product', ProductSchema);

module.exports = Product;