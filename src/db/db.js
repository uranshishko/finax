const path = require('path');
const DataStore = require('nedb');

const db = {};

db.invoices = new DataStore({
    filename: path.join('.', 'src', 'db', 'databases', 'invoices'),
    autoload: true,
});

db.clients = new DataStore({
    filename: path.join('.', 'src', 'db', 'databases', 'clients'),
    autoload: true,
});

db.settings = new DataStore({
    filename: path.join('.', 'src', 'db', 'databases', 'settings'),
    autoload: true,
});

db.invoices.loadDatabase();
db.clients.loadDatabase();
db.settings.loadDatabase();

module.exports = db;
