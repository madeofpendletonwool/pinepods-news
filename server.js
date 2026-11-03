import { createApp } from './src/app.js';

const app = createApp();

// On Vercel the app is imported as a handler; everywhere else, listen.
if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 3000;
    const server = app.listen(PORT, () => console.log(`PinePods News listening on http://localhost:${PORT}`));

    const shutdown = signal => {
        console.log(`${signal} received, shutting down`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 5000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export default app;
