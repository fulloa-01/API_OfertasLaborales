// server/src/routes/api.js
const express = require('express');
const ofertaRoutes = require('./ofertaRoutes');
const postulacionRoutes = require('./postulacionRoutes');
const s3Routes = require('./s3Routes');
const utilsRoutes = require('./utilsRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/ofertas', ofertaRoutes);
router.use('/postulaciones', postulacionRoutes);
router.use('/s3', s3Routes);
router.use('/auth', authRoutes);
router.use('/utils', utilsRoutes);

module.exports = router;
