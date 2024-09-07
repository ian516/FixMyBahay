require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');  // For password hashing
const app = express();

const PORT = process.env.PORT || 3000;
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

app.use(express.json());  // For parsing JSON bodies
app.use(express.static('public'));  // Serve static files from "public"

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
