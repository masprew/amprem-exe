const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================
// DAFTAR 5 SERVER DENGAN TEMA WARNA
// ============================================
const SERVERS = [
    {
        id: 1,
        name: 'Server 1',
        base: 'https://alightfree.my.id/api/v1',
        key: 'alight_live_00b34d3e39542d10b494a16f253d0ecb',
        theme: {
            primary: '#6c5ce7',
            secondary: '#a29bfe',
            gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)'
        },
        quota: { usedApi: 0, limitApi: 45, remainingApi: 45, usedAccounts: 0, limitAccounts: 15, remainingAccounts: 15 }
    },
    {
        id: 2,
        name: 'Server 2',
        base: 'https://alightfree.my.id/api/v1',
        key: 'alight_live_d9f42927dc5c1f418bd06962af91ec27',
        theme: {
            primary: '#0984e3',
            secondary: '#74b9ff',
            gradient: 'linear-gradient(135deg, #0984e3, #74b9ff)'
        },
        quota: { usedApi: 0, limitApi: 45, remainingApi: 45, usedAccounts: 0, limitAccounts: 15, remainingAccounts: 15 }
    },
    {
        id: 3,
        name: 'Server 3',
        base: 'https://alightfree.my.id/api/v1',
        key: 'alight_live_28f3781988b382a50414efa89f82bba4',
        theme: {
            primary: '#00b894',
            secondary: '#55efc4',
            gradient: 'linear-gradient(135deg, #00b894, #55efc4)'
        },
        quota: { usedApi: 0, limitApi: 45, remainingApi: 45, usedAccounts: 0, limitAccounts: 15, remainingAccounts: 15 }
    },
    {
        id: 4,
        name: 'Server 4',
        base: 'https://alightfree.my.id/api/v1',
        key: 'alight_live_3bd02e1e50f02e6bc0296db9839e8581',
        theme: {
            primary: '#e17055',
            secondary: '#fab1a0',
            gradient: 'linear-gradient(135deg, #e17055, #fab1a0)'
        },
        quota: { usedApi: 0, limitApi: 45, remainingApi: 45, usedAccounts: 0, limitAccounts: 15, remainingAccounts: 15 }
    },
    {
        id: 5,
        name: 'Server 5',
        base: 'https://alightfree.my.id/api/v1',
        key: 'alight_live_00ef9c784c2596650debb5e853684f7a',
        theme: {
            primary: '#d63031',
            secondary: '#ff7675',
            gradient: 'linear-gradient(135deg, #d63031, #ff7675)'
        },
        quota: { usedApi: 0, limitApi: 45, remainingApi: 45, usedAccounts: 0, limitAccounts: 15, remainingAccounts: 15 }
    }
];

// Fungsi pilih server dengan kuota terbanyak
function getBestServer() {
    const activeServers = SERVERS.filter(s => s.quota.remainingApi > 0);
    if (activeServers.length === 0) return null;
    
    // Pilih yang paling banyak sisa kuota
    return activeServers.sort((a, b) => b.quota.remainingApi - a.quota.remainingApi)[0];
}

// Fungsi pilih server by ID
function getServerById(id) {
    return SERVERS.find(s => s.id === parseInt(id));
}

// Update kuota dari response
function updateQuota(server, apiResponse) {
    if (apiResponse && apiResponse.quota) {
        server.quota.usedApi = apiResponse.quota.usedApiToday || 0;
        server.quota.limitApi = apiResponse.quota.limitApiToday || 45;
        server.quota.remainingApi = apiResponse.quota.remainingApiToday || 0;
        server.quota.usedAccounts = apiResponse.quota.usedAccountsToday || 0;
        server.quota.limitAccounts = apiResponse.quota.limitAccountsToday || 15;
        server.quota.remainingAccounts = (server.quota.limitAccounts - server.quota.usedAccounts) || 0;
    }
}

// Halaman utama
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AMPrem Backend',
        version: '5.0.0',
        servers: SERVERS.map(s => ({
            id: s.id,
            name: s.name,
            remainingApi: s.quota.remainingApi,
            remainingAccounts: s.quota.remainingAccounts,
            theme: s.theme
        }))
    });
});

// Endpoint cek kuota semua server
app.get('/api/quota', (req, res) => {
    res.json({
        success: true,
        servers: SERVERS.map(s => ({
            id: s.id,
            name: s.name,
            usedApi: s.quota.usedApi,
            limitApi: s.quota.limitApi,
            remainingApi: s.quota.remainingApi,
            usedAccounts: s.quota.usedAccounts,
            limitAccounts: s.quota.limitAccounts,
            remainingAccounts: s.quota.remainingAccounts,
            percentage: Math.round((s.quota.remainingApi / s.quota.limitApi) * 100),
            status: s.quota.remainingApi > 0 ? 'active' : 'exhausted',
            theme: s.theme
        }))
    });
});

// Endpoint utama
app.post('/api/amprem', async (req, res) => {
    const { action, email, rawLink, idToken, serverId } = req.body;

    console.log(`[${new Date().toISOString()}] ${action} - ${email}`);

    // Pilih server: manual atau otomatis
    let server;
    if (serverId) {
        server = getServerById(serverId);
        if (!server) {
            return res.json({ success: false, message: 'Server tidak ditemukan' });
        }
        if (server.quota.remainingApi <= 0) {
            return res.json({ success: false, message: `${server.name} kuota habis! Pilih server lain.` });
        }
    } else {
        server = getBestServer();
    }

    if (!server) {
        return res.json({
            success: false,
            message: 'Semua server sudah habis kuota. Coba lagi besok!'
        });
    }

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
                return res.status(400).json({ success: false, message: 'Action tidak dikenal' });
        }

        console.log(`🔄 ${server.name} - ${action}`);

        const response = await fetch(server.base + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': server.key
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        updateQuota(server, data);

        data.serverInfo = {
            id: server.id,
            name: server.name,
            remainingApi: server.quota.remainingApi,
            remainingAccounts: server.quota.remainingAccounts,
            theme: server.theme
        };

        res.json(data);

    } catch (error) {
        res.json({
            success: false,
            message: 'Error: ' + error.message
        });
    }
});

module.exports = app;