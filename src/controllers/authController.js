// /src/controllers/authController.js

const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM Usuarios WHERE Username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).send({ message: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];

        // Comparamos el hash de la contraseña usando bcrypt
        if (!bcrypt.compareSync(password, user.Password)) {
            return res.status(401).send({ message: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign({ userId: user.UsuarioID }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).send({ token });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).send({ message: 'Error en el servidor', error });
    }
};
