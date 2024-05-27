// server/src/controllers/postulacionController.js
const fs = require('fs');
const db = require('../config/dbConfig');
const s3 = require('../config/s3Config');
const multer = require('multer');

// Configura Multer con filtro de archivo y límites de tamaño
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Aceptar archivo
    } else {
        cb(new Error('Solo se permiten archivos PDF.'), false); // Rechazar archivo
    }
};

const upload = multer({
    dest: 'uploads/',
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Límite de tamaño de archivo, aquí 5MB
}).single('cvFile');

// Crear una nueva postulación
exports.createPostulacion = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }
        
        if (!req.file) {
            return res.status(400).send({ message: 'Archivo de CV no proporcionado o tipo de archivo inválido.' });
        }

        const fileContent = fs.readFileSync(req.file.path);
        const fileKey = `cvs/${req.file.originalname}`;
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
            Body: fileContent,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        try {
            // Subir el archivo a S3 y obtener la URL
            const uploadResult = await s3.upload(params).promise();
            const cvUrl = uploadResult.Location;
            fs.unlinkSync(req.file.path); // Eliminar el archivo temporal

            // Extraer los campos del formulario de la solicitud
            const {
                rut,
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                email,
                pretensiones,
                ciudad,
                codigoOferta,
                carrera,
                experienciaDocente,
                tipoInstitucion,
                nivelAlcanzado,
                universidad,
                anosExperiencia,
                ultimoCargo,
                ultimaActividad,
                penultimoCargo,
                penultimaActividad
            } = req.body;

            // Insertar la postulación en la base de datos
            const result = await db.execute(`
                INSERT INTO Postulaciones (Rut, Nombre, ApellidoPaterno, ApellidoMaterno, Email, PretensionesSalario, Ciudad, CodigoOferta, Carrera, ExperienciaDocente, TipoInstitucion, NivelAlcanzado, Universidad, AnosExperiencia, UltimoCargo, UltimaActividad, PenultimoCargo, PenultimaActividad, CvURL)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    rut,
                    nombre,
                    apellidoPaterno,
                    apellidoMaterno,
                    email,
                    pretensiones,
                    ciudad,
                    codigoOferta,
                    carrera,
                    experienciaDocente,
                    tipoInstitucion,
                    nivelAlcanzado,
                    universidad,
                    anosExperiencia,
                    ultimoCargo,
                    ultimaActividad,
                    penultimoCargo,
                    penultimaActividad,
                    cvUrl
                ]);

            res.status(201).send({ message: 'Postulación enviada correctamente', postulacionId: result[0].insertId });
        } catch (error) {
            console.error('Error en la postulación:', error);
            res.status(500).send('Error al enviar la postulación');
        }
    });
};

// Obtener todas las postulaciones
exports.getPostulaciones = async (req, res) => {
    try {
        const [postulaciones] = await db.query(`
            SELECT 
                p.PostulacionID,
                p.Rut,
                p.Nombre,
                p.ApellidoPaterno,
                p.ApellidoMaterno,
                p.Email,
                p.PretensionesSalario,
                p.Ciudad,
                p.CodigoOferta,
                c.nombre AS CarreraNombre,
                u.nombre AS UniversidadNombre,
                p.ExperienciaDocente,
                ti.descripcion AS Institucion,
                p.NivelAlcanzado,
                p.AnosExperiencia,
                p.UltimoCargo,
                p.UltimaActividad,
                p.PenultimoCargo,
                p.PenultimaActividad,
                p.CvURL
            FROM 
                Postulaciones p
            LEFT JOIN 
                Carrera c ON p.Carrera = c.id
            LEFT JOIN 
                Universidades u ON p.Universidad = u.id
            LEFT JOIN 
                TipoInstitucion ti ON p.TipoInstitucion = ti.id;
        `);
        res.status(200).json(postulaciones);
    } catch (error) {
        console.error('Error al obtener las postulaciones:', error);
        res.status(500).send({ message: 'Error al obtener las postulaciones', error });
    }
};

// Obtener una postulación por ID
exports.getPostulacionById = async (req, res) => {
    const { id } = req.params;
    try {
        const [postulacion] = await db.query(`
            SELECT 
                p.PostulacionID,
                p.Rut,
                p.Nombre,
                p.ApellidoPaterno,
                p.ApellidoMaterno,
                p.Email,
                p.PretensionesSalario,
                p.Ciudad,
                p.CodigoOferta,
                c.nombre AS CarreraNombre,
                u.nombre AS UniversidadNombre,
                p.ExperienciaDocente,
                ti.descripcion AS Institucion,
                p.NivelAlcanzado,
                p.AnosExperiencia,
                p.UltimoCargo,
                p.UltimaActividad,
                p.PenultimoCargo,
                p.PenultimaActividad,
                p.CvURL
            FROM 
                Postulaciones p
            LEFT JOIN 
                Carrera c ON p.Carrera = c.id
            LEFT JOIN 
                Universidades u ON p.Universidad = u.id
            LEFT JOIN 
                TipoInstitucion ti ON p.TipoInstitucion = ti.id
            WHERE p.PostulacionID = ?;
        `, [id]);
        
        if (postulacion.length === 0) {
            return res.status(404).send({ message: 'Postulación no encontrada' });
        }

        res.status(200).json(postulacion[0]);
    } catch (error) {
        console.error('Error al obtener la postulación:', error);
        res.status(500).send({ message: 'Error al obtener la postulación', error });
    }
};
