/**
 * Created by qxj on 15/10/9.
 */
var express = require('express');
var router = express.Router();

var boat = require('../controllers/boat');

router.get('/', boat.getBoats);

router.get('/moreBoats', boat.getMoreBoats);
router.get('/:id', boat.getBoat);
router.get('/:id/:name', boat.getBoat);

router.get('/:location/:pier/:price/:capacity/:entertainments/:extras', boat.getBoats);

module.exports = router;