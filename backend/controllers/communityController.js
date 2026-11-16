const db = require('../config/db');

// GET ALL COMMUNITIES
exports.getCommunities = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                c.id,
                c.name,
                c.description,
                c.created_at,
                c.created_by,
                COUNT(cm.id)::INTEGER AS members_count
            FROM communities c
            LEFT JOIN community_members cm
                ON c.id = cm.community_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        res.json({
            communities: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not fetch communities'
        });
    }
};


// CREATE COMMUNITY
exports.createCommunity = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Community name is required'
            });
        }

        const result = await db.query(
            `INSERT INTO communities
             (name, description, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                name.trim(),
                description || '',
                req.user.id
            ]
        );

        res.status(201).json({
            message: 'Community created successfully',
            community: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not create community'
        });
    }
};


// JOIN COMMUNITY
exports.joinCommunity = async (req, res) => {
    try {
        const communityId = Number(req.params.id);

        if (!Number.isInteger(communityId) || communityId <= 0) {
            return res.status(400).json({
                message: 'Invalid community ID'
            });
        }

        const community = await db.query(
            'SELECT id FROM communities WHERE id = $1',
            [communityId]
        );

        if (community.rows.length === 0) {
            return res.status(404).json({
                message: 'Community not found'
            });
        }

        await db.query(
            `INSERT INTO community_members (community_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (community_id, user_id) DO NOTHING`,
            [communityId, req.user.id]
        );

        res.json({
            message: 'Community joined successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Could not join community'
        });
    }
};
