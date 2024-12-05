const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Ensure you have a db.js file that handles the database connection
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_jwt_secret';

// Create admin account if it doesn't exist
const createAdminAccount = async () => {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', ['Toma']);
    if (rows.length === 0) {
        const hashedPassword = await bcrypt.hash('Blaga', 10);
        await db.promise().query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Toma', hashedPassword, 'admin']);
        console.log('Admin account "Toma" created.');
    }
};
createAdminAccount();

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'client']);
    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
        return res.status(400).json({ message: 'User does not exist' });
    }
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Incorrect password' });
    }
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, role: user.role, username: user.username });
});

// Middleware for authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Missing token. Access denied.' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Create Order (for clients)
app.post('/orders', authenticateToken, async (req, res) => {
    if (req.user.role !== 'client') {
        return res.status(403).json({ message: 'Only clients can create orders' });
    }

    const { numberOfTrucks, numberOfPallets, weightInTons, route } = req.body;
    const username = req.user.username;

    const basePrice = 100;
    const dynamicPrice = basePrice + (numberOfTrucks * 10) + (numberOfPallets * 5) + (weightInTons * 15) + (route * 0.5);

    await db.promise().query(
        'INSERT INTO orders (username, numberOfTrucks, numberOfPallets, weightInTons, route, price) VALUES (?, ?, ?, ?, ?, ?)',
        [username, numberOfTrucks, numberOfPallets, weightInTons, route, dynamicPrice]
    );

    res.status(201).json({ message: 'Order created successfully', price: dynamicPrice });
});

// Get Orders (for clients and admins)
app.get('/orders', authenticateToken, async (req, res) => {
    if (req.user.role === 'admin') {
        const [rows] = await db.promise().query('SELECT * FROM orders');
        return res.json(rows);
    } else if (req.user.role === 'client') {
        const [rows] = await db.promise().query('SELECT * FROM orders WHERE username = ?', [req.user.username]);
        return res.json(rows);
    } else {
        return res.status(403).json({ message: 'Access denied' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
