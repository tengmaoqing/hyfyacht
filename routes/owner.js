/**
 * Created by qxj on 15/10/16.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('owner-calendar');
});

module.exports = router;