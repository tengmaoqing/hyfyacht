
var express = require('express');
var router = express.Router();

var blog = require('../controllers/blog');

// router.get('/', blog.getBlogs);
router.get('/:id', blog.getBlog);

module.exports = router;