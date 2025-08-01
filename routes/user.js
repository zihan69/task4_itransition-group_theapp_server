const express = require('express');
const db = require('../db');
const protect = require('../middleware/auth');
const router = express.Router();

// Get all users, sorted by last login time
router.get('/', protect, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, last_login_time, registration_time, status FROM users ORDER BY last_login_time DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Block users
router.post('/block', protect, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected.' });
    }
    try {
        const placeholders = userIds.map(() => '?').join(',');
        await db.execute(`UPDATE users SET status = 'blocked' WHERE id IN (${placeholders})`, userIds);
        res.json({ message: 'Users blocked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Unblock users
router.post('/unblock', protect, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected.' });
    }
    try {
        const placeholders = userIds.map(() => '?').join(',');
        await db.execute(`UPDATE users SET status = 'active' WHERE id IN (${placeholders})`, userIds);
        res.json({ message: 'Users unblocked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete users
router.delete('/', protect, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'No users selected.' });
    }
    try {
        const placeholders = userIds.map(() => '?').join(',');
        await db.execute(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
        res.json({ message: 'Users deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;