const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const { MONGO_DB_URI_LOCAL } = require('./config/config');

app.use(cors());

app.use(express.json());

app.use(require('./routes/routes'));

app.listen(process.env.PORT || 3001, () => {
    console.log('Servidor express levantado');
});

mongoose.connect(process.env.MONGODB || MONGO_DB_URI_LOCAL).then(() => {
    console.log('Base de datos conectada');
}).catch((err) => {
    console.log('Error: ' + err);
});