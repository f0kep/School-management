require('dotenv').config();
const express = require('express');
const path = require('path');
const sequelize = require('./db.js');
const models = require('./models/models.js');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { seedDatabase } = require('./seed.js');

const router = require('./routes/index.js');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(helmet());

app.use(compression());

app.use(morgan('combined'));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', cors(), (req, res, next) => {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api', router);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('База данных и таблицы синхронизированы');
        
        // Заполняем базу данных тестовыми данными
        await seedDatabase();
        console.log('База данных заполнена тестовыми данными');

        app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
    } catch (e) {
        console.log(e);
    }
}

start();