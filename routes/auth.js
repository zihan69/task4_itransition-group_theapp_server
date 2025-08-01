const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// User Registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account is blocked.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Update last login time
        await db.execute('UPDATE users SET last_login_time = NOW() WHERE id = ?', [user.id]);

        const token = generateToken(user.id);
        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// "Forgot Password" functionality
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Please enter your email address.' });
    }
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            // It's a good security practice not to reveal if the email exists or not
            return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
        }

        // TODO: Generate a reset token (e.g., using crypto) and save it to the database with an expiration time.
        // TODO: Send an email to the user with a link containing the reset token.

        res.status(200).json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;