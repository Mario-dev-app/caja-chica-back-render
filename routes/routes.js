const express = require('express');
const app = express();

app.use(require('./usuario'));
app.use(require('./push-notifications'));
app.use(require('./money-request'));
app.use(require('./area'));
app.use(require('./concept'));
app.use(require('./approval'));
app.use(require('./cash-outlay'));
app.use(require('./utils'));

module.exports = app;