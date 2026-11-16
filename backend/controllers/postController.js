
const db = require('../config/db');


// GET ALL POSTS

exports.getPosts = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        const result = await db.query(`
            SELECT
                p.id,
                p.title,
                p.content,
                p.image_url,
                p.post_type,
                p.community_id,
                p.created_at,
                CASE
                    WHEN p.community_id IS NULL THEN 'Campus'
                    ELSE c.name
                END AS community_name,
                (p.user_id = $1) AS is_mine
            FROM posts p
            LEFT JOIN communities c
                ON p.community_id = c.id
            ORDER BY p.created_at DESC
        `, [userId]);

        res.json({
            posts: result.rows
        });

    } catch (error) {
        console.error('Get posts error:', error);

        res.status(500).json({
            message: 'Could not fetch posts'
        });
    }
};




// CREATE POST
exports.createPost = async (req, res) => {
    try {
        const { title, content, community_id, post_type } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Post content is required' });
        }

        const type = post_type || 'text';

        if (!['text', 'image', 'video'].includes(type)) {
            return res.status(400).json({ message: 'Invalid post type' });
        }

        let communityId = null;

        if (community_id !== undefined && community_id !== null) {
            communityId = Number(community_id);

            if (!Number.isInteger(communityId) || communityId <= 0) {
                return res.status(400).json({ message: 'Invalid community ID' });
            }

            const membership = await db.query(
                `SELECT id FROM community_members
                 WHERE community_id = $1 AND user_id = $2`,
                [communityId, req.user.id]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({
                    message: 'Join this community before posting'
                });
            }
        }

        const result = await db.query(
            `INSERT INTO posts
             (user_id, community_id, title, content, post_type)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, content, community_id,
                       post_type, created_at`,
            [req.user.id, communityId, title || null, content.trim(), type]
        );

        res.status(201).json({
            message: 'Post created successfully',
            post: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Could not create post' });
    }
};


// UPDATE OWN POST
exports.updatePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);
        const { title, content } = req.body;

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Post content is required' });
        }

        const result = await db.query(
            `UPDATE posts
             SET title = $1, content = $2
             WHERE id = $3 AND user_id = $4
             RETURNING id, title, content, created_at`,
            [title || null, content.trim(), postId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Post not found or you cannot edit it'
            });
        }

        res.json({
            message: 'Post updated successfully',
            post: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Could not update post' });
    }
};


// DELETE OWN POST
exports.deletePost = async (req, res) => {
    try {
        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const result = await db.query(
            `DELETE FROM posts
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [postId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Post not found or you cannot delete it'
            });
        }

        res.json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Could not delete post' });
    }
};
