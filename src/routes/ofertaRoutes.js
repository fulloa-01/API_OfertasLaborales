// server/src/routes/ofertaRoutes.js
const express = require('express');
const ofertaController = require('../controllers/ofertaController');

const router = express.Router();

router.post('/', ofertaController.createOferta);
router.get('/', ofertaController.getOfertas);
router.get('/:id', ofertaController.getOfertaById);
router.put('/:id', ofertaController.updateOferta);
router.delete('/:id', ofertaController.deleteOferta);

module.exports = router;
