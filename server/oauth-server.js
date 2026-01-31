import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory (Vite build output)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
} else {
    console.log('NOTE: "dist" folder not found. Server is running in API-only mode (Standard for Local Dev).');
}

// Re-load dotenv to get latest from file
dotenv.config({ path: path.join(__dirname, '../.env') });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${port}/oauth2callback`;

const getLatestRefreshToken = () => {
    // Re-load dotenv to get latest from file
    dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
    return process.env.GOOGLE_REFRESH_TOKEN;
};

app.get('/api/auth/dashboard', (req, res) => {
    const currentToken = getLatestRefreshToken();
    res.send(`
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; line-height: 1.6;">
            <h1 style="color: #0d6efd;">🚀 QMS Unified Dashboard</h1>
            <p>سيرفر المصادقة يعمل وجاهز.</p>
            
            <div style="background: ${currentToken ? '#d1e7dd' : '#fff3cd'}; border: 1px solid ${currentToken ? '#badbcc' : '#ffe69c'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${currentToken
            ? `<h3 style="margin-top: 0; color: #0f5132;">✅ Token Active</h3>
                       <p>لديك صلاحيات نشطة حالياً.</p>`
            : `<h3 style="margin-top: 0; color: #856404;">⚠️ صلاحيات مطلوبة</h3>
                       <p>السيرفر لا يمتلك صلاحيات حالياً.</p>`
        }
            </div>

            <a href="/api/auth" style="display: inline-block; padding: 12px 24px; background: #0d6efd; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Re-authenticate with Google</a>
            
            <p style="margin-top: 30px; font-size: 0.9em; color: #6c757d;">
                <a href="/">العودة للتطبيق الرئيسي</a>
            </p>
        </div>
    `);
});

app.get('/', (req, res, next) => {
    // This will fall through to express.static if we don't handle it
    // But since we want SPA routing, we'll let express.static try first
    next();
});

app.get('/api/auth', (req, res) => {
    const encodedScopes = encodeURIComponent(SCOPES.join(' '));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodedScopes}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        });

        const newRefreshToken = response.data.refresh_token;
        if (newRefreshToken) {
            const envPath = path.join(__dirname, '../.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
                envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${newRefreshToken}`);
            } else {
                envContent += `\nGOOGLE_REFRESH_TOKEN=${newRefreshToken}`;
            }

            fs.writeFileSync(envPath, envContent);
            res.send('<h1>✅ Success!</h1><p>تم حفظ الصلاحيات بنجاح! يمكنك العودة لاستخدام التطبيق الآن.</p><script>setTimeout(() => window.location.href="/", 2000);</script>');
            console.log('Successfully updated refresh token in .env');
        } else {
            res.send('<h1>⚠️ Warning</h1><p>Auth successful but no refresh token returned. Try removing the app permissions from your Google account and trying again.</p>');
        }
    } catch (error) {
        const errorData = error.response?.data || {};
        console.error('OAuth callback error:', errorData);
        res.status(500).send(`
            <h1>❌ Token Exchange Failed</h1>
            <p>Error: ${errorData.error || error.message}</p>
            <hr>
            <a href="/api/auth">Try again</a>
        `);
    }
});

app.get('/api/token', async (req, res) => {
    const refreshToken = getLatestRefreshToken();
    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token found. Please visit /api/auth' });
    }

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        res.json({
            access_token: response.data.access_token,
            expires_in: response.data.expires_in,
        });
    } catch (error) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// SPA routing: Send index.html for any unknown routes as a fallback (Only if it exists)
app.use((req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Not Found (Local Dev Mode - Use Port 8080 or run npm run build)');
    }
});

app.listen(port, () => {
    console.log(`\n================================================`);
    console.log(`QMS Unified Server: http://localhost:${port}`);
    console.log(`Serving frontend from: ${distPath}`);
    console.log(`================================================\n`);
});

