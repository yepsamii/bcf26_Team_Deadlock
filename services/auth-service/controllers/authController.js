const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Template register function
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Extract user data
    const { name, email, password, contactNumber } = req.body;

    try {
        // TODO: Check if user exists in DB (db logic removed)

        // TODO: Save new user to DB (db logic removed)
        // For now, simply hash the password and simulate successful registration

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simulate user id (in production get from DB)
        const userId = "template_user_id";

        // Create and return JWT token
        const payload = {
            user: {
                id: userId
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "testsecret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Template login function
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // TODO: Find user in DB and get hashed password (db logic removed)

        // For template, fake a user and password hash
        const fakeUser = {
            id: "template_user_id",
            email: "user@example.com",
            password: await bcrypt.hash("password123", 10) // Fake hash, in reality get from DB
        };

        // Check email
        if (email !== fakeUser.email) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, fakeUser.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create and return JWT token
        const payload = {
            user: {
                id: fakeUser.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "testsecret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
