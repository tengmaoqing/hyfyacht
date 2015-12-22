/**
 * Created by qxj on 15/12/22.
 */
var express = require('express');
var router = express.Router();

var event = require('../controllers/event');

router.get('/:id/:title/', event.getEvent);
router.get('/list', event.getEvents);

module.exports = router;