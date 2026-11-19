const db = require('../config/db');

function parseCommunityId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

async function getMemberRole(communityId, userId) {
    const result = await db.query(
        `SELECT role FROM community_members
         WHERE community_id = $1 AND user_id = $2`,
        [communityId, userId]
    );
    return result.rows[0]?.role || null;
}

async function requireMember(communityId, userId, res) {
    const role = await getMemberRole(communityId, userId);
    if (!role) {
        res.status(403).json({ message: 'Join this community to view it.' });
        return null;
    }
    return role;
}

// GET COMMUNITIES AVAILABLE TO THE SIGNED-IN USER
exports.getCommunities = async (req, res) => {
    try {
        // Seed the original starter communities once so Explore is useful on a new database.
        const seedClient = await db.connect();
        try {
            await seedClient.query('BEGIN');
            await seedClient.query('SELECT pg_advisory_xact_lock(41287, 1)');
            const existing = await seedClient.query('SELECT id FROM communities LIMIT 1');
            if (!existing.rows.length) {
                const starter = [
                    ['Campus Talk', 'Discuss campus life and share your thoughts.'],
                    ['Study Group', 'Share notes and prepare for exams together.'],
                    ['Campus Events', 'Discover college events and activities.']
                ];
                for (const [name, description] of starter) {
                    const created = await seedClient.query(
                        `INSERT INTO communities (name, description, created_by)
                         VALUES ($1, $2, $3) RETURNING id`,
                        [name, description, req.user.id]
                    );
                    await seedClient.query(
                        `INSERT INTO community_members (community_id, user_id, role)
                         VALUES ($1, $2, 'leader') ON CONFLICT DO NOTHING`,
                        [created.rows[0].id, req.user.id]
                    );
                }
            }
            await seedClient.query('COMMIT');
        } catch (seedError) {
            await seedClient.query('ROLLBACK').catch(() => {});
            throw seedError;
        } finally {
            seedClient.release();
        }

        const result = await db.query(
            `SELECT c.id, c.name, c.description, c.created_at, c.created_by,
                    COUNT(cm.user_id)::INTEGER AS members_count,
                    EXISTS (
                        SELECT 1 FROM community_members mine
                        WHERE mine.community_id = c.id AND mine.user_id = $1
                    ) AS is_member,
                    (SELECT mine.role FROM community_members mine
                     WHERE mine.community_id = c.id AND mine.user_id = $1) AS my_role
             FROM communities c
             LEFT JOIN community_members cm ON cm.community_id = c.id
             GROUP BY c.id
             ORDER BY c.created_at DESC, c.id DESC`,
            [req.user.id]
        );
        res.json({ communities: result.rows });
    } catch (error) {
        console.error('Get communities error:', error);
        res.status(500).json({ message: 'Could not fetch communities.' });
    }
};

// CREATE A COMMUNITY AND MAKE ITS CREATOR THE LEADER
exports.createCommunity = async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string'
        ? req.body.description.trim()
        : '';

    if (!name || name.length > 100) {
        return res.status(400).json({ message: 'Community name must be 1–100 characters.' });
    }
    if (description.length > 500) {
        return res.status(400).json({ message: 'Description must be 500 characters or fewer.' });
    }

    let client;
    try {
        client = await db.connect();
        await client.query('BEGIN');

        const duplicate = await client.query(
            'SELECT id FROM communities WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        if (duplicate.rows.length) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'A community with that name already exists.' });
        }

        const created = await client.query(
            `INSERT INTO communities (name, description, created_by)
             VALUES ($1, $2, $3)
             RETURNING id, name, description, created_by, created_at`,
            [name, description, req.user.id]
        );
        const community = created.rows[0];
        await client.query(
            `INSERT INTO community_members (community_id, user_id, role)
             VALUES ($1, $2, 'leader')`,
            [community.id, req.user.id]
        );
        await client.query('COMMIT');
        res.status(201).json({ message: 'Community created.', community });
    } catch (error) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        console.error('Create community error:', error);
        res.status(500).json({ message: 'Could not create community.' });
    } finally {
        if (client) client.release();
    }
};

// JOIN A COMMUNITY
exports.joinCommunity = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });

    try {
        const community = await db.query('SELECT id FROM communities WHERE id = $1', [communityId]);
        if (!community.rows.length) return res.status(404).json({ message: 'Community not found.' });

        await db.query(
            `INSERT INTO community_members (community_id, user_id, role)
             VALUES ($1, $2, 'member')
             ON CONFLICT (community_id, user_id) DO NOTHING`,
            [communityId, req.user.id]
        );
        res.json({ message: 'You joined the community.' });
    } catch (error) {
        console.error('Join community error:', error);
        res.status(500).json({ message: 'Could not join the community.' });
    }
};

// LEAVE A COMMUNITY
exports.leaveCommunity = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });

    try {
        const role = await getMemberRole(communityId, req.user.id);
        if (!role) return res.status(404).json({ message: 'You are not a member of this community.' });
        if (role === 'leader') {
            return res.status(400).json({ message: 'A leader must transfer leadership before leaving.' });
        }
        await db.query(
            'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
            [communityId, req.user.id]
        );
        res.json({ message: 'You left the community.' });
    } catch (error) {
        console.error('Leave community error:', error);
        res.status(500).json({ message: 'Could not leave the community.' });
    }
};

// COMMUNITY DETAIL AND MEMBER LIST
exports.getCommunity = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });

    try {
        const communityResult = await db.query(
            `SELECT c.id, c.name, c.description, c.created_by, c.created_at,
                    u.username AS leader_name
             FROM communities c JOIN users u ON u.id = c.created_by
             WHERE c.id = $1`,
            [communityId]
        );
        if (!communityResult.rows.length) return res.status(404).json({ message: 'Community not found.' });

        const myRole = await requireMember(communityId, req.user.id, res);
        if (!myRole) return;

        const membersResult = await db.query(
            `SELECT u.id, u.username, cm.role, cm.joined_at
             FROM community_members cm JOIN users u ON u.id = cm.user_id
             WHERE cm.community_id = $1
             ORDER BY CASE cm.role WHEN 'leader' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
                      cm.joined_at ASC`,
            [communityId]
        );
        res.json({ community: communityResult.rows[0], my_role: myRole, members: membersResult.rows });
    } catch (error) {
        console.error('Get community detail error:', error);
        res.status(500).json({ message: 'Could not load community details.' });
    }
};

// COMMUNITY POSTS
exports.getCommunityPosts = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });

    try {
        const role = await requireMember(communityId, req.user.id, res);
        if (!role) return;
        const result = await db.query(
            `SELECT p.id, p.title, p.content, p.post_type, p.created_at,
                    p.user_id, u.username, (p.user_id = $2) AS is_mine
             FROM posts p JOIN users u ON u.id = p.user_id
             WHERE p.community_id = $1
             ORDER BY p.created_at DESC, p.id DESC
             LIMIT 100`,
            [communityId, req.user.id]
        );
        res.json({ posts: result.rows, my_role: role });
    } catch (error) {
        console.error('Get community posts error:', error);
        res.status(500).json({ message: 'Could not load community posts.' });
    }
};

// COMMUNITY CHAT HISTORY (afterId supports light polling without duplicates)
exports.getMessages = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    const afterId = Number(req.query.afterId || 0);
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });
    if (!Number.isSafeInteger(afterId) || afterId < 0) {
        return res.status(400).json({ message: 'Invalid message cursor.' });
    }

    try {
        const role = await requireMember(communityId, req.user.id, res);
        if (!role) return;
        const result = afterId === 0
            ? await db.query(
                `SELECT * FROM (
                    SELECT m.id, m.content, m.created_at, m.user_id, u.username
                    FROM community_messages m JOIN users u ON u.id = m.user_id
                    WHERE m.community_id = $1
                    ORDER BY m.id DESC LIMIT 100
                 ) recent_messages
                 ORDER BY id ASC`,
                [communityId]
            )
            : await db.query(
                `SELECT m.id, m.content, m.created_at, m.user_id, u.username
                 FROM community_messages m JOIN users u ON u.id = m.user_id
                 WHERE m.community_id = $1 AND m.id > $2
                 ORDER BY m.id ASC LIMIT 100`,
                [communityId, afterId]
            );
        res.json({ messages: result.rows });
    } catch (error) {
        console.error('Get community chat error:', error);
        res.status(500).json({ message: 'Could not load community chat.' });
    }
};

// SEND A COMMUNITY CHAT MESSAGE
exports.sendMessage = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!communityId) return res.status(400).json({ message: 'Invalid community ID.' });
    if (!content || content.length > 500) {
        return res.status(400).json({ message: 'Message must be between 1 and 500 characters.' });
    }

    try {
        const role = await requireMember(communityId, req.user.id, res);
        if (!role) return;
        const result = await db.query(
            `INSERT INTO community_messages (community_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, content, created_at, user_id`,
            [communityId, req.user.id, content]
        );
        const user = await db.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
        res.status(201).json({ message: { ...result.rows[0], username: user.rows[0].username } });
    } catch (error) {
        console.error('Send community chat error:', error);
        res.status(500).json({ message: 'Could not send your message.' });
    }
};

// LEADER-ONLY: PROMOTE A MEMBER TO ADMIN OR REVOKE ADMIN
exports.setMemberRole = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    const userId = parseCommunityId(req.params.userId);
    const role = req.body?.role;
    if (!communityId || !userId) return res.status(400).json({ message: 'Invalid community or member ID.' });
    if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: 'Role must be admin or member.' });
    }

    try {
        const myRole = await getMemberRole(communityId, req.user.id);
        if (myRole !== 'leader') return res.status(403).json({ message: 'Only the community leader can manage admins.' });
        const targetRole = await getMemberRole(communityId, userId);
        if (!targetRole) return res.status(404).json({ message: 'Community member not found.' });
        if (targetRole === 'leader') return res.status(400).json({ message: 'The leader role cannot be changed here.' });

        await db.query(
            'UPDATE community_members SET role = $1 WHERE community_id = $2 AND user_id = $3',
            [role, communityId, userId]
        );
        res.json({ message: role === 'admin' ? 'Member promoted to admin.' : 'Admin role removed.' });
    } catch (error) {
        console.error('Set community role error:', error);
        res.status(500).json({ message: 'Could not update the member role.' });
    }
};

// LEADER-ONLY: REMOVE A COMMUNITY MEMBER
exports.removeMember = async (req, res) => {
    const communityId = parseCommunityId(req.params.id);
    const userId = parseCommunityId(req.params.userId);
    if (!communityId || !userId) return res.status(400).json({ message: 'Invalid community or member ID.' });

    try {
        const myRole = await getMemberRole(communityId, req.user.id);
        if (myRole !== 'leader') return res.status(403).json({ message: 'Only the community leader can remove members.' });
        const targetRole = await getMemberRole(communityId, userId);
        if (!targetRole) return res.status(404).json({ message: 'Community member not found.' });
        if (targetRole === 'leader') return res.status(400).json({ message: 'The community leader cannot be removed.' });

        await db.query(
            'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
            [communityId, userId]
        );
        res.json({ message: 'Member removed from the community.' });
    } catch (error) {
        console.error('Remove community member error:', error);
        res.status(500).json({ message: 'Could not remove the member.' });
    }
};
