
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const passwordResetMessage = 'If an account uses that email, a verification code has been sent.';

function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function hashResetOtp(userId, otp) {
    return crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(`${userId}:${otp}`)
        .digest('hex');
}

async function sendPasswordResetEmail(to, otp) {
    const requiredSettings = [
        'GMAIL_USER',
        'GMAIL_CLIENT_ID',
        'GMAIL_CLIENT_SECRET',
        'GMAIL_REFRESH_TOKEN'
    ];
    const missingSettings = requiredSettings.filter(key => !process.env[key]);
    if (missingSettings.length) {
        throw new Error(`Missing Gmail API settings: ${missingSettings.join(', ')}`);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(`Google OAuth token request failed (${tokenResponse.status})`);
    }

    const safeFrom = process.env.GMAIL_USER.replace(/[\r\n]/g, '');
    const safeTo = to.replace(/[\r\n]/g, '');
    const message = [
        `From: CLG Connect <${safeFrom}>`,
        `To: ${safeTo}`,
        'Subject: Your CLG Connect password reset code',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        `Your password reset code is: ${otp}`,
        '',
        'This code expires in 10 minutes and can only be used once.',
        'If you did not request a password reset, you can ignore this email.'
    ].join('\r\n');
    const raw = Buffer.from(message, 'utf8').toString('base64url');

    const sendResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw })
        }
    );
    if (!sendResponse.ok) {
        throw new Error(`Gmail API send failed (${sendResponse.status})`);
    }
}


// REGISTER
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [cleanEmail, cleanUsername]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await db.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [cleanUsername, cleanEmail, hashedPassword]
        );

        const user = result.rows[0];

        // Generate JWT token automatically
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed'
        });
    }
};



// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Login failed'
        });
    }
};


// GET LOGGED-IN USER
exports.getMe = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            message: 'Could not fetch user details'
        });
    }
};

// REQUEST A PASSWORD RESET CODE
exports.requestPasswordReset = async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.json({ message: passwordResetMessage });
    }

    try {
        const userResult = await db.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );
        if (userResult.rows.length === 0) {
            return res.json({ message: passwordResetMessage });
        }

        const user = userResult.rows[0];
        const previousResult = await db.query(
            'SELECT last_sent_at FROM password_reset_otps WHERE user_id = $1',
            [user.id]
        );
        if (previousResult.rows.length) {
            const lastSentAt = new Date(previousResult.rows[0].last_sent_at).getTime();
            if (Date.now() - lastSentAt < 60 * 1000) {
                return res.json({ message: passwordResetMessage });
            }
        }

        const otp = String(crypto.randomInt(100000, 1000000));
        const otpHash = hashResetOtp(user.id, otp);
        await db.query(
            `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, attempts, last_sent_at)
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes', 0, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                otp_hash = EXCLUDED.otp_hash,
                expires_at = EXCLUDED.expires_at,
                attempts = 0,
                last_sent_at = NOW(),
                created_at = NOW()`,
            [user.id, otpHash]
        );

        try {
            await sendPasswordResetEmail(user.email, otp);
        } catch (emailError) {
            console.error('Password reset email delivery failed:', emailError.message);
            await db.query('DELETE FROM password_reset_otps WHERE user_id = $1', [user.id]);
            return res.status(503).json({
                message: 'Email verification is temporarily unavailable. Please try again later.'
            });
        }

        return res.json({ message: passwordResetMessage });
    } catch (error) {
        console.error('Password reset request failed:', error);
        return res.status(500).json({ message: 'Could not start password reset.' });
    }
};

// VERIFY A RESET CODE AND SAVE A NEW PASSWORD
exports.resetPasswordWithOtp = async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'Enter the 6-digit verification code.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    let client;
    try {
        client = await db.connect();
        await client.query('BEGIN');

        const userResult = await client.query(
            'SELECT id FROM users WHERE email = $1 FOR UPDATE',
            [email]
        );
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'The code is invalid or expired. Request a new code.' });
        }

        const userId = userResult.rows[0].id;
        const resetResult = await client.query(
            'SELECT otp_hash, expires_at, attempts FROM password_reset_otps WHERE user_id = $1 FOR UPDATE',
            [userId]
        );
        const reset = resetResult.rows[0];
        if (!reset || new Date(reset.expires_at).getTime() <= Date.now() || reset.attempts >= 5) {
            await client.query('DELETE FROM password_reset_otps WHERE user_id = $1', [userId]);
            await client.query('COMMIT');
            return res.status(400).json({ message: 'The code is invalid or expired. Request a new code.' });
        }

        const expectedHash = Buffer.from(reset.otp_hash, 'hex');
        const submittedHash = Buffer.from(hashResetOtp(userId, otp), 'hex');
        const otpMatches = expectedHash.length === submittedHash.length &&
            crypto.timingSafeEqual(expectedHash, submittedHash);

        if (!otpMatches) {
            if (reset.attempts + 1 >= 5) {
                await client.query('DELETE FROM password_reset_otps WHERE user_id = $1', [userId]);
            } else {
                await client.query(
                    'UPDATE password_reset_otps SET attempts = attempts + 1 WHERE user_id = $1',
                    [userId]
                );
            }
            await client.query('COMMIT');
            return res.status(400).json({ message: 'The code is invalid or expired. Request a new code.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, userId]
        );
        await client.query('DELETE FROM password_reset_otps WHERE user_id = $1', [userId]);
        await client.query('COMMIT');

        return res.json({ message: 'Password changed. You can now log in with your new password.' });
    } catch (error) {
        if (client) {
            try { await client.query('ROLLBACK'); } catch (_) { /* transaction may already be closed */ }
        }
        console.error('Password reset failed:', error);
        return res.status(500).json({ message: 'Could not reset the password. Please try again.' });
    } finally {
        if (client) client.release();
    }
};
