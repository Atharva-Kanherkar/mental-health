import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Simple server is running' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Mental Health API - Simple Version' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
});
