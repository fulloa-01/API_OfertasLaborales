// server/src/routes/s3Routes.js
const express = require('express');
const s3Controller = require('../controllers/s3Controller');

const router = express.Router();

router.put('/', s3Controller.uploadFile);
router.get('/', s3Controller.listFiles);
router.get('/download', s3Controller.downloadFile);

module.exports = router;
