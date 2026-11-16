
const db = require('../config/db');

// CREATE A POLL
exports.createPoll = async (req, res) => {
    const client = await db.connect();

    try {
        const { question, options, community_id, expires_at } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                message: 'Poll question is required'
            });
        }

        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({
                message: 'At least two poll options are required'
            });
        }

        const cleanOptions = options
            .map(option => String(option).trim())
            .filter(option => option.length > 0);

        if (cleanOptions.length < 2 || cleanOptions.length !== options.length) {
            return res.status(400).json({
                message: 'Please provide at least two valid options'
            });
        }

        await client.query('BEGIN');

        const pollResult = await client.query(
            `INSERT INTO polls
             (question, community_id, created_by, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                question.trim(),
                community_id || null,
                req.user.id,
                expires_at || null
            ]
        );

        const poll = pollResult.rows[0];

        for (const option of cleanOptions) {
            await client.query(
                `INSERT INTO poll_options (poll_id, option_text)
                 VALUES ($1, $2)`,
                [poll.id, option]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Poll created successfully',
            poll
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);

        res.status(500).json({
            message: 'Could not create poll'
        });

    } finally {
        client.release();
    }
};


// GET ALL POLLS
exports.getPolls = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                p.id,
                p.question,
                p.community_id,
                p.expires_at,
                p.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', po.id,
                            'option_text', po.option_text
                        )
                    ) FILTER (WHERE po.id IS NOT NULL),
                    '[]'
                ) AS options
            FROM polls p
            LEFT JOIN poll_options po ON p.id = po.poll_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        res.json({
            polls: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Could not fetch polls'
        });
    }
};


// VOTE ON A POLL
exports.votePoll = async (req, res) => {
    try {
        const pollId = Number(req.params.pollId);
        const optionId = Number(req.body.option_id);

        if (!Number.isInteger(pollId) || pollId <= 0 ||
            !Number.isInteger(optionId) || optionId <= 0) {
            return res.status(400).json({
                message: 'Invalid poll or option ID'
            });
        }

        const poll = await db.query(
            `SELECT id, expires_at FROM polls WHERE id = $1`,
            [pollId]
        );

        if (poll.rows.length === 0) {
            return res.status(404).json({
                message: 'Poll not found'
            });
        }

        if (poll.rows[0].expires_at &&
            new Date(poll.rows[0].expires_at) <= new Date()) {
            return res.status(400).json({
                message: 'This poll has expired'
            });
        }

        const option = await db.query(
            `SELECT id FROM poll_options
             WHERE id = $1 AND poll_id = $2`,
            [optionId, pollId]
        );

        if (option.rows.length === 0) {
            return res.status(400).json({
                message: 'Option does not belong to this poll'
            });
        }

        await db.query(
            `INSERT INTO poll_votes (poll_id, option_id, user_id)
             VALUES ($1, $2, $3)`,
            [pollId, optionId, req.user.id]
        );

        res.status(201).json({
            message: 'Vote submitted successfully'
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'You have already voted in this poll'
            });
        }

        console.error(error);

        res.status(500).json({
            message: 'Could not submit vote'
        });
    }
};


// GET POLL RESULTS
exports.getPollResults = async (req, res) => {
    try {
        const pollId = Number(req.params.pollId);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                message: 'Invalid poll ID'
            });
        }

        const result = await db.query(
            `SELECT
                po.id AS option_id,
                po.option_text,
                COUNT(pv.id)::INTEGER AS votes
             FROM poll_options po
             LEFT JOIN poll_votes pv
                ON po.id = pv.option_id
                AND pv.poll_id = po.poll_id
             WHERE po.poll_id = $1
             GROUP BY po.id, po.option_text
             ORDER BY po.id`,
            [pollId]
        );

        res.json({
            results: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Could not fetch poll results'
        });
    }
};
