/**
 * Created by qxj on 15/12/22.
 */
var express = require('express');
var router = express.Router();

var event = require('../controllers/event');
var eventOrder = require('../controllers/event-order');

router.get('/submit', eventOrder.submit);
router.post('/submit', eventOrder.submit);
router.get('/list', event.getEvents);

router.get('/:id', event.getEvent);

module.exports = router;