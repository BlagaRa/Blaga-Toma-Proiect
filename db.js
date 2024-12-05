const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '456258159357Br@',
    database: 'baza_de_date',
    port: '3306'
});

connection.connect(err => {
    if (err) {
        console.error('Eroare la conectarea la baza de date:', err.message);
        process.exit(1); // Oprește aplicația în caz de eroare
    } else {
        console.log('Conectat la baza de date MySQL.');
    }
});

module.exports = connection;
