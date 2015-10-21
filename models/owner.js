/**
 * Created by qxj on 15/10/18.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var OwnerSchema = new Schema({
  mobile: String,
  username: String,
  name: {
    first: String,
    last: String
  },
  customLink: String,
  nickname: String,
  email: String,
  hashedPassword: String,
  currency: String,
  location: {
    country: String,
    city: String
  },
  description: String,
  boats: [{type: Schema.Types.ObjectId, ref: "Boat"}]
});

var Owner = mongoose.model('Owner', OwnerSchema);

module.exports = Owner;