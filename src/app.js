// Path: server/src/app.js
require('dotenv').config();  // Asegúrate de llamar a dotenv al inicio
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;  // Usará el puerto de .env o 3001 si no está definido

app.use(cors());
app.use(bodyParser.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    require('dotenv').config();
});
