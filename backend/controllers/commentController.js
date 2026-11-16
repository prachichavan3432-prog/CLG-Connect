
const db = require('../config/db');

// GET COMMENTS FOR A POST
exports.getComments = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const result = await db.query(
            `SELECT id, post_id, content, created_at,
                    (user_id = $2) AS is_mine
             FROM comments
             WHERE post_id = $1
             ORDER BY created_at ASC`,
            [postId, req.user.id]
        );

        res.json({
            comments: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not fetch comments'
        });
    }
};


// CREATE A COMMENT
exports.createComment = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const { content } = req.body;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: 'Comment content is required'
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

        const result = await db.query(
            `INSERT INTO comments (post_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, post_id, content, created_at`,
            [postId, req.user.id, content.trim()]
        );

        res.status(201).json({
            message: 'Comment added successfully',
            comment: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not add comment'
        });
    }
};
// DELETE OWN COMMENT
exports.deleteComment = async (req, res) => {
    try {
        const commentId = Number(req.params.commentId);

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                message: 'Invalid comment ID'
            });
        }

        const result = await db.query(
            `DELETE FROM comments
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [commentId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Comment not found or you cannot delete it'
            });
        }

        res.json({
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not delete comment'
        });
    }
};