// script.js

// ==========================================
// 1. IMPORT FIREBASE (Menggunakan jalur CDN untuk Vanilla JS)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// (Analytics tidak wajib untuk saat ini, jadi kita lewati agar kode lebih bersih)

// ==========================================
// 2. KONFIGURASI FIREBASE ANDA
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDdoA3vMmk46N5DTwMyvN3Ck4ty8QRcN-E",
  authDomain: "my-finansial-53830.firebaseapp.com",
  projectId: "my-finansial-53830",
  storageBucket: "my-finansial-53830.firebasestorage.app",
  messagingSenderId: "410793931236",
  appId: "1:410793931236:web:97c8cb3bffe3de5e7b97f1",
  measurementId: "G-MGNH4N4QDP"
};

// Inisialisasi Aplikasi Firebase dan Autentikasi
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 3. LOGIKA AUTENTIKASI (LOGIN & LOGOUT)
// ==========================================
let currentUser = null; // Menyimpan data user yang sedang login

// Ambil elemen DOM untuk Login (Pastikan Anda sudah mengubah index.html sesuai panduan sebelumnya)
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const userNameDisplay = document.getElementById('userNameDisplay');

// Fungsi saat tombol "Login dengan Google" diklik
if (btnLogin) {
  btnLogin.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Gagal Login:", error);
      alert("Terjadi kesalahan saat login: " + error.message);
    }
  });
}

// Fungsi saat tombol "Logout" diklik
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal Logout:", error);
    }
  });
}

// Observer: Memantau apakah user sedang login atau tidak
onAuthStateChanged(auth, (user) => {
  if (user) {
    // --- JIKA USER BERHASIL LOGIN ---
    currentUser = user;
    
    // Tampilkan nama user di header
    if (userNameDisplay) userNameDisplay.innerText = user.displayName;
    
    // Pindah ke layar aplikasi
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    
    // Jalankan aplikasi keuangan
    renderApp(); 
    lucide.createIcons();
  } else {
    // --- JIKA USER BELUM LOGIN / LOGOUT ---
    currentUser = null;
    
    // Kembali ke layar login
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  }
});


// ==========================================
// 4. KODE APLIKASI FINANSIAL STABLE (KODE LAMA ANDA)
// ==========================================

// --- STATE MANAGER ---
let transactions = [
  { id: 1, date: '2026-03-01', note: 'Gaji Bulanan', method: 'BCA', category: 'Gaji', type: 'in', amount: 10000000 },
  { id: 2, date: '2026-03-02', note: 'Sewa Apartemen', method: 'BCA', category: 'Tagihan', type: 'out', amount: 3000000 },
  { id: 3, date: '2026-03-03', note: 'Makan Siang', method: 'Cash', category: 'Makanan & Minuman', type: 'out', amount: 50000 },
  { id: 4, date: '2026-03-04', note: 'Top up Dana', method: 'Dana', category: 'Lainnya', type: 'in', amount: 500000 },
];
  
const budgets = {
  'Makanan & Minuman': 2000000,
  'Transportasi': 1000000,
  'Belanja': 1500000,
  'Tagihan': 3500000,
  'Hiburan': 500000,
};
  
// Ambil elemen DOM Aplikasi
const monthFilter = document.getElementById('monthFilter');
const tableFilter = document.getElementById('tableFilter');
const saldoAwalEl = document.getElementById('saldoAwal');
const pemasukanEl = document.getElementById('pemasukan');
const pengeluaranEl = document.getElementById('pengeluaran');
const saldoAkhirEl = document.getElementById('saldoAkhir');
const transactionBody = document.getElementById('transactionBody');
const budgetContainer = document.getElementById('budgetContainer');

// Helper Format Uang
const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num);

// --- INISIALISASI BULAN ---
const today = new Date();
const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
if (monthFilter) monthFilter.value = currentYearMonth;
const formDateEl = document.getElementById('formDate');
if (formDateEl) formDateEl.value = today.toISOString().split('T')[0];

// --- FUNGSI RENDER UTAMA ---
function renderApp() {
  if (!monthFilter || !tableFilter) return; // Mencegah error jika dipanggil sebelum login

  const selectedMonth = monthFilter.value; 
  const selectedFilter = tableFilter.value; 
  
  let saldoAwal = 0;
  let currentIncome = 0;
  let currentExpense = 0;
  let categoryExpenses = {};

  let monthTransactions = [];

  // 1. Kalkulasi Logika Keuangan & Kumpulkan Data Bulan Ini
  transactions.forEach(t => {
    const tMonth = t.date.substring(0, 7); 

    if (tMonth < selectedMonth) {
      if (t.type === 'in') saldoAwal += t.amount;
      else saldoAwal -= t.amount;
    } else if (tMonth === selectedMonth) {
      monthTransactions.push(t);
      
      if (t.type === 'in') {
        currentIncome += t.amount;
      } else {
        currentExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }
    }
  });

  let saldoAkhir = saldoAwal + currentIncome - currentExpense;

  // Update DOM Text Kartu Summary
  saldoAwalEl.innerText = `Rp ${formatRp(saldoAwal)}`;
  pemasukanEl.innerText = `Rp ${formatRp(currentIncome)}`;
  pengeluaranEl.innerText = `Rp ${formatRp(currentExpense)}`;
  saldoAkhirEl.innerText = `Rp ${formatRp(saldoAkhir)}`;

  // 2. Logika Filter Tabel
  let tableData = monthTransactions;
  if (selectedFilter !== 'all') {
    tableData = monthTransactions.filter(t => t.type === selectedFilter);
  }

  // 3. Render Tabel
  transactionBody.innerHTML = '';
  if (tableData.length === 0) {
    transactionBody.innerHTML = `<tr><td colSpan="6" class="px-6 py-12 text-center text-zinc-500 italic">Tidak ada transaksi yang sesuai.</td></tr>`;
  } else {
    tableData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tableData.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const row = `
        <tr class="hover:bg-zinc-800/30 transition-colors group">
          <td class="px-6 py-4 text-sm whitespace-nowrap">${dateStr}</td>
          <td class="px-6 py-4 text-sm font-medium max-w-[150px] truncate">${t.note}</td>
          <td class="px-6 py-4 text-xs whitespace-nowrap">
            <span class="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700">${t.method}</span>
          </td>
          <td class="px-6 py-4 text-xs whitespace-nowrap">
            <span class="text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">${t.category}</span>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === 'in' ? 'text-green-400' : 'text-red-400'}">
            ${t.type === 'in' ? '+' : '-'} Rp ${formatRp(t.amount)}
          </td>
          <td class="px-6 py-4 text-center">
            <button onclick="deleteTransaction(${t.id})" class="text-zinc-600 hover:text-red-500 transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
      transactionBody.insertAdjacentHTML('beforeend', row);
    });
  }

  // Render Budget
  budgetContainer.innerHTML = '';
  Object.entries(budgets).forEach(([cat, budgetAmount]) => {
    const actual = categoryExpenses[cat] || 0;
    let percentage = (actual / budgetAmount) * 100;
    if (percentage > 100) percentage = 100;
    const isOver = actual > budgetAmount;

    const budgetHtml = `
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-zinc-300">${cat}</span>
          <span class="${isOver ? 'text-red-400' : 'text-zinc-400'}">${Math.round(percentage)}%</span>
        </div>
        <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div class="h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-orange-500'}" style="width: ${percentage}%"></div>
        </div>
        <div class="flex justify-between text-[10px] uppercase tracking-tighter text-zinc-500">
          <span>Realita: Rp ${formatRp(actual)}</span>
          <span>Target: Rp ${formatRp(budgetAmount)}</span>
        </div>
      </div>
    `;
    budgetContainer.insertAdjacentHTML('beforeend', budgetHtml);
  });

  lucide.createIcons();
}
  
// --- EVENT LISTENERS ---
if (monthFilter) monthFilter.addEventListener('change', renderApp);
if (tableFilter) tableFilter.addEventListener('change', renderApp);

// Hapus Transaksi
window.deleteTransaction = (id) => {
  transactions = transactions.filter(t => t.id !== id);
  renderApp();
};

// Logika Modal & Form
const modal = document.getElementById('modal');
const btnOpenModal = document.getElementById('btnOpenModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const transactionForm = document.getElementById('transactionForm');

const btnTypeIn = document.getElementById('btnTypeIn');
const btnTypeOut = document.getElementById('btnTypeOut');
const formType = document.getElementById('formType');
const optGaji = document.getElementById('optGaji');

if (btnOpenModal) {
  btnOpenModal.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });
}

if (btnCloseModal) {
  btnCloseModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
}

if (btnTypeIn) {
  btnTypeIn.addEventListener('click', () => {
    formType.value = 'in';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-green-600 text-white shadow-lg';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    optGaji.classList.remove('hidden');
  });
}

if (btnTypeOut) {
  btnTypeOut.addEventListener('click', () => {
    formType.value = 'out';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-red-600 text-white shadow-lg';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    optGaji.classList.add('hidden');
    if(document.getElementById('formCategory').value === 'Gaji'){
      document.getElementById('formCategory').value = 'Makanan & Minuman';
    }
  });
}

if (transactionForm) {
  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTransaction = {
      id: Date.now(),
      type: formType.value,
      date: document.getElementById('formDate').value,
      amount: parseFloat(document.getElementById('formAmount').value),
      note: document.getElementById('formNote').value,
      method: document.getElementById('formMethod').value,
      category: document.getElementById('formCategory').value
    };
  
    transactions.push(newTransaction);
    
    transactionForm.reset();
    document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
    btnCloseModal.click();
    
    renderApp();
  });
}
