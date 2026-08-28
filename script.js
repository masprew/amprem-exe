const API_URL = 'https://amprem-exe.vercel.app/api/amprem';
const QUOTA_URL = 'https://amprem-exe.vercel.app/api/quota';

let currentStep = 1;
let userEmail = '';
let userIdToken = '';
let selectedServer = null;
let serversData = [];

// ============ SVG ICONS ============
const SVG_ICONS = {
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff7675" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55efc4" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74b9ff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    active: '<svg width="10" height="10" viewBox="0 0 24 24" fill="#00b894"><circle cx="12" cy="12" r="10"></circle></svg>',
    exhausted: '<svg width="10" height="10" viewBox="0 0 24 24" fill="#d63031"><circle cx="12" cy="12" r="10"></circle></svg>'
};

// ============ NOTIFIKASI ============
function showNotification(message, type = 'error') {
    const oldNotif = document.getElementById('notification');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.id = 'notification';
    notif.className = 'notification ' + type;
    
    notif.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${SVG_ICONS[type] || SVG_ICONS.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">${SVG_ICONS.close}</button>
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
        const statusIcon = server.status === 'active' ? SVG_ICONS.active : SVG_ICONS.exhausted;
        const statusText = server.status === 'active' ? 'Aktif' : 'Habis';
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
                    <span style="color: ${statusColor}; display: inline-flex; align-items: center; gap: 5px;">
                        ${statusIcon} ${statusText}
                    </span>
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

// ============ SHOW STATUS ============
function showStatus(message, type) {
    const statusBox = document.getElementById('statusBox');
    statusBox.className = 'status-box ' + type;
    
    let icon = '';
    if (type === 'success') icon = SVG_ICONS.success;
    else if (type === 'error') icon = SVG_ICONS.error;
    else if (type === 'info') icon = SVG_ICONS.info;
    else icon = SVG_ICONS.warning;
    
    statusBox.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px;">${icon} ${message}</span>`;
}

// ============ SHOW RESULT ============
function showResult(data) {
    const resultBox = document.getElementById('resultBox');
    resultBox.style.display = 'block';
    resultBox.textContent = JSON.stringify(data, null, 2);
}

// ============ SEND MAGIC LINK ============
async function sendMagicLink() {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showStatus('Masukkan email dulu!', 'error');
        showNotification('Email tidak boleh kosong!', 'warning');
        return;
    }
    
    userEmail = email;
    showStatus('Mengirim magic link...', 'info');
    
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
            showStatus('Magic link dikirim! Cek email Anda.', 'success');
            showNotification('Magic link berhasil dikirim!', 'success');
            showResult(data);
            
            currentStep = 2;
            document.getElementById('step1').classList.add('completed');
            document.getElementById('step2').classList.add('active');
            document.getElementById('formStep1').style.display = 'none';
            document.getElementById('formStep2').style.display = 'block';
        } else {
            showStatus(data.message || 'Gagal!', 'error');
            showNotification('Gagal: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showStatus(error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ VERIFY ACCOUNT ============
async function verifyAccount() {
    const token = document.getElementById('token').value.trim();
    
    if (!token) {
        showStatus('Masukkan magic link!', 'error');
        showNotification('Magic link tidak boleh kosong!', 'warning');
        return;
    }
    
    showStatus('Memverifikasi...', 'info');
    
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
            showStatus('Verifikasi berhasil!', 'success');
            showNotification('Verifikasi berhasil!', 'success');
            showResult(data);
            
            currentStep = 3;
            document.getElementById('step2').classList.add('completed');
            document.getElementById('step3').classList.add('active');
            document.getElementById('formStep2').style.display = 'none';
            document.getElementById('formStep3').style.display = 'block';
        } else {
            showStatus(data.message || 'Verifikasi gagal!', 'error');
            showNotification('Verifikasi gagal: ' + (data.message || 'Token invalid'), 'error');
        }
    } catch (error) {
        showStatus(error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ APPLY PREMIUM ============
async function applyPremium() {
    showStatus('Mengaktifkan premium...', 'info');
    
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
            showStatus('Premium berhasil diaktifkan!', 'success');
            showNotification('Premium berhasil diaktifkan!', 'success');
            showResult(data);
        } else {
            showStatus(data.message || 'Aktivasi gagal!', 'error');
            showNotification('Aktivasi gagal: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showStatus(error.message, 'error');
        showNotification('Network error: ' + error.message, 'error');
    }
    
    loadQuota();
}

// ============ INIT ============
loadQuota();
setInterval(loadQuota, 3000);