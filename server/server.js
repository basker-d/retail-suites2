
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');
const { OAuth2Client } = require('google-auth-library');

const app = express();
// Increase the limit to allow for base64 image data in requests
app.use(express.json({ limit: '10mb' }));
app.use(cors());


// --- CONFIGURATION ---
const PORT = 3001;
// IMPORTANT: In production, use environment variables for these secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_EXPIRES_IN = '1h';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Video generation will fail.");
}
if (!GOOGLE_CLIENT_ID) {
    console.warn("WARNING: GOOGLE_CLIENT_ID environment variable is not set. Google Login will fail.");
}

// --- IN-MEMORY DATABASE (for demonstration purposes) ---
const users = [];
let userIdCounter = 1;

// --- AUTH MIDDLEWARE ---
const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if(!token) {
        return res.status(401).json({ message: 'Token format is invalid' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


// --- API ENDPOINTS ---

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user using Google credential
 * @access  Public
 */
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Missing Google credential.' });
        }

        if (!GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: 'Server is not configured for Google Login.' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email } = payload;
        
        if (!email) {
             return res.status(400).json({ message: 'Email not found in Google token.' });
        }

        let user = users.find(u => u.email === email);

        if (!user) {
            // User doesn't exist, create a new one
            user = {
                id: userIdCounter++,
                email,
                password: null, // No password for Google sign-ups
                videos: []
            };
            users.push(user);
            console.log('New user registered via Google:', user.email);
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(200).json({
            token,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google authentication failed. The token may be invalid.' });
    }
});

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
        console.log('User registered:', newUser.email);

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

/**
 * @route   GET /api/videos
 * @desc    Get all videos for the authenticated user
 * @access  Private
 */
app.get('/api/videos', auth, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.videos);
});

/**
 * @route   POST /api/edit-image
 * @desc    Edit an image using a text prompt
 * @access  Private
 */
app.post('/api/edit-image', auth, async (req, res) => {
    const { imageB64, imageMimeType, prompt } = req.body;

    if (!imageB64 || !imageMimeType || !prompt) {
        return res.status(400).json({ message: 'Missing required fields for image editing.' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'Server is not configured for image editing (missing API key).' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        console.log(`[User ${req.user.id}] Starting image edit with prompt: "${prompt}"`);

        const imagePart = {
            inlineData: {
                data: imageB64,
                mimeType: imageMimeType,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: ['IMAGE'],
            },
        });

        const editedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!editedImagePart || !editedImagePart.inlineData) {
            const safetyFeedback = response.candidates?.[0]?.safetyRatings;
            if (safetyFeedback?.some(rating => rating.blocked)) {
                console.warn(`[User ${req.user.id}] Image edit blocked due to safety settings.`);
                return res.status(400).json({ message: 'The request was blocked by safety settings. Please modify your prompt.' });
            }
            throw new Error("Image generation failed to return an image.");
        }

        const editedImageB64 = editedImagePart.inlineData.data;

        console.log(`[User ${req.user.id}] Image edit successful.`);
        res.status(200).json({ imageB64: editedImageB64 });

    } catch (error) {
        console.error(`[User ${req.user.id}] Error during image editing:`, error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred on the server during image editing.' });
    }
});

/**
 * @route   POST /api/generate-video
 * @desc    Generate a new video and save it for the user
 * @access  Private
 */
app.post('/api/generate-video', auth, async (req, res) => {
    const { imageB64, imageMimeType, prompt, aspectRatio } = req.body;

    if (!imageB64 || !imageMimeType || !prompt || !aspectRatio) {
        return res.status(400).json({ message: 'Missing required fields for video generation.' });
    }
    
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'Server is not configured for video generation (missing API key).' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        console.log(`[User ${req.user.id}] Starting video generation...`);
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: { imageBytes: imageB64, mimeType: imageMimeType },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });

        console.log(`[User ${req.user.id}] Polling for video result...`);
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadUri) {
            throw new Error("Video generation failed or returned no URI.");
        }
        
        console.log(`[User ${req.user.id}] Fetching generated video from URI.`);
        const videoResponse = await fetch(`${downloadUri}&key=${GEMINI_API_KEY}`);
        
        if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            throw new Error(`Failed to download video: ${videoResponse.statusText}. Details: ${errorText}`);
        }

        const videoArrayBuffer = await videoResponse.arrayBuffer();
        const videoBase64 = Buffer.from(videoArrayBuffer).toString('base64');
        const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found after video generation.' });
        }

        const newVideo = {
            id: new Date().toISOString() + Math.random(),
            src: videoDataUrl, // Save the data URL
            prompt
        };

        user.videos.unshift(newVideo);
        console.log(`[User ${req.user.id}] Video saved to library:`, newVideo.id);

        res.status(201).json(newVideo);

    } catch (error) {
        console.error(`[User ${req.user.id}] Error during video generation:`, error);
        res.status(500).json({ message: error.message || 'An unexpected error occurred on the server.' });
    }
});


app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));