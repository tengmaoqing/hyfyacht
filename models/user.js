/**
 * Created by 2nd on 15/9/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  mobile: String,
  username: String,
  nickname: String,
  email: String,
  hashedPassword: String,
  role: String,
  currency: String,
  location: {
    city: String
  },
  contact: [{
    name: String,
    mobile: Number,
    email: String
  }],
  createDate: {type: Date, default: Date.now}
});

var User = mongoose.model('User', UserSchema);

module.exports = User;