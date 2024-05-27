// server/src/controllers/utilsController.js
const db = require('../config/dbConfig');

// Ruta para obtener todos los niveles alcanzados
exports.getNivelesAlcanzados = async (req, res) => {
    try {
        const [nivelesAlcanzados] = await db.query(`SELECT * FROM NivelesAlcanzados`);
        res.status(200).json(nivelesAlcanzados);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener los niveles alcanzados", error });
    }
};

// Ruta para obtener todos los departamentos
exports.getDepartamentos = async (req, res) => {
    try {
        const [departamentos] = await db.query(`SELECT * FROM Departamentos`);
        res.status(200).json(departamentos);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener los departamentos", error });
    }
};

// Ruta para obtener las carreras universitarias
exports.getCarreras = async (req, res) => {
    try {
        const [carreras] = await db.query(`SELECT * FROM Carrera`);
        res.status(200).json(carreras);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener las carreras", error });
    }
};

// Ruta para obtener TipoDibujante
exports.getTipoDibujante = async (req, res) => {
    try {
        const [tipoDibujante] = await db.query(`SELECT * FROM TipoDibujante`);
        res.status(200).json(tipoDibujante);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener los tipos de dibujante", error });
    }
};

// Ruta para obtener TipoInstitucion
exports.getTipoInstitucion = async (req, res) => {
    try {
        const [tipoInstitucion] = await db.query(`SELECT * FROM TipoInstitucion`);
        res.status(200).json(tipoInstitucion);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener los tipos de institución", error });
    }
};

// Ruta para obtener Universidades
exports.getUniversidades = async (req, res) => {
    try {
        const [universidades] = await db.query(`SELECT * FROM Universidades`);
        res.status(200).json(universidades);
    } catch (error) {
        res.status(500).send({ message: "Error al obtener las universidades", error });
    }
};
