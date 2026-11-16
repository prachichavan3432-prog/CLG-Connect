
const db = require('../config/db');

// SAVE USER INTERESTS
exports.saveInterests = async (req, res) => {
    try {
        const { interests } = req.body;

        if (!Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({
                message: 'Please select at least one interest'
            });
        }

        const cleanInterests = [...new Set(
            interests
                .filter(item => typeof item === 'string')
                .map(item => item.trim())
                .filter(item => item.length > 0)
        )];

        if (cleanInterests.length === 0) {
            return res.status(400).json({
                message: 'No valid interests provided'
            });
        }

        for (const interest of cleanInterests) {
            await db.query(
                `INSERT INTO user_interests (user_id, interest_name)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, interest_name) DO NOTHING`,
                [req.user.id, interest]
            );
        }

        res.status(201).json({
            message: 'Interests saved successfully',
            interests: cleanInterests
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Could not save interests'
        });
    }
};

// GET USER INTERESTS
exports.getInterests = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT interest_name
             FROM user_interests
             WHERE user_id = $1
             ORDER BY interest_name`,
            [req.user.id]
        );

        res.json({
            interests: result.rows.map(row => row.interest_name)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Could not fetch interests'
        });
    }
};
