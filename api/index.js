const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Konfigurasi Alight Free API
const ALIGHT_API = {
    base: 'https://alightfree.my.id/api/v1',
    key: 'alight_live_00ef9c784c2596650debb5e853684f7a'
};

// Halaman utama
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AMPrem Backend',
        version: '3.0.0'
    });
});

// Endpoint utama
app.post('/api/amprem', async (req, res) => {
    const { action, email, rawLink, idToken } = req.body;

    console.log(`[${new Date().toISOString()}] ${action} - ${email}`);

    try {
        let endpoint = '';
        let body = {};

        switch (action) {
            case 'send-magiclink':
                endpoint = '/send-magiclink';
                body = { email };
                break;

            case 'verify-account':
                endpoint = '/verify-account';
                body = { email, rawLink };
                break;

            case 'apply-premium':
                endpoint = '/apply-premium';
                body = { email, idToken };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Action tidak dikenal'
                });
        }

        // Panggil API Alight Free
        const response = await fetch(ALIGHT_API.base + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ALIGHT_API.key
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log(`Alight Response [${action}]:`, data);

        // Teruskan response ke frontend
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.json({
            success: false,
            message: 'Error menghubungi API: ' + error.message
        });
    }
});

module.exports = app;