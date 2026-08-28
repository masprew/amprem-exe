// Ganti dengan URL Vercel kamu nanti
const API_URL = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
// Contoh: https://project-kamu.vercel.app/api/amprem

let currentStep = 1;
let userEmail = '';
let userIdToken = '';

// Fungsi untuk pindah step
function showStep(step) {
  document.getElementById('formStep1').style.display = 'none';
  document.getElementById('formStep2').style.display = 'none';
  document.getElementById('formStep3').style.display = 'none';
  
  document.getElementById('step1').className = 'step';
  document.getElementById('step2').className = 'step';
  document.getElementById('step3').className = 'step';
  
  if (step === 1) {
    document.getElementById('formStep1').style.display = 'block';
    document.getElementById('step1').classList.add('active');
  } else if (step === 2) {
    document.getElementById('formStep2').style.display = 'block';
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
  } else if (step === 3) {
    document.getElementById('formStep3').style.display = 'block';
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('completed');
    document.getElementById('step3').classList.add('active');
  }
}

// Fungsi tampilkan status
function showStatus(message, type = 'info') {
  const statusBox = document.getElementById('statusBox');
  statusBox.className = 'status-box ' + type;
  statusBox.innerHTML = message;
}

// Fungsi tampilkan hasil
function showResult(data) {
  const resultBox = document.getElementById('resultBox');
  resultBox.style.display = 'block';
  resultBox.textContent = JSON.stringify(data, null, 2);
}

// Step 1: Kirim Magic Link
async function sendMagicLink() {
  const email = document.getElementById('email').value.trim();
  
  if (!email) {
    showStatus('❌ Masukkan email dulu!', 'error');
    return;
  }
  
  // Validasi email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showStatus('❌ Format email tidak valid!', 'error');
    return;
  }
  
  userEmail = email;
  
  try {
    showStatus('⏳ Mengirim magic link...', 'info');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-magiclink',
        email: userEmail
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      showStatus('✅ Magic link berhasil dibuat!', 'success');
      showResult(data);
      
      // Simpan token untuk testing
      if (data.debugToken) {
        document.getElementById('token').value = data.debugToken;
      }
      
      // Pindah ke step 2
      currentStep = 2;
      setTimeout(() => showStep(2), 1000);
    } else {
      showStatus('❌ ' + (data.message || 'Gagal mengirim magic link'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('❌ Network error: ' + error.message, 'error');
  }
}

// Step 2: Verifikasi Akun
async function verifyAccount() {
  const token = document.getElementById('token').value.trim();
  
  if (!token) {
    showStatus('❌ Masukkan token verifikasi!', 'error');
    return;
  }
  
  try {
    showStatus('⏳ Memverifikasi akun...', 'info');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify-account',
        email: userEmail,
        rawLink: token
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success && data.idToken) {
      userIdToken = data.idToken;
      showStatus('✅ Verifikasi berhasil!', 'success');
      showResult(data);
      
      // Pindah ke step 3
      currentStep = 3;
      setTimeout(() => showStep(3), 1000);
    } else {
      showStatus('❌ ' + (data.message || 'Verifikasi gagal'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('❌ Network error: ' + error.message, 'error');
  }
}

// Step 3: Aktifkan Premium
async function applyPremium() {
  try {
    showStatus('⏳ Mengaktifkan premium...', 'info');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'apply-premium',
        email: userEmail,
        idToken: userIdToken
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      showStatus('🎉 Premium berhasil diaktifkan!', 'success');
      showResult(data);
    } else {
      showStatus('❌ ' + (data.message || 'Aktivasi gagal'), 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('❌ Network error: ' + error.message, 'error');
  }
}

// Inisialisasi
showStep(1);