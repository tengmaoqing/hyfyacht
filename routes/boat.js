/**
 * Created by qxj on 15/10/9.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('boat-list');
});

router.get('/:id', function(req, res, next){
  res.render('boat-detail', {id: req.params.id});
});

module.exports = router;