/**
 * Created by qxj on 15/10/13.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('booking-info');
});

module.exports = router;