const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs');
const swaggerDoc = YAML.load('./swagger/swagger.yaml');

const app = express();
const port = config.port;
app.use(express.json());
app.use(cors());

// doc
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// db
mongoose.connect(config.databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true })
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log(`Connected to Database ${config.databaseUrl}`)
});

// api
app.get('/', (req, res) => {
    res.send(`<h1>Hello, Go to <a href='/api-doc'>/api-doc</a> route to see documentation</h1>`);
});
app.use('/api/users', require('./controller/user'))
app.use('/api/login', require('./controller/login'))
app.use('/api/me', require('./controller/me'))
app.use('/api/projects', require('./controller/project'))
app.use('/api/tasks', require('./controller/task'))

// start
app.listen(port, () => {
    console.log(`Server Started on port ${port}`);
})