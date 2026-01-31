import axios from 'axios';

export default async function handler(req, res) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.REDIRECT_URI;

    // Health check logic inside the auth handler for debugging env vars
    if (req.query.health === 'true') {
        return res.json({
            status: 'ok',
            hasClientId: !!GOOGLE_CLIENT_ID,
            hasClientSecret: !!GOOGLE_CLIENT_SECRET,
            hasRedirectUri: !!REDIRECT_URI,
            envKeys: Object.keys(process.env).filter(k => !k.startsWith('VERCEL_')),
        });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('Missing Env Vars:', {
            hasClientId: !!GOOGLE_CLIENT_ID,
            hasClientSecret: !!GOOGLE_CLIENT_SECRET
        });
        return res.status(500).send('Configuration Error: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in Vercel Environment Variables.');
    }

    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
    const encodedScopes = encodeURIComponent(SCOPES.join(' '));
    
    // Fallback URI if not set (though it should be set in Vercel)
    const finalRedirectUri = REDIRECT_URI || `https://${req.headers.host}/api/auth/callback`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${finalRedirectUri}&response_type=code&scope=${encodedScopes}&access_type=offline&prompt=consent`;
    
    res.redirect(authUrl);
}
