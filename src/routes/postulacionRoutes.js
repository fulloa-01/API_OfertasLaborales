// server/src/routes/postulacionRoutes.js
const express = require('express');
const postulacionController = require('../controllers/postulacionController');

const router = express.Router();

router.post('/', postulacionController.createPostulacion);
router.get('/', postulacionController.getPostulaciones);
router.get('/:id', postulacionController.getPostulacionById);

module.exports = router;
