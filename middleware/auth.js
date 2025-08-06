const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [users] = await db.execute('SELECT id, status FROM users WHERE id = ?', [decoded.id]);
            const user = users[0];

            if (!user) {
                return res.status(401).json({ message: 'User not found. Redirecting to login.' });
            }
            if (user.status === 'blocked') {
                return res.status(403).json({ message: 'User is blocked. Redirecting to login.' });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed. Redirecting to login.' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token. Redirecting to login.' });
    }
};

module.exports = protect;