
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = 3001;
const JWT_SECRET = 'your-super-secret-key-change-this'; // IMPORTANT: Use a strong, secret key from environment variables in production
const JWT_EXPIRES_IN = '1h';

// --- IN-MEMORY DATABASE (for demonstration purposes) ---
// In a real application, you would use a proper database like PostgreSQL or MongoDB.
const users = [];
let userIdCounter = 1;

// --- API ENDPOINTS ---

/**
 * @route   POST /api/register
 * @desc    Register a new user
 * @access  Public
 */
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: userIdCounter++,
            email,
            password: hashedPassword,
            videos: [] 
        };

        users.push(newUser);
        console.log('User registered:', newUser);

        // Create token
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(201).json({
            token,
            user: { id: newUser.id, email: newUser.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

/**
 * @route   POST /api/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(200).json({
            token,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});


app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
