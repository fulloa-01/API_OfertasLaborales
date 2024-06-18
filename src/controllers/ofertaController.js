// server/src/controllers/ofertaController.js
const db = require('../config/dbConfig');

// Crear una nueva oferta laboral
exports.createOferta = async (req, res) => {
    const { titulo, nivelAlcanzado, departamento, anosExperiencia, detalle, salario, vacantes, ubicacionGeografica, aceptaExtranjeros } = req.body;
    try {
        const result = await db.execute(
            `INSERT INTO Ofertas (Titulo, NivelAlcanzado, Departamento, AnosExperiencia, Detalle, Salario, Vacantes, UbicacionGeografica, AceptaExtranjeros)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titulo, nivelAlcanzado, departamento, anosExperiencia, detalle, salario, vacantes, ubicacionGeografica, aceptaExtranjeros]
        );
        res.status(201).send({ message: 'Oferta creada', ofertaId: result[0].insertId });
    } catch (error) {
        console.error('Error al crear la oferta:', error);
        res.status(500).send({ message: 'Error al crear la oferta', error });
    }
};

// Obtener todas las ofertas laborales
exports.getOfertas = async (req, res) => {
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
        console.error('Error al obtener las ofertas:', error);
        res.status(500).send({ message: 'Error al obtener las ofertas', error });
    }
};

// Obtener una oferta laboral por ID
exports.getOfertaById = async (req, res) => {
    const { id } = req.params;
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
            JOIN Departamentos D ON O.Departamento = D.DepartamentoID
            WHERE O.OfertaID = ?;
        `;
        const [oferta] = await db.query(query, [id]);
        if (oferta.length === 0) {
            return res.status(404).send({ message: 'Oferta no encontrada' });
        }
        res.status(200).json(oferta[0]);
    } catch (error) {
        console.error('Error al obtener la oferta:', error);
        res.status(500).send({ message: 'Error al obtener la oferta', error });
    }
};

// Actualizar una oferta laboral
exports.updateOferta = async (req, res) => {
    const { id } = req.params;
    const { Titulo, NivelAlcanzado, Departamento, AnosExperiencia, Detalle, Salario, Vacantes, UbicacionGeografica, AceptaExtranjeros } = req.body;
    console.log(req.body);
    // Asignar null si el valor es undefined
    const values = [
        Titulo || null,
        NivelAlcanzado || null,
        Departamento || null,
        AnosExperiencia || null,
        Detalle || null,
        Salario || null,
        Vacantes || null,
        UbicacionGeografica || null,
        AceptaExtranjeros || null,
        id
    ];
    
    try {
        const result = await db.execute(
            `UPDATE Ofertas
             SET Titulo = ?, NivelAlcanzado = ?, Departamento = ?, AnosExperiencia = ?, Detalle = ?, Salario = ?, Vacantes = ?, UbicacionGeografica = ?, AceptaExtranjeros = ?
             WHERE OfertaID = ?`,
            values
        );
        if (result[0].affectedRows === 0) {
            return res.status(404).send({ message: 'Oferta no encontrada' });
        }
        res.status(200).send({ message: 'Oferta actualizada' });
    } catch (error) {
        console.error('Error al actualizar la oferta:', error);
        res.status(500).send({ message: 'Error al actualizar la oferta', error });
    }
};


// Eliminar una oferta laboral
exports.deleteOferta = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.execute(
            `DELETE FROM Ofertas WHERE OfertaID = ?`,
            [id]
        );
        if (result[0].affectedRows === 0) {
            return res.status(404).send({ message: 'Oferta no encontrada' });
        }
        res.status(200).send({ message: 'Oferta eliminada' });
    } catch (error) {
        console.error('Error al eliminar la oferta:', error);
        res.status(500).send({ message: 'Error al eliminar la oferta', error });
    }
};
