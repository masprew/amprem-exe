const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database sementara
const magicLinks = {};
const premiumUsers = [];

// Halaman utama
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AMPREM Backend',
    version: '1.0.0'
  });
});

// Endpoint utama
app.post('/api/amprem', (req, res) => {
  const { action, email, rawLink, idToken } = req.body;
  
  console.log(`[${new Date().toISOString()}] ${action} - ${email}`);
  
  switch (action) {
    case 'send-magiclink':
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      magicLinks[email] = token;
      
      res.json({
        success: true,
        message: 'Magic link berhasil dibuat',
        debugToken: token
      });
      break;
      
    case 'verify-account':
      if (rawLink) {
        const newIdToken = 'id_' + Math.random().toString(36) + Date.now().toString(36);
        magicLinks[email] = newIdToken;
        
        res.json({
          success: true,
          message: 'Verifikasi berhasil',
          idToken: newIdToken
        });
      } else {
        res.json({
          success: false,
          message: 'Token tidak valid'
        });
      }
      break;
      
    case 'apply-premium':
      if (idToken) {
        premiumUsers.push(email);
        
        res.json({
          success: true,
          message: 'Premium berhasil diaktifkan!',
          user: {
            email: email,
            status: 'premium',
            activatedAt: new Date().toISOString()
          }
        });
      } else {
        res.json({
          success: false,
          message: 'idToken tidak valid'
        });
      }
      break;
      
    default:
      res.status(400).json({
        success: false,
        message: 'Action tidak dikenal'
      });
  }
});

module.exports = app;
