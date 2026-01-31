import app from '../api/index.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`\n================================================`);
    console.log(`QMS Unified Server (Local): http://localhost:${port}`);
    console.log(`OAuth Callback: http://localhost:${port}/api/auth/callback`);
    console.log(`================================================\n`);
});
