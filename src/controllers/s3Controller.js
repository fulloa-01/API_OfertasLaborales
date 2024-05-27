// server/src/controllers/s3Controller.js
const fs = require('fs');
const AWS = require('aws-sdk');
const multer = require('multer');

// Configuración de AWS SDK
const s3 = require('../config/s3Config');

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
}).single('file');

// Subir un archivo a S3
exports.uploadFile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).send({ message: 'Archivo no proporcionado o tipo de archivo inválido.' });
        }

        const fileContent = fs.readFileSync(req.file.path);
        const fileKey = req.query.key || req.file.originalname;
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
            Body: fileContent,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        try {
            const data = await s3.upload(params).promise();
            fs.unlinkSync(req.file.path); // Eliminar el archivo temporal
            const fileUrl = `https://${params.Bucket}.s3.${AWS.config.region}.amazonaws.com/${encodeURIComponent(fileKey)}`;
            res.send({
                message: 'Archivo subido correctamente con acceso público',
                url: fileUrl
            });
        } catch (error) {
            console.error('Error al subir archivo a S3:', error);
            fs.unlinkSync(req.file.path);
            res.status(500).send('Error al subir el archivo');
        }
    });
};

// Listar contenido del bucket con URLs
exports.listFiles = async (req, res) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: req.query.key || '' // Filtro por clave (opcional)
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        const baseUrl = `https://${params.Bucket}.s3.${AWS.config.region}.amazonaws.com/`;
        const objects = data.Contents.map((item) => ({
            Key: item.Key,
            LastModified: item.LastModified,
            Size: item.Size,
            URL: baseUrl + encodeURIComponent(item.Key)
        }));
        res.json(objects);
    } catch (error) {
        console.error('Error al listar contenido del bucket:', error);
        res.status(500).send('Error al listar contenido del bucket');
    }
};

// Descargar un archivo desde S3
exports.downloadFile = async (req, res) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: req.query.key
    };

    try {
        const data = await s3.getObject(params).promise();
        res.send(data.Body); // Envía los datos del archivo directamente
    } catch (error) {
        console.error('Error al descargar archivo desde S3:', error);
        res.status(500).send('Error al descargar archivo');
    }
};
