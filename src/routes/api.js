"// Path: server/src/routes/api.js";
const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");
const db = require("../config/dbConfig");
require("dotenv").config();

const router = express.Router();

// Configura AWS SDK
AWS.config.update({
  region: "sa-east-1", // Cambiar según la región
  credentials: new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY
  )
});
const s3 = new AWS.S3();

// Configura Multer con filtro de archivo
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error("Solo se permiten archivos PDF."), false); // Rechazar archivo
  }
};

// Configura Multer con límites de tamaño y destino
const upload = multer({
  dest: "uploads/",
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Límite de tamaño de archivo, aquí 5MB
});

// // Endpoint para subir un archivo a S3 con acceso público
// router.put("/s3", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res
//       .status(400)
//       .send("No file was uploaded or file type is invalid.");
//   }

//   const fileContent = fs.readFileSync(req.file.path);
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: req.query.key || req.file.originalname,
//     Body: fileContent,
//     ContentType: req.file.mimetype,
//     ACL: "public-read" // Permisos del archivo como públicos
//   };

//   try {
//     await s3.upload(params).promise();
//     fs.unlinkSync(req.file.path); // Limpia el archivo subido después de procesar
//     res.send("File uploaded successfully with public access");
//   } catch (error) {
//     console.error("S3 upload error:", error);
//     fs.unlinkSync(req.file.path); // Asegura que el archivo se elimine incluso en caso de error
//     res.status(500).send("Failed to upload file");
//   }
// });

// Endpoint para subir un archivo a S3 con acceso público y devolver la URL
router.put("/s3", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .send("No file was uploaded or file type is invalid.");
  }

  const fileContent = fs.readFileSync(req.file.path);
  const fileKey = req.query.key || req.file.originalname;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: fileContent,
    ContentType: req.file.mimetype,
    ACL: "public-read" // Permisos del archivo como públicos
  };

  try {
    await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // Limpia el archivo subido después de procesar
    const fileUrl = `https://${params.Bucket}.s3.${AWS.config.region}.amazonaws.com/${encodeURIComponent(fileKey)}`;
    res.send({
      message: "File uploaded successfully with public access",
      url: fileUrl
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    fs.unlinkSync(req.file.path); // Asegura que el archivo se elimine incluso en caso de error
    res.status(500).send("Failed to upload file");
  }
});


// Endpoint para listar contenido del bucket con URLs
router.get("/s3", async (req, res) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Prefix: req.query.key || "" // Filtro por clave (opcional)
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const baseUrl = `https://${params.Bucket}.s3.${AWS.config.region}.amazonaws.com/`; // Asegúrate de reemplazar con tu URL base correcta
    const objects = data.Contents.map((item) => {
      return {
        Key: item.Key,
        LastModified: item.LastModified,
        Size: item.Size,
        URL: baseUrl + encodeURIComponent(item.Key) // Codifica la clave para manejar caracteres especiales
      };
    });
    res.json(objects);
  } catch (error) {
    console.error("S3 list error:", error);
    res.status(500).send("Failed to list bucket contents");
  }
});

// Endpoint para descargar un archivo desde S3
router.get("/s3/download", async (req, res) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: req.query.key
  };

  try {
    const data = await s3.getObject(params).promise();
    res.send(data.Body); // Envía los datos del archivo directamente
  } catch (error) {
    console.error("S3 download error:", error);
    res.status(500).send("Failed to download file");
  }
});

// Ruta para subir la oferta laboral
router.post("/oferta", async (req, res) => {
  const {
    titulo,
    nivelAlcanzado,
    departamento,
    anosExperiencia,
    detalle,
    salario,
    vacantes,
    ubicacionGeografica,
    aceptaExtranjeros
  } = req.body;
  try {
    const result = await db.execute(
      `INSERT INTO Ofertas (Titulo, NivelAlcanzado, Departamento, AnosExperiencia, Detalle, Salario, Vacantes, UbicacionGeografica, AceptaExtranjeros)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        nivelAlcanzado,
        departamento,
        anosExperiencia,
        detalle,
        salario,
        vacantes,
        ubicacionGeografica,
        aceptaExtranjeros
      ]
    );
    res
      .status(201)
      .send({ message: "Oferta creada", ofertaId: result[0].insertId });
  } catch (error) {
    res.status(500).send({ message: "Error al crear la oferta", error });
  }
});

// Ruta para obtener todas las ofertas laborales
router.get("/ofertas", async (req, res) => {
  try {
    const query = `
            SELECT 
                O.OfertaID, 
                O.Titulo, 
                O.Detalle, 
                O.Salario, 
                O.Vacantes, 
                O.UbicacionGeografica, 
                O.AceptaExtranjeros, 
                O.AnosExperiencia,
                N.Descripcion AS NivelAlcanzado, 
                D.Nombre AS Departamento
            FROM Ofertas O
            JOIN NivelesAlcanzados N ON O.NivelAlcanzado = N.NivelID
            JOIN Departamentos D ON O.Departamento = D.DepartamentoID;
        `;
    const [ofertas] = await db.query(query);
    res.status(200).json(ofertas);
  } catch (error) {
    console.error("Error al obtener las ofertas: ", error);
    res.status(500).send({ message: "Error al obtener las ofertas", error });
  }
});

// Ruta para obtener todos los niveles alcanzados
router.get("/carrera", async (req, res) => {
  try {
    const [carrera] = await db.query(`SELECT * FROM Carrera`);
    res.status(200).json(carrera);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener los niveles alcanzados", error });
  }
});

// Ruta para obtener todos los departamentos
router.get("/departamentos", async (req, res) => {
  try {
    const [departamentos] = await db.query(`SELECT * FROM Departamentos`);
    res.status(200).json(departamentos);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener los departamentos", error });
  }
});

//Ruta para obtener las carreras universitarias
router.get("/carreras", async (req, res) => {
  try {
    const [carreras] = await db.query(`SELECT * FROM Carreras`);
    res.status(200).json(carreras);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener las carreras", error });
  }
});

//Ruta para obtener TipoDibujante
router.get("/tipoDibujante", async (req, res) => {
  try {
    const [tipoDibujante] = await db.query(`SELECT * FROM TipoDibujante`);
    res.status(200).json(tipoDibujante);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener los tipos de dibujante", error });
  }
});

//Ruta para obtener TipoInstitucion
router.get("/tipoInstitucion", async (req, res) => {
  try {
    const [tipoInstitucion] = await db.query(`SELECT * FROM TipoInstitucion`);
    res.status(200).json(tipoInstitucion);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener los tipos de institución", error });
  }
});

//Ruta para obtener NivelesAlcanzados
router.get("/nivelesAlcanzados", async (req, res) => {
  try {
    const [nivelesAlcanzados] = await db.query(`SELECT * FROM NivelesAlcanzados`);
    res.status(200).json(nivelesAlcanzados);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener los niveles alcanzados", error });
  }
});

//Ruta para obtener Universidades
router.get("/universidades", async (req, res) => {
  try {
    const [universidades] = await db.query(`SELECT * FROM Universidades`);
    res.status(200).json(universidades);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener las universidades", error });
  }
});


// Endpoint para enviar la postulación y subir el CV
router.post('/postulacion', upload.single('cvFile'), async (req, res) => {
  if (!req.file) {
      return res.status(400).send("Archivo de CV no proporcionado o tipo de archivo inválido.");
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

      // Extraer los campos del formulario de la solicitud y asignar valores por defecto
      const {
          rut = null,
          nombre = null,
          apellidoPaterno = null,
          apellidoMaterno = null,
          email = null,
          pretensiones = null,
          ciudad = null,
          codigoOferta = null,  // Asegúrate de que sea un número o null
          carrera = null,
          experienciaDocente = null,
          tipoInstitucion = null,
          nivelAlcanzado = null,
          universidad = null,
          anosExperiencia = null,
          ultimoCargo = null,
          ultimaActividad = null,
          penultimoCargo = null,
          penultimaActividad = null
      } = req.body;

      // Insertar la postulación en la base de datos
      const result = await db.execute(`
      INSERT INTO Postulaciones (OfertaID, Rut, Nombre, ApellidoPaterno, ApellidoMaterno, Email, PretensionesSalario, CodigoOferta, Ciudad, Carrera, ExperienciaDocente, TipoInstitucion, NivelAlcanzado, Universidad, AnosExperiencia, UltimoCargo, UltimaActividad, PenultimoCargo, PenultimaActividad, CvURL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      parseInt(codigoOferta) || null,
      rut,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      pretensiones,
      codigoOferta,
      ciudad,
      carrera,
      experienciaDocente,
      tipoInstitucion,
      nivelAlcanzado,
      universidad,
      anosExperiencia || 0,
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

// Ruta para obtener todos los postulantes
router.get("/postulantes", async (req, res) => {
  try {
    const [postulantes] = await db.query(
      `SELECT 
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
    TipoInstitucion ti ON p.TipoInstitucion = ti.id;`
    );
    res.status(200).json(postulantes);
  } catch (error) {
    console.error("Error al obtener los postulantes: ", error);
    res.status(500).send({ message: "Error al obtener los postulantes", error });
  }
});


module.exports = router;
