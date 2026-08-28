const API_URL = 'https://amprem-exe.vercel.app/api/amprem';
const QUOTA_URL = 'https://amprem-exe.vercel.app/api/quota';

let currentStep = 1;
let userEmail = '';
let userIdToken = '';
let selectedServer = null; // null = auto
let serversData = [];

// Toggle sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('overlay').classList.toggle('active');
}

// Load quota
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

// Render server list di sidebar
function renderServerList(servers) {
  const serverList = document.getElementById('serverList');
  
  // Tambah opsi Auto
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

// Select server
function selectServer(serverId) {
  selectedServer = serverId;
  
  if (serverId === null) {
    document.getElementById('serverIndicator').textContent = 'Server: Auto (Terbaik)';
    // Reset tema ke default ungu
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

// Apply tema
function applyTheme(theme) {
  document.getElementById('logo').style.background = theme.gradient;
  document.getElementById('title').style.color = theme.primary;
  
  // Update CSS variables
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  
  // Update semua tombol
  document.querySelectorAll('.btn').forEach(btn => {
    btn.style.background = theme.gradient;
  });
}

// Send magic link
async function sendMagicLink() {
  const email = document.getElementById('email').value.trim();
  
  if (!email) {
    showStatus('❌ Masukkan email dulu!', 'error');
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
      showResult(data);
      
      if (data.serverInfo) {
        document.getElementById('serverIndicator').textContent =
          `Server: ${data.serverInfo.name} (Sisa: ${data.serverInfo.remainingApi})`;
      }
      
      currentStep = 2;
      document.getElementById('step1').classList.add('completed');
      document.getElementById('step2').classList.add('active');
      document.getElementById('formStep1').style.display = 'none';
      document.getElementById('formStep2').style.display = 'block';
    } else {
      showStatus('❌ ' + (data.message || 'Gagal!'), 'error');
    }
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
  
  loadQuota();
}

// Verify account
async function verifyAccount() {
  const token = document.getElementById('token').value.trim();
  
  if (!token) {
    showStatus('❌ Masukkan magic link!', 'error');
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
      showResult(data);
      
      currentStep = 3;
      document.getElementById('step2').classList.add('completed');
      document.getElementById('step3').classList.add('active');
      document.getElementById('formStep2').style.display = 'none';
      document.getElementById('formStep3').style.display = 'block';
    } else {
      showStatus('❌ ' + (data.message || 'Verifikasi gagal!'), 'error');
    }
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
  
  loadQuota();
}

// Apply premium
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
      showResult(data);
      
      if (data.serverInfo) {
        document.getElementById('serverIndicator').textContent =
          `Server: ${data.serverInfo.name} (Sisa: ${data.serverInfo.remainingApi})`;
      }
    } else {
      showStatus('❌ ' + (data.message || 'Aktivasi gagal!'), 'error');
    }
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
  }
  
  loadQuota();
}

// Show status
function showStatus(message, type) {
  const statusBox = document.getElementById('statusBox');
  statusBox.className = 'status-box ' + type;
  statusBox.innerHTML = message;
}

// Show result
function showResult(data) {
  const resultBox = document.getElementById('resultBox');
  resultBox.style.display = 'block';
  resultBox.textContent = JSON.stringify(data, null, 2);
}

// Init
loadQuota();
setInterval(loadQuota, 5000); // Refresh tiap 30 detik
