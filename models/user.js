/**
 * Created by 2nd on 15/9/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  email: { type: String, unique: true },
  hashedPassword: String,
  createDate: {type: Date, default: Date.now, index:1}
});

var User = mongoose.model('User', UserSchema);

module.exports = User;