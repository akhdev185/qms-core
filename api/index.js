import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

// Default Redirect URI
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:3001/api/auth/callback`;

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get('/api/auth/dashboard', (req, res) => {
    const currentToken = process.env.GOOGLE_REFRESH_TOKEN;
    res.send(`
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; line-height: 1.6; direction: rtl; text-align: right;">
            <h1 style="color: #0d6efd;">🚀 QMS Unified Dashboard (Serverless)</h1>
            <p>سيرفر المصادقة يعمل على Vercel.</p>
            
            <div style="background: ${currentToken ? '#d1e7dd' : '#fff3cd'}; border: 1px solid ${currentToken ? '#badbcc' : '#ffe69c'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${currentToken
            ? `<h3 style="margin-top: 0; color: #0f5132;">✅ Token Active</h3>
                       <p>لديك صلاحيات نشطة حالياً (تم إعداد GOOGLE_REFRESH_TOKEN).</p>`
            : `<h3 style="margin-top: 0; color: #856404;">⚠️ صلاحيات مطلوبة</h3>
                       <p>لم يتم العثور على GOOGLE_REFRESH_TOKEN في متغيرات البيئة.</p>
                       <p>يرجى المصادقة أدناه، ثم نسخ الرمز الناتج وإضافته إلى متغيرات البيئة في Vercel.</p>`
        }
            </div>

            <a href="/api/auth" style="display: inline-block; padding: 12px 24px; background: #0d6efd; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                ${currentToken ? 'إعادة المصادقة (Re-authenticate)' : 'تسجيل الدخول باستخدام Google'}
            </a>
            
            <p style="margin-top: 30px; font-size: 0.9em; color: #6c757d;">
                <a href="/">العودة للتطبيق الرئيسي</a>
            </p>
        </div>
    `);
});

app.get('/api/auth', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(500).send('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in Environment Variables.');
    }
    const encodedScopes = encodeURIComponent(SCOPES.join(' '));
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodedScopes}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
});

// Handle both standard callback paths
app.get(['/oauth2callback', '/api/auth/callback', '/api/auth/google/callback'], async (req, res) => {
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
            res.send(`
                <div style="font-family: sans-serif; padding: 20px; max-width: 800px; line-height: 1.6; direction: rtl; text-align: right;">
                    <h1 style="color: #0f5132;">✅ تم استخراج التوكن بنجاح!</h1>
                    <p>بما أنك تستخدم Vercel (Serverless)، لا يمكننا حفظ التوكن تلقائياً.</p>
                    <p><strong>يرجى نسخ هذا الكود وإضافته إلى متغيرات البيئة (Environment Variables) في إعدادات مشروع Vercel:</strong></p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; overflow-x: auto; margin: 20px 0;">
                        <strong>Key:</strong> GOOGLE_REFRESH_TOKEN<br>
                        <strong>Value:</strong><br>
                        <code style="background: #e9ecef; padding: 5px; display: block; margin-top: 5px; word-break: break-all;">${newRefreshToken}</code>
                    </div>

                    <p>بعد إضافة المتغير، قم بإعادة نشر المشروع (Redeploy) ليعمل بشكل صحيح.</p>
                </div>
            `);
        } else {
            res.send('<h1>⚠️ Warning</h1><p>Auth successful but no refresh token returned. Try removing the app permissions from your Google account and trying again.</p>');
        }
    } catch (error) {
        const errorData = error.response?.data || {};
        console.error('OAuth callback error:', errorData);
        res.status(500).send(`
            <h1>❌ Token Exchange Failed</h1>
            <p>Error: ${errorData.error || error.message}</p>
            <p>Redirect URI used: ${REDIRECT_URI}</p>
            <hr>
            <a href="/api/auth">Try again</a>
        `);
    }
});

app.get('/api/token', async (req, res) => {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token found. Please set GOOGLE_REFRESH_TOKEN in Vercel Environment Variables.' });
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

export default app;
