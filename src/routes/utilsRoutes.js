// server/src/routes/utilsRoutes.js
const express = require('express');
const utilsController = require('../controllers/utilsController');

const router = express.Router();

router.get('/nivelesAlcanzados', utilsController.getNivelesAlcanzados);
router.get('/departamentos', utilsController.getDepartamentos);
router.get('/carreras', utilsController.getCarreras);
router.get('/tipoDibujante', utilsController.getTipoDibujante);
router.get('/tipoInstitucion', utilsController.getTipoInstitucion);
router.get('/universidades', utilsController.getUniversidades);

module.exports = router;
