/**
 * Created by qxj on 15/10/9.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('boat');
});

module.exports = router;