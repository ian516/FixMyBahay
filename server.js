require('dotenv').config();
const express = require('express');
const path = require('path'); // This is needed to handle file paths
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // For password hashing

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB URI
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
    } catch (e) {
        console.error("Error connecting to MongoDB: ", e);
    }
}

connectDB();

// Middleware for parsing JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

// Serve the homepage (index.html) for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sign-up Route
app.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Please provide username, password, and role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword, role };

    try {
        const result = await client.db('FixMyBahay').collection('users').insertOne(user);
        res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await client.db('FixMyBahay').collection('users').findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', role: user.role });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
