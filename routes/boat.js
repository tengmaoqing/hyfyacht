/**
 * Created by qxj on 15/10/9.
 */
var express = require('express');
var router = express.Router();

var boat = require('../controllers/boat');

router.get('/', boat.getBoats);

router.get('/:id', boat.getBoat);

router.get('/m/add', boat.insert);

module.exports = router;