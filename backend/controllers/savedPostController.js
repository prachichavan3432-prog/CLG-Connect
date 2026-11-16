
const db = require('../config/db');

// SAVE A POST
exports.savePost = async (req, res) => {
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
            `INSERT INTO saved_posts (post_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (post_id, user_id) DO NOTHING`,
            [postId, req.user.id]
        );

        res.json({
            message: 'Post saved successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not save post'
        });
    }
};


// GET SAVED POSTS
exports.getSavedPosts = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                p.post_type,
                p.created_at
             FROM saved_posts s
             JOIN posts p ON s.post_id = p.id
             WHERE s.user_id = $1
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );

        res.json({
            saved_posts: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not fetch saved posts'
        });
    }
};


// REMOVE A SAVED POST
exports.removeSavedPost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        await db.query(
            `DELETE FROM saved_posts
             WHERE post_id = $1 AND user_id = $2`,
            [postId, req.user.id]
        );

        res.json({
            message: 'Saved post removed successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not remove saved post'
        });
    }
};