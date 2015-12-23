/**
 * Created by qxj on 15/12/22.
 */
var express = require('express');
var router = express.Router();

var eventOrder = require('../controllers/event-order');

router.get('/number/:eventId', eventOrder.getEventOrderNumberByEventId);

module.exports = router;