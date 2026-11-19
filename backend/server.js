require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');
const savedPostRoutes = require('./routes/savedPostRoutes');
const pollRoutes = require('./routes/pollRoutes');
const interestRoutes = require('./routes/interestRoutes');

const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/saved-posts', savedPostRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/interests', interestRoutes);

// Database connection test
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            status: 'success',
            database: 'PostgreSQL connected'
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Serve the existing frontend from the same service so it can call /api directly.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        // The schema uses IF NOT EXISTS, so it is safe to apply on each startup.
        const schema = fs.readFileSync(
            path.join(__dirname, 'database', 'schema.sql'),
            'utf8'
        );
        await db.query(schema);

        app.listen(PORT, () => {
            console.log(`CLG Connect server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize the database:', error);
        process.exit(1);
    }
}

start();
