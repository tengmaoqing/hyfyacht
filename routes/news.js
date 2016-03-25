
var express = require('express');
var router = express.Router();

var news = require('../controllers/news');

// router.get('/', news.getAllNews);
router.get('/:id', news.getANews);
module.exports = router;