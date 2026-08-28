const API_URL = 'https://amprem-exe.vercel.app/api/amprem';
const QUOTA_URL = 'https://amprem-exe.vercel.app/api/quota';

let currentStep = 1;
let userEmail = '';
let userIdToken = '';
let selectedServer = null;
let serversData = [];

// ============ NOTIFIKASI ============
function showNotification(message, type = 'error') {
    const oldNotif = document.getElementById('notification');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.id = 'notification';
    notif.className = 'notification ' + type;
    
    const icons = {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notif.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notif.remove(), 300);
    }, 5000);
}

// ============ SIDEBAR ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

// ============ LOAD QUOTA ============
async function loadQuota() {
    try {
        const response = await fetch(QUOTA_URL);
        const data = await response.json();
        
        if (data.success) {
            serversData = data.servers;
            renderServerList(data.servers);
        }
    } catch (error) {
        console.error('Error loading quota:', error);
    }
}

// ============ RENDER SERVER LIST ============
function renderServerList(servers) {
    const serverList = document.getElementById('serverList');
    
    let html = `
        <div class="server-item ${selectedServer === null ? 'selected' : ''}" onclick="selectServer(null)">
            <div class="server-name">
                <span class="server-dot" style="background: #636e72;"></span>
                Auto (Terbaik)
            </div>
            <div class="quota-text">Otomatis pilih server dengan kuota terbanyak</div>
        </div>
    `;
    
    servers.forEach(server => {
        const percentage = server.percentage || 0;
        const statusColor = server.status === 'active' ? '#00b894' : '#d63031';
        
        html += `
            <div class="server-item ${selectedServer === server.id ? 'selected' : ''}" onclick="selectServer(${server.id})">
                <div class="server-name">
                    <span class="server-dot" style="background: ${server.theme.primary};"></span>
                    ${server.name}
                </div>
                <div class="quota-bar">
                    <div class="quota-fill" style="width: ${percentage}%; background: ${server.theme.primary};"></div>
                </div>
                <div class="quota-text">
                    API: ${server.remainingApi}/${server.limitApi} | Akun: ${server.remainingAccounts}/${server.limitAccounts}
                    <br>
                    <span style="color: ${statusColor};">${server.status === 'active' ? '🟢 Aktif' : '🔴 Habis'}</span>
                </div>
            </div>
        `;
    });
    
    serverList.innerHTML = html;
}

// ============ SELECT SERVER ============
function selectServer(serverId) {
    selectedServer = serverId;
    
    if (serverId === null) {
        document.getElementById('serverIndicator').textContent = 'Server: Auto (Terbaik)';
        applyTheme({ primary: '#6c5ce7', secondary: '#a29bfe', gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' });
    } else {
        const server = serversData.find(s => s.id === serverId);
        if (server) {
            document.getElementById('serverIndicator').textContent = `Server: ${server.name}`;
            applyTheme(server.theme);
        }
    }
    
    renderServerList(serversData);
    toggleSidebar();
}

// ============ APPLY THEME ============
function applyTheme(theme) {
    document.getElementById('logo').style.background = theme.gradient;
    document.getElementById('title').style.color = theme.primary;
    
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    
    document.querySelectorAll('.btn').forEach(btn => {
        btn.style.setProperty('background', theme.gradient, 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
    });
}

// ============ SEND MAGIC LINK ============
async function sendMagicLink() {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showStatus('❌ Masukkan email dulu!', 'error');
        showNotification('Email tidak boleh kosong!', 'warning');
        return;
    }
    
    userEmail = email;
    showStatus('⏳ Mengirim magic link...', 'info');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send-magiclink',
                email: userEmail,
                serverId: selectedServer
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success) {
            showStatus('✅ Magic link dikirim! Cek email Anda.', 'success');
            showNotification('Magic link berhasil dikirim!', 'success');
            showResult(data);
            
            currentStep = 2;
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            document.getElementById('formStep1').style.display = 'none';
            document.getElementById('formStep2').style.display = 'block';
        } else {
            showStatus('❌ ' + (data.message || 'Gagal!'), 'error');
            showNotification('Gagal: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ VERIFY ACCOUNT ============
async function verifyAccount() {
    const token = document.getElementById('token').value.trim();
    
    if (!token) {
        showStatus('❌ Masukkan magic link!', 'error');
        showNotification('Magic link tidak boleh kosong!', 'warning');
        return;
    }
    
    showStatus('⏳ Memverifikasi...', 'info');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'verify-account',
                email: userEmail,
                rawLink: token,
                serverId: selectedServer
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success && data.idToken) {
            userIdToken = data.idToken;
            showStatus('✅ Verifikasi berhasil!', 'success');
            showNotification('Verifikasi berhasil!', 'success');
            showResult(data);
            
            currentStep = 3;
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            document.getElementById('formStep2').style.display = 'none';
            document.getElementById('formStep3').style.display = 'block';
        } else {
            showStatus('❌ ' + (data.message || 'Verifikasi gagal!'), 'error');
            showNotification('Verifikasi gagal: ' + (data.message || 'Token invalid'), 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ APPLY PREMIUM ============
async function applyPremium() {
    showStatus('⏳ Mengaktifkan premium...', 'info');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'apply-premium',
                email: userEmail,
                idToken: userIdToken,
                serverId: selectedServer
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success) {
            showStatus('🎉 Premium berhasil diaktifkan!', 'success');
            showNotification('Premium berhasil diaktifkan! 🎉', 'success');
            showResult(data);
        } else {
            showStatus('❌ ' + (data.message || 'Aktivasi gagal!'), 'error');
            showNotification('Aktivasi gagal: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ SHOW STATUS ============
function showStatus(message, type) {
    const statusBox = document.getElementById('statusBox');
    statusBox.className = 'status-box ' + type;
    statusBox.innerHTML = message;
}

// ============ SHOW RESULT ============
function showResult(data) {
    const resultBox = document.getElementById('resultBox');
    resultBox.style.display = 'block';
    resultBox.textContent = JSON.stringify(data, null, 2);
}

// ============ INIT ============
loadQuota();
setInterval(loadQuota, 3000);