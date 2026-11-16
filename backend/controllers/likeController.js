
const db = require('../config/db');

// LIKE A POST
exports.likePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await db.query(
            'SELECT id FROM posts WHERE id = $1',
            [postId]
        );

        if (post.rows.length === 0) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        await db.query(
            `INSERT INTO post_likes (post_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (post_id, user_id) DO NOTHING`,
            [postId, req.user.id]
        );

        res.json({
            message: 'Post liked successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not like post'
        });
    }
};


// UNLIKE A POST
exports.unlikePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        await db.query(
            `DELETE FROM post_likes
             WHERE post_id = $1 AND user_id = $2`,
            [postId, req.user.id]
        );

        res.json({
            message: 'Post unliked successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not unlike post'
        });
    }
};


// GET LIKE COUNT
// GET LIKE COUNT AND USER LIKE STATUS
exports.getLikeCount = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const result = await db.query(
            `SELECT
                COUNT(*)::INTEGER AS likes_count,
                EXISTS (
                    SELECT 1
                    FROM post_likes
                    WHERE post_id = $1 AND user_id = $2
                ) AS liked_by_user
             FROM post_likes
             WHERE post_id = $1`,
            [postId, req.user.id]
        );

        res.json({
            likes_count: result.rows[0].likes_count,
            liked_by_user: result.rows[0].liked_by_user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not fetch like status'
        });
    }
};