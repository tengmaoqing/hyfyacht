/**
 * Created by qxj on 15/10/25.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ProductSchema = new Schema({
  name: String,
  photo: String,
  summary: String,
  baseCharge: Number,
  duration: Number,
  workingHours: {
    start: String,
    end: String
  },
  description: String,
  packages: [{type: Schema.Types.ObjectId, ref: "Package"}]
});

var Product = mongoose.model('Product', ProductSchema);

module.exports = Product;