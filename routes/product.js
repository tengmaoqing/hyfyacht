/**
 * Created by qxj on 15/10/23.
 */
var express = require('express');
var router = express.Router();

var product = require('../controllers/product');

router.get('/:id/:name/:boat_id/:boat_name', product.getProduct);

module.exports = router;