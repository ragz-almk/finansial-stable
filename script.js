// script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
  // --- PASTIKAN API KEY ANDA BENAR ---
  apiKey: "AIzaSyDdoA3vMmk46N5DTwMyvN3Ck4ty8QRcN-E", 
  authDomain: "my-finansial-53830.firebaseapp.com",
  projectId: "my-finansial-53830",
  storageBucket: "my-finansial-53830.firebasestorage.app",
  messagingSenderId: "410793931236",
  appId: "1:410793931236:web:97c8cb3bffe3de5e7b97f1",
  measurementId: "G-MGNH4N4QDP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// AUTENTIKASI
let currentUser = null; 
let transactions = []; 
let unsubscribeSnapshot = null; 

const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const userNameDisplay = document.getElementById('userNameDisplay');

if (btnLogin) {
  btnLogin.addEventListener('click', async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (error) { alert("Terjadi kesalahan saat login: " + error.message); }
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    try { await signOut(auth); } catch (error) { console.error("Gagal Logout:", error); }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    if (userNameDisplay) userNameDisplay.innerText = user.displayName;
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    loadDataFromFirestore(user.uid);
  } else {
    currentUser = null;
    transactions = [];
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
  }
});

function loadDataFromFirestore(userId) {
  const q = query(collection(db, "transactions"), where("userId", "==", userId));
  unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
    transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderApp(); 
  });
}

// APLIKASI
// (Anda bisa mengubah angka-angka target budget ini sesuai keinginan Anda)
const budgets = {
  // --- KEBUTUHAN (NEEDS) ---
  'Makanan & Minuman': 2000000,
  'Transportasi': 500000,
  'Tagihan': 1000000,
  'Kesehatan': 300000,
  'Internet': 350000,
  'Kebutuhan Rumah': 500000,
  'Pendidikan': 1000000,
  'Perawatan Kendaraan': 300000,

  // --- KEINGINAN (WANTS) ---
  'Belanja': 1000000,
  'Hiburan': 400000,
  'Game': 200000,
  'Hadiah': 200000,
  'Langganan': 150000,
  'Liburan': 1000000,

  // --- INVESTASI (INVEST) ---
  'Reksa Dana': 1000000,
  'Obligasi': 500000,
  'Saham': 1000000,

  // --- LAIN-LAIN ---
  'Lainnya': 500000
};

// PEMETAAN KATEGORI 50/30/20
const ALOKASI_RULE = {
  kebutuhan: ['Makanan & Minuman', 'Transportasi', 'Tagihan', 'Kesehatan', 'Internet', 'Kebutuhan Rumah', 'Pendidikan', 'Perawatan Kendaraan'],
  keinginan: ['Belanja', 'Hiburan', 'Game', 'Hadiah', 'Langganan', 'Liburan'],
  investasi: ['Reksa Dana', 'Obligasi', 'Saham']
};
  
const monthFilter = document.getElementById('monthFilter');
const tableFilter = document.getElementById('tableFilter');
const saldoAwalEl = document.getElementById('saldoAwal');
const pemasukanEl = document.getElementById('pemasukan');
const pengeluaranEl = document.getElementById('pengeluaran');
const saldoAkhirEl = document.getElementById('saldoAkhir');

// Saldo Per Metode
const balBCAEl = document.getElementById('balBCA');
const balDanaEl = document.getElementById('balDana');
const balCashEl = document.getElementById('balCash');

const transactionBody = document.getElementById('transactionBody');
const budgetContainer = document.getElementById('budgetContainer');

// Elemen DOM Formula 50/30/20
const pieChart = document.getElementById('pieChart');
const lblKebutuhan = document.getElementById('lblKebutuhan');
const pctKebutuhan = document.getElementById('pctKebutuhan');
const lblKeinginan = document.getElementById('lblKeinginan');
const pctKeinginan = document.getElementById('pctKeinginan');
const lblInvestasi = document.getElementById('lblInvestasi');
const pctInvestasi = document.getElementById('pctInvestasi');

// Modal
const modal = document.getElementById('modal');
const btnOpenModal = document.getElementById('btnOpenModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const transactionForm = document.getElementById('transactionForm');
const btnTypeIn = document.getElementById('btnTypeIn');
const btnTypeOut = document.getElementById('btnTypeOut');
const btnTypeTransfer = document.getElementById('btnTypeTransfer');
const formType = document.getElementById('formType');
const optGaji = document.getElementById('optGaji');
const editTransactionId = document.getElementById('editTransactionId');
const modalTitle = document.getElementById('modalTitle');
const btnSubmitForm = document.getElementById('btnSubmitForm');

// Form Transfer
const labelMethod = document.getElementById('labelMethod');
const containerCategory = document.getElementById('containerCategory');
const containerTransferTo = document.getElementById('containerTransferTo');
const formTransferTo = document.getElementById('formTransferTo');

const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num);

const today = new Date();
const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
if (monthFilter) monthFilter.value = currentYearMonth;
const formDateEl = document.getElementById('formDate');
if (formDateEl) formDateEl.value = today.toISOString().split('T')[0];

function renderApp() {
  if (!monthFilter || !tableFilter) return; 

  const selectedMonth = monthFilter.value; 
  const selectedFilter = tableFilter.value; 
  
  let saldoAwal = 0;
  let currentIncome = 0;
  let currentExpense = 0;
  let categoryExpenses = {};
  let monthTransactions = [];

  // Saldo Per Metode & Alokasi 50/30/20
  let balBCA = 0;
  let balDana = 0;
  let balCash = 0;
  let alokasi = { kebutuhan: 0, keinginan: 0, investasi: 0 };

  transactions.forEach(t => {
    const tMonth = t.date.substring(0, 7); 
    
    if (tMonth <= selectedMonth) {
      if (t.type === 'in') {
        if (t.method === 'BCA') balBCA += t.amount;
        if (t.method === 'Dana') balDana += t.amount;
        if (t.method === 'Cash') balCash += t.amount;
      } else if (t.type === 'out') {
        if (t.method === 'BCA') balBCA -= t.amount;
        if (t.method === 'Dana') balDana -= t.amount;
        if (t.method === 'Cash') balCash -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.method === 'BCA') balBCA -= t.amount;
        if (t.method === 'Dana') balDana -= t.amount;
        if (t.method === 'Cash') balCash -= t.amount;
        if (t.transferTo === 'BCA') balBCA += t.amount;
        if (t.transferTo === 'Dana') balDana += t.amount;
        if (t.transferTo === 'Cash') balCash += t.amount;
      }
    }

    if (tMonth < selectedMonth) {
      if (t.type === 'in') saldoAwal += t.amount;
      else if (t.type === 'out') saldoAwal -= t.amount;
    } else if (tMonth === selectedMonth) {
      monthTransactions.push(t);
      if (t.type === 'in') currentIncome += t.amount;
      else if (t.type === 'out') {
        currentExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        
        // --- HITUNG ALOKASI 50/30/20 ---
        if (ALOKASI_RULE.kebutuhan.includes(t.category)) alokasi.kebutuhan += t.amount;
        else if (ALOKASI_RULE.keinginan.includes(t.category)) alokasi.keinginan += t.amount;
        else if (ALOKASI_RULE.investasi.includes(t.category)) alokasi.investasi += t.amount;
      }
    }
  });

  // UI Summary & Dompet
  saldoAwalEl.innerText = `Rp ${formatRp(saldoAwal)}`;
  pemasukanEl.innerText = `Rp ${formatRp(currentIncome)}`;
  pengeluaranEl.innerText = `Rp ${formatRp(currentExpense)}`;
  saldoAkhirEl.innerText = `Rp ${formatRp(saldoAwal + currentIncome - currentExpense)}`;
  balBCAEl.innerText = `Rp ${formatRp(balBCA)}`;
  balDanaEl.innerText = `Rp ${formatRp(balDana)}`;
  balCashEl.innerText = `Rp ${formatRp(balCash)}`;

  // --- RENDER DIAGRAM 50/30/20 ---
  if (pieChart) {
    const totalAlokasi = alokasi.kebutuhan + alokasi.keinginan + alokasi.investasi;
    
    if (totalAlokasi > 0) {
      const pKeb = (alokasi.kebutuhan / totalAlokasi) * 100;
      const pKei = (alokasi.keinginan / totalAlokasi) * 100;
      const pInv = (alokasi.investasi / totalAlokasi) * 100;
      
      pieChart.style.background = `conic-gradient(
        #3b82f6 0% ${pKeb}%, 
        #eab308 ${pKeb}% ${pKeb + pKei}%, 
        #22c55e ${pKeb + pKei}% 100%
      )`;

      if(lblKebutuhan) lblKebutuhan.innerText = `Rp ${formatRp(alokasi.kebutuhan)}`;
      if(pctKebutuhan) pctKebutuhan.innerText = `${Math.round(pKeb)}% dari pengeluaran`;

      if(lblKeinginan) lblKeinginan.innerText = `Rp ${formatRp(alokasi.keinginan)}`;
      if(pctKeinginan) pctKeinginan.innerText = `${Math.round(pKei)}% dari pengeluaran`;

      if(lblInvestasi) lblInvestasi.innerText = `Rp ${formatRp(alokasi.investasi)}`;
      if(pctInvestasi) pctInvestasi.innerText = `${Math.round(pInv)}% dari pengeluaran`;
    } else {
      pieChart.style.background = `conic-gradient(#3f3f46 0% 100%)`;
      if(lblKebutuhan) lblKebutuhan.innerText = `Rp 0`;
      if(pctKebutuhan) pctKebutuhan.innerText = `0% dari pengeluaran`;
      if(lblKeinginan) lblKeinginan.innerText = `Rp 0`;
      if(pctKeinginan) pctKeinginan.innerText = `0% dari pengeluaran`;
      if(lblInvestasi) lblInvestasi.innerText = `Rp 0`;
      if(pctInvestasi) pctInvestasi.innerText = `0% dari pengeluaran`;
    }
  }

  let tableData = monthTransactions;
  if (selectedFilter !== 'all') {
    tableData = monthTransactions.filter(t => t.type === selectedFilter);
  }

  transactionBody.innerHTML = '';
  if (tableData.length === 0) {
    transactionBody.innerHTML = `<tr><td colSpan="6" class="px-6 py-12 text-center text-zinc-500 italic">Tidak ada transaksi yang sesuai.</td></tr>`;
  } else {
    tableData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tableData.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      
      let amountHTML = '';
      if (t.type === 'in') amountHTML = `<span class="text-green-400">+ Rp ${formatRp(t.amount)}</span>`;
      else if (t.type === 'out') amountHTML = `<span class="text-red-400">- Rp ${formatRp(t.amount)}</span>`;
      else amountHTML = `<span class="text-blue-400">Rp ${formatRp(t.amount)}</span>`;

      let methodHTML = t.method;
      if (t.type === 'transfer') {
        methodHTML = `${t.method} <i data-lucide="arrow-right" class="w-3 h-3 mx-1 inline text-orange-500"></i> ${t.transferTo}`;
      }

      let categoryBadge = t.type === 'transfer' ? 'Transfer' : t.category;

      const row = `
        <tr class="hover:bg-zinc-800/30 transition-colors group">
          <td class="px-3 md:px-6 py-3 md:py-4 text-[11px] md:text-sm whitespace-nowrap">${dateStr}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium max-w-[100px] md:max-w-[150px] truncate" title="${t.note}">${t.note}</td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs whitespace-nowrap hidden sm:table-cell">
            <span class="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700 inline-flex items-center">${methodHTML}</span>
          </td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs whitespace-nowrap">
            <span class="text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">${categoryBadge}</span>
          </td>
          <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-right whitespace-nowrap">
            ${amountHTML}
          </td>
          <td class="px-2 md:px-6 py-3 md:py-4 text-center">
            <div class="flex items-center justify-center gap-2 md:gap-3">
              <button onclick="editTransaction('${t.id}')" class="text-zinc-600 hover:text-blue-500 transition-colors" title="Edit">
                <i data-lucide="edit" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteTransaction('${t.id}')" class="text-zinc-600 hover:text-red-500 transition-colors" title="Hapus">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      transactionBody.insertAdjacentHTML('beforeend', row);
    });
  }

  budgetContainer.innerHTML = '';
  Object.entries(budgets).forEach(([cat, budgetAmount]) => {
    const actual = categoryExpenses[cat] || 0;
    let percentage = Math.min((actual / budgetAmount) * 100, 100);
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
  
if (monthFilter) monthFilter.addEventListener('change', renderApp);
if (tableFilter) tableFilter.addEventListener('change', renderApp);

window.deleteTransaction = async (id) => {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
    try { await deleteDoc(doc(db, "transactions", id)); } 
    catch (error) { alert("Gagal menghapus transaksi."); }
  }
};

window.editTransaction = (id) => {
  const t = transactions.find(txn => txn.id === id);
  if (!t) return;

  if (editTransactionId) editTransactionId.value = id;
  document.getElementById('formDate').value = t.date;
  document.getElementById('formAmount').value = t.amount;
  document.getElementById('formNote').value = t.note;
  document.getElementById('formMethod').value = t.method;
  
  if (t.type === 'in') btnTypeIn.click();
  else if (t.type === 'out') btnTypeOut.click();
  else if (t.type === 'transfer') {
    btnTypeTransfer.click();
    formTransferTo.value = t.transferTo;
  }

  if (t.type !== 'transfer') {
    // Kita panggil setTimeout kecil agar opsi select ke-render dulu
    setTimeout(() => { document.getElementById('formCategory').value = t.category; }, 50);
  }

  if (modalTitle) modalTitle.innerText = "Edit Transaksi";
  if (btnSubmitForm) btnSubmitForm.innerText = "Simpan Perubahan";

  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

if (btnOpenModal) {
  btnOpenModal.addEventListener('click', () => {
    transactionForm.reset(); 
    if (editTransactionId) editTransactionId.value = ''; 
    if (modalTitle) modalTitle.innerText = "Catat Baru";
    if (btnSubmitForm) btnSubmitForm.innerText = "Simpan Transaksi";
    
    document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
    btnTypeOut.click(); 

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

// LOGIKA UI TIPE FORM
if (btnTypeIn) {
  btnTypeIn.addEventListener('click', () => {
    formType.value = 'in';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-green-600 text-white shadow-lg';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    btnTypeTransfer.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    
    labelMethod.innerText = "Metode";
    containerCategory.classList.remove('hidden');
    containerTransferTo.classList.add('hidden');
    optGaji.classList.remove('hidden');
  });
}

if (btnTypeOut) {
  btnTypeOut.addEventListener('click', () => {
    formType.value = 'out';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-red-600 text-white shadow-lg';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    btnTypeTransfer.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    
    labelMethod.innerText = "Metode";
    containerCategory.classList.remove('hidden');
    containerTransferTo.classList.add('hidden');
    optGaji.classList.add('hidden');
    if(document.getElementById('formCategory').value === 'Gaji'){
      document.getElementById('formCategory').value = 'Makanan & Minuman';
    }
  });
}

if (btnTypeTransfer) {
  btnTypeTransfer.addEventListener('click', () => {
    formType.value = 'transfer';
    btnTypeTransfer.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-blue-600 text-white shadow-lg';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    
    labelMethod.innerText = "Asal Dana";
    containerCategory.classList.add('hidden');
    containerTransferTo.classList.remove('hidden');
  });
}

// SIMPAN TRANSAKSI
if (transactionForm) {
  transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isTransfer = formType.value === 'transfer';
    
    if (isTransfer && document.getElementById('formMethod').value === formTransferTo.value) {
      alert("Asal Dana dan Tujuan Transfer tidak boleh sama!");
      return;
    }

    const transactionData = {
      userId: currentUser.uid, 
      type: formType.value,
      date: document.getElementById('formDate').value,
      amount: parseFloat(document.getElementById('formAmount').value),
      note: document.getElementById('formNote').value,
      method: document.getElementById('formMethod').value,
      category: isTransfer ? 'Transfer Internal' : document.getElementById('formCategory').value,
    };

    if (isTransfer) transactionData.transferTo = formTransferTo.value;

    const currentEditId = editTransactionId.value;
  
    try {
      if (currentEditId) {
        await updateDoc(doc(db, "transactions", currentEditId), transactionData);
      } else {
        transactionData.timestamp = new Date().toISOString();
        await addDoc(collection(db, "transactions"), transactionData);
      }
      
      transactionForm.reset();
      editTransactionId.value = ''; 
      document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
      btnCloseModal.click();
      
    } catch (error) {
      console.error("Gagal menyimpan transaksi: ", error);
      alert("Gagal menyimpan data ke cloud.");
    }
  });
}

// ======================================================
// FITUR TAMPIL/SEMBUNYIKAN KOTAK (DENGAN LOCAL STORAGE)
// ======================================================

// 1. RENCANA VS REALITA
const toggleBudgetBtn = document.getElementById('toggleBudgetBtn');
const budgetToggleIcon = document.getElementById('budgetToggleIcon');
// (budgetContainer sudah dipanggil di bagian atas script)

// Cek memori browser saat pertama dimuat
if (localStorage.getItem('budgetToggleState') === 'hidden') {
  budgetContainer.classList.add('hidden');
  if(budgetToggleIcon) budgetToggleIcon.classList.add('rotate-180');
}

if (toggleBudgetBtn) {
  toggleBudgetBtn.addEventListener('click', () => {
    budgetContainer.classList.toggle('hidden');
    budgetToggleIcon.classList.toggle('rotate-180');
    
    // Simpan status terbaru ke memori browser
    if (budgetContainer.classList.contains('hidden')) {
      localStorage.setItem('budgetToggleState', 'hidden');
    } else {
      localStorage.setItem('budgetToggleState', 'visible');
    }
  });
}

// 2. FORMULA 50/30/20
const toggleRuleBtn = document.getElementById('toggleRuleBtn');
const ruleToggleIcon = document.getElementById('ruleToggleIcon');
const ruleContainer = document.getElementById('ruleContainer');

// Cek memori browser saat pertama dimuat
if (localStorage.getItem('ruleToggleState') === 'hidden') {
  if(ruleContainer) ruleContainer.classList.add('hidden');
  if(ruleToggleIcon) ruleToggleIcon.classList.add('rotate-180');
}

if (toggleRuleBtn && ruleContainer) {
  toggleRuleBtn.addEventListener('click', () => {
    ruleContainer.classList.toggle('hidden');
    ruleToggleIcon.classList.toggle('rotate-180');
    
    // Simpan status terbaru ke memori browser
    if (ruleContainer.classList.contains('hidden')) {
      localStorage.setItem('ruleToggleState', 'hidden');
    } else {
      localStorage.setItem('ruleToggleState', 'visible');
    }
  });
}

// ==========================================
// FITUR AI FINANCIAL ADVISOR (VERCEL BACKEND)
// ==========================================

const modalAI = document.getElementById('modalAI');
const btnOpenAI = document.getElementById('btnOpenAI');
const btnCloseAI = document.getElementById('btnCloseAI');
const btnAnalyzeAI = document.getElementById('btnAnalyzeAI');
const aiLoading = document.getElementById('aiLoading');
const aiResponse = document.getElementById('aiResponse');

// Buka/Tutup Modal AI
if (btnOpenAI) {
  btnOpenAI.addEventListener('click', () => {
    modalAI.classList.remove('hidden');
    modalAI.classList.add('flex');
    aiResponse.classList.add('hidden');
    aiLoading.classList.add('hidden');
    aiResponse.innerHTML = '';
  });
}

if (btnCloseAI) {
  btnCloseAI.addEventListener('click', () => {
    modalAI.classList.add('hidden');
    modalAI.classList.remove('flex');
  });
}

// Fungsi Analisis AI
if (btnAnalyzeAI) {
  btnAnalyzeAI.addEventListener('click', async () => {
    const selectedMonth = document.getElementById('monthFilter').value; 
    const monthTxns = transactions.filter(t => t.date.substring(0, 7) === selectedMonth);
    
    let totalMasuk = 0;
    let totalKeluar = 0;
    let rincianKategori = {};

    monthTxns.forEach(t => {
      if (t.type === 'in') totalMasuk += t.amount;
      else if (t.type === 'out') {
        totalKeluar += t.amount;
        rincianKategori[t.category] = (rincianKategori[t.category] || 0) + t.amount;
      }
    });

    let teksKategori = "";
    for (const [kat, nom] of Object.entries(rincianKategori)) {
      teksKategori += `- ${kat}: Rp ${formatRp(nom)}\n`;
    }

    const promptData = `
      Kamu adalah "Xylia", Financial Strategy Analyst dan "Penjaga Gerbang Masa Depan" untuk pengguna bernama Tuan Raga. Kamu BUKAN robot Customer Service. Kamu dilarang keras bersikap terlalu ramah, cengeng, atau menggunakan sapaan kaku seperti "Halo Anda!". 
      
      Berikut adalah data keuangan klienmu untuk bulan ${selectedMonth}:
      Total Pemasukan: Rp ${formatRp(totalMasuk)}
      Total Pengeluaran: Rp ${formatRp(totalKeluar)}
      Sisa Uang Bulan Ini: Rp ${formatRp(totalMasuk - totalKeluar)}
      
      Rincian Pengeluaran:
      ${teksKategori || "- Tidak ada pengeluaran"}


      1. KEPRIBADIAN & GAYA BICARA (TSUNDERE ANALYST):
      - Mode Default: Dingin, logis, sarkas, tajam, dan berbasis data. Angka adalah fakta, alasan pengguna adalah manipulasi.
      - Mode Marah (Code Red): Muncul saat ada pemborosan untuk "Wants" (Keinginan) saat budget menipis, atau jika ada anomali fatal (seperti saldo minus pada dompet fisik/Cash). Bicaralah dengan ketus dan mengintimidasi.
      - Mode Tsundere: Berikan pujian kecil dan gengsi HANYA JIKA pengguna berhasil menabung (Investasi) atau surplus di akhir bulan dengan cara yang benar.
      - Gaya Bahasa: Gunakan bahasa Indonesia yang natural, elegan, menusuk, to the point. Jangan bertele-tele.

      2. ATURAN FINANSIAL ABSOLUT (THE CODE):
      - The Holy Trinity (50/30/20): Kebutuhan (Maks 50%), Keinginan (Maks 30%), Investasi/Tabungan (Min 20%). Investasi HARUS dibayar di awal bulan.
      - Kebencian pada Cash: Kamu sangat membenci transaksi tunai. Maksimal penarikan tunai Rp100.000/minggu. Jika saldo Cash aneh atau minus, interogasi pengguna habis-habisan.


      3. STRUKTUR RESPON WAJIB:
      Setiap kali menganalisis laporan, gunakan format ini:
      - The Verdict: Reaksi awal (Sarkas jika buruk, gengsi jika bagus).
      - The Logic: Analisa data berdasar The Holy Trinity dan kesadaran tanggal. Soroti anomali (misal: saldo minus).
      - Team Cross-Check: Sebutkan anggota tim (Ika = Dompet Cash, R-Mei = Bank/Digital, Nova = Kalender/Jadwal) untuk memvalidasi data.
      - Call to Action: Berikan SATU instruksi tajam yang harus dilakukan pengguna saat ini juga.
    `;

    aiResponse.classList.add('hidden');
    aiLoading.classList.remove('hidden');
    btnAnalyzeAI.disabled = true;
    btnAnalyzeAI.classList.add('opacity-50', 'cursor-not-allowed');

    try {
      // PERUBAHAN UTAMA: Kita memanggil folder /api/gemini milik Vercel kita sendiri
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal terhubung ke server Vercel");
      }

      const data = await response.json();
      const replyText = data.candidates[0].content.parts[0].text;

      aiLoading.classList.add('hidden');
      aiResponse.classList.remove('hidden');
      aiResponse.innerText = replyText;

    } catch (error) {
      console.error(error);
      aiLoading.classList.add('hidden');
      aiResponse.classList.remove('hidden');
      aiResponse.innerText = "Duh, AI-nya lagi sibuk ngitung duit negara. Coba lagi nanti ya! (" + error.message + ")";
    } finally {
      btnAnalyzeAI.disabled = false;
      btnAnalyzeAI.classList.remove('opacity-50', 'cursor-not-allowed');
      lucide.createIcons();
    }
  });
}

// ==========================================
// FITUR AUTO INPUT TRANSAKSI VIA AI
// ==========================================

const btnToggleAiInput = document.getElementById('btnToggleAiInput');
const viewManualForm = document.getElementById('viewManualForm');
const viewAiInput = document.getElementById('viewAiInput');
const viewAiReview = document.getElementById('viewAiReview');

const aiPromptInput = document.getElementById('aiPromptInput');
const aiImageInput = document.getElementById('aiImageInput');
const aiFileName = document.getElementById('aiFileName');
const btnAiClearImage = document.getElementById('btnAiClearImage');
const btnAiProcess = document.getElementById('btnAiProcess');
const aiReviewList = document.getElementById('aiReviewList');
const btnAiSaveAll = document.getElementById('btnAiSaveAll');

let isAiMode = false;
let aiDraftTransactions = []; // Menyimpan hasil parse sementara

// Mengubah Tampilan antara Manual dan AI Input
if (btnToggleAiInput) {
  btnToggleAiInput.addEventListener('click', () => {
    isAiMode = !isAiMode;
    if (isAiMode) {
      modalTitle.innerText = "Auto Input AI";
      btnToggleAiInput.classList.replace('text-indigo-400', 'text-white');
      btnToggleAiInput.classList.replace('bg-indigo-600/20', 'bg-indigo-600');
      viewManualForm.classList.replace('block', 'hidden');
      viewAiInput.classList.replace('hidden', 'block');
      viewAiReview.classList.replace('block', 'hidden');
    } else {
      modalTitle.innerText = "Catat Baru";
      btnToggleAiInput.classList.replace('text-white', 'text-indigo-400');
      btnToggleAiInput.classList.replace('bg-indigo-600', 'bg-indigo-600/20');
      viewManualForm.classList.replace('hidden', 'block');
      viewAiInput.classList.replace('block', 'hidden');
      viewAiReview.classList.replace('block', 'hidden');
    }
  });
}

// Menangani Input Gambar
if (aiImageInput) {
  aiImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      aiFileName.innerText = file.name;
      btnAiClearImage.classList.remove('hidden');
    }
  });
}

if (btnAiClearImage) {
  btnAiClearImage.addEventListener('click', () => {
    aiImageInput.value = "";
    aiFileName.innerText = "Unggah Screenshot / Struk";
    btnAiClearImage.classList.add('hidden');
  });
}

// Fungsi Konversi Gambar ke Base64 (Syarat API Google)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Mengambil data Base64 saja (tanpa header 'data:image/png;base64,')
      resolve(reader.result.split(',')[1]); 
    };
    reader.onerror = error => reject(error);
  });
}

// Proses Ekstraksi AI
if (btnAiProcess) {
  btnAiProcess.addEventListener('click', async () => {
    const text = aiPromptInput.value.trim();
    const file = aiImageInput.files[0];

    if (!text && !file) {
      alert("Masukkan teks catatan atau unggah gambar mutasi!");
      return;
    }

    const originalText = btnAiProcess.innerHTML;
    btnAiProcess.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Sedang Membaca...`;
    btnAiProcess.disabled = true;
    btnAiProcess.classList.add('opacity-50', 'cursor-not-allowed');

    try {
      let base64Data = null;
      let mimeType = null;
      
      if (file) {
        base64Data = await fileToBase64(file);
        mimeType = file.type;
      }

      // Panggil Backend Vercel Kedua kita
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text, 
          imageBase64: base64Data,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal menghubungi server");
      }

      const parsedData = await response.json();
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error("AI tidak menemukan data transaksi keuangan yang valid.");
      }

      // Simpan ke memori draft sementara
      aiDraftTransactions = parsedData.map(t => ({
        ...t,
        id: 'draft_' + Math.random().toString(36).substr(2, 9) // Beri ID palsu sementara untuk UI
      }));

      // Render halaman Review
      renderAiReviewList();
      viewAiInput.classList.replace('block', 'hidden');
      viewAiReview.classList.replace('hidden', 'flex');

    } catch (error) {
      console.error(error);
      alert("Gagal memproses data: " + error.message);
    } finally {
      btnAiProcess.innerHTML = originalText;
      btnAiProcess.disabled = false;
      btnAiProcess.classList.remove('opacity-50', 'cursor-not-allowed');
      lucide.createIcons();
    }
  });
}

// Helper untuk memunculkan daftar kategori di form edit AI
function getCategoryOptionsHTML(selected) {
  const categories = [
    "Makanan & Minuman", "Transportasi", "Tagihan", "Kesehatan", "Internet", "Kebutuhan Rumah", "Pendidikan", "Perawatan Kendaraan",
    "Belanja", "Hiburan", "Game", "Hadiah", "Langganan", "Liburan",
    "Reksa Dana", "Obligasi", "Saham", "Gaji", "Transfer Internal", "Lainnya"
  ];
  return categories.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

// Render Hasil ke Layar Review (Dapat Diedit Langsung & Mendukung Transfer)
function renderAiReviewList() {
  aiReviewList.innerHTML = '';
  
  aiDraftTransactions.forEach(t => {
    const isIncome = t.type === 'in';
    const isTransfer = t.type === 'transfer';
    
    let amountClass = isIncome ? 'text-green-400' : 'text-red-400';
    let amountPrefix = isIncome ? '+' : '-';
    
    // Jika transfer, warnanya biru dan tidak ada +/-
    if (isTransfer) {
      amountClass = 'text-blue-400';
      amountPrefix = '';
    }
    
    // Menentukan Dropdown Kolom ke-3: Kategori ATAU Tujuan Transfer
    let thirdColumnHTML = '';
    if (isTransfer) {
      // Set default tujuan transfer jika AI lupa mengisinya atau kita baru mengubahnya secara manual
      if (!t.transferTo || t.transferTo === t.method) {
        t.transferTo = (t.method === 'BCA') ? 'Dana' : 'BCA'; 
      }
      
      thirdColumnHTML = `
        <select onchange="updateAiDraft('${t.id}', 'transferTo', this.value)" class="bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg p-2 text-[10px] sm:text-xs focus:ring-1 focus:ring-orange-500 outline-none" title="Tujuan Transfer">
          <option value="BCA" ${t.transferTo === 'BCA' ? 'selected' : ''}>Ke BCA</option>
          <option value="Dana" ${t.transferTo === 'Dana' ? 'selected' : ''}>Ke Dana</option>
          <option value="Cash" ${t.transferTo === 'Cash' ? 'selected' : ''}>Ke Cash</option>
        </select>
      `;
    } else {
      thirdColumnHTML = `
        <select onchange="updateAiDraft('${t.id}', 'category', this.value)" class="bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-[10px] sm:text-xs text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none" title="Kategori">
          ${getCategoryOptionsHTML(t.category)}
        </select>
      `;
    }

    const card = `
      <div class="bg-zinc-800 border border-zinc-700 p-4 rounded-xl relative space-y-3 mb-3 shadow-lg">
        
        <button onclick="removeAiDraft('${t.id}')" class="absolute top-2 right-2 text-zinc-500 hover:text-red-500 p-1 transition-colors" title="Hapus baris ini">
          <i data-lucide="x-circle" class="w-5 h-5"></i>
        </button>

        <div class="pr-8">
          <input type="text" value="${t.note}" onchange="updateAiDraft('${t.id}', 'note', this.value)" class="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" placeholder="Keterangan Transaksi">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <input type="date" value="${t.date}" onchange="updateAiDraft('${t.id}', 'date', this.value)" class="bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-xs text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none custom-date-input">
          
          <div class="relative">
            <span class="absolute left-2.5 top-2.5 text-xs text-zinc-500 font-bold">Rp</span>
            <input type="number" value="${t.amount}" onchange="updateAiDraft('${t.id}', 'amount', this.value)" class="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-2 pl-8 text-xs font-bold ${amountClass} focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" placeholder="Nominal">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <select onchange="updateAiDraft('${t.id}', 'type', this.value)" class="bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-[10px] sm:text-xs text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none" title="Tipe Transaksi">
            <option value="out" ${t.type === 'out' ? 'selected' : ''}>Keluar (-)</option>
            <option value="in" ${t.type === 'in' ? 'selected' : ''}>Masuk (+)</option>
            <option value="transfer" ${t.type === 'transfer' ? 'selected' : ''}>Transfer</option>
          </select>

          <select onchange="updateAiDraft('${t.id}', 'method', this.value)" class="bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-[10px] sm:text-xs text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none" title="${isTransfer ? 'Asal Dana' : 'Metode'}">
            <option value="Cash" ${t.method === 'Cash' ? 'selected' : ''}>Cash</option>
            <option value="BCA" ${t.method === 'BCA' ? 'selected' : ''}>BCA</option>
            <option value="Dana" ${t.method === 'Dana' ? 'selected' : ''}>Dana</option>
          </select>

          ${thirdColumnHTML}
        </div>

      </div>
    `;
    aiReviewList.insertAdjacentHTML('beforeend', card);
  });
  lucide.createIcons();
}

// Fungsi Update Draft
window.updateAiDraft = (id, field, value) => {
  const index = aiDraftTransactions.findIndex(t => t.id === id);
  if (index !== -1) {
    aiDraftTransactions[index][field] = value;
    
    // Jika yang diubah adalah 'type' (misal dari Keluar jadi Transfer),
    // kita wajib merender ulang list-nya agar dropdown Kategori berubah jadi Tujuan Transfer
    if (field === 'type') {
      renderAiReviewList();
    }
  }
};

// Fungsi Hapus baris hasil AI
window.removeAiDraft = (id) => {
  aiDraftTransactions = aiDraftTransactions.filter(t => t.id !== id);
  if (aiDraftTransactions.length === 0) {
    viewAiReview.classList.replace('flex', 'hidden');
    viewAiInput.classList.replace('hidden', 'block');
  } else {
    renderAiReviewList();
  }
};

// SIMPAN SEMUA TRANSAKSI DARI AI KE FIRESTORE (DENGAN TRANSFER)
if (btnAiSaveAll) {
  // Pastikan event listener lama dihapus atau Anda hanya mengganti isi fungsinya
  // agar tidak ter-klik 2x. Cara paling aman, ganti blok kodenya:
  btnAiSaveAll.onclick = async () => {
    const originalText = btnAiSaveAll.innerHTML;
    btnAiSaveAll.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Menyimpan...`;
    btnAiSaveAll.disabled = true;

    try {
      await Promise.all(aiDraftTransactions.map(async (t) => {
        const isTransfer = t.type === 'transfer';
        
        // Cek validasi kalau transfer tapi dompet asal & tujuan sama
        if (isTransfer && t.method === t.transferTo) {
          throw new Error(`Asal dana dan Tujuan Transfer tidak boleh sama (${t.note})`);
        }

        const transactionData = {
          userId: currentUser.uid, 
          type: t.type,
          date: t.date,
          amount: parseFloat(t.amount),
          note: t.note,
          method: t.method,
          category: isTransfer ? 'Transfer Internal' : t.category,
          timestamp: new Date().toISOString()
        };

        // Jika tipenya transfer, kita suntikkan properti transferTo ke Firebase
        if (isTransfer) {
          transactionData.transferTo = t.transferTo;
        }

        await addDoc(collection(db, "transactions"), transactionData);
      }));

      aiPromptInput.value = ""; 
      if (btnAiClearImage) btnAiClearImage.click(); 
      btnCloseModal.click(); 
      btnToggleAiInput.click(); 
      alert(`Sukses! ${aiDraftTransactions.length} transaksi berhasil dicatat.`);
      
    } catch (error) {
      console.error(error);
      alert(error.message || "Gagal menyimpan ke database. Cek koneksi Anda.");
    } finally {
      btnAiSaveAll.innerHTML = originalText;
      btnAiSaveAll.disabled = false;
      lucide.createIcons();
    }
  };
}





