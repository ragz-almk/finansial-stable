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
  // --- ISI DENGAN API KEY ANDA SEBELUMNYA ---
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
const budgets = {
  'Makanan & Minuman': 2000000, 'Transportasi': 1000000, 'Belanja': 1500000,
  'Tagihan': 3500000, 'Hiburan': 500000,
};
  
const monthFilter = document.getElementById('monthFilter');
const tableFilter = document.getElementById('tableFilter');
const saldoAwalEl = document.getElementById('saldoAwal');
const pemasukanEl = document.getElementById('pemasukan');
const pengeluaranEl = document.getElementById('pengeluaran');
const saldoAkhirEl = document.getElementById('saldoAkhir');

// Fitur Baru: Saldo Per Metode
const balBCAEl = document.getElementById('balBCA');
const balDanaEl = document.getElementById('balDana');
const balCashEl = document.getElementById('balCash');

const transactionBody = document.getElementById('transactionBody');
const budgetContainer = document.getElementById('budgetContainer');

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

// Fitur Baru: Container UI Form Transfer
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

  // Variabel untuk Saldo Per Metode
  let balBCA = 0;
  let balDana = 0;
  let balCash = 0;

  transactions.forEach(t => {
    const tMonth = t.date.substring(0, 7); 
    
    // Perhitungan Saldo Per Metode (Dihitung dari awal s/d bulan yang dipilih)
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
        // Mengurangi saldo dari metode asal
        if (t.method === 'BCA') balBCA -= t.amount;
        if (t.method === 'Dana') balDana -= t.amount;
        if (t.method === 'Cash') balCash -= t.amount;
        // Menambah saldo ke metode tujuan
        if (t.transferTo === 'BCA') balBCA += t.amount;
        if (t.transferTo === 'Dana') balDana += t.amount;
        if (t.transferTo === 'Cash') balCash += t.amount;
      }
    }

    // Perhitungan Pemasukan/Pengeluaran Kartu Summary Utama
    if (tMonth < selectedMonth) {
      if (t.type === 'in') saldoAwal += t.amount;
      else if (t.type === 'out') saldoAwal -= t.amount;
      // Transfer tidak memengaruhi saldo awal global
    } else if (tMonth === selectedMonth) {
      monthTransactions.push(t);
      if (t.type === 'in') currentIncome += t.amount;
      else if (t.type === 'out') {
        currentExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }
      // Transfer tidak menambah currentIncome & currentExpense
    }
  });

  // Update UI Kartu Summary
  saldoAwalEl.innerText = `Rp ${formatRp(saldoAwal)}`;
  pemasukanEl.innerText = `Rp ${formatRp(currentIncome)}`;
  pengeluaranEl.innerText = `Rp ${formatRp(currentExpense)}`;
  saldoAkhirEl.innerText = `Rp ${formatRp(saldoAwal + currentIncome - currentExpense)}`;

  // Update UI Saldo Per Metode
  balBCAEl.innerText = `Rp ${formatRp(balBCA)}`;
  balDanaEl.innerText = `Rp ${formatRp(balDana)}`;
  balCashEl.innerText = `Rp ${formatRp(balCash)}`;

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
      
      // Menyiapkan teks nominal dan kategori khusus untuk tipe Transfer
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
          <td class="px-6 py-4 text-sm whitespace-nowrap">${dateStr}</td>
          <td class="px-6 py-4 text-sm font-medium max-w-[150px] truncate">${t.note}</td>
          <td class="px-6 py-4 text-xs whitespace-nowrap">
            <span class="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700 inline-flex items-center">${methodHTML}</span>
          </td>
          <td class="px-6 py-4 text-xs whitespace-nowrap">
            <span class="text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">${categoryBadge}</span>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-right whitespace-nowrap">
            ${amountHTML}
          </td>
          <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-3">
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

// FITUR BARU: TAMPIL/SEMBUNYIKAN RENCANA VS REALITA
const toggleBudgetBtn = document.getElementById('toggleBudgetBtn');
const budgetToggleIcon = document.getElementById('budgetToggleIcon');
// (budgetContainer sudah dideklarasikan di atas sebelumnya)

if (toggleBudgetBtn) {
  toggleBudgetBtn.addEventListener('click', () => {
    // Sembunyikan/Tampilkan isinya
    budgetContainer.classList.toggle('hidden');
    
    // Putar ikon panah ke atas/bawah (180 derajat)
    budgetToggleIcon.classList.toggle('rotate-180');
  });
}

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
    document.getElementById('formCategory').value = t.category;
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

// LOGIKA UI TIPE FORM (Masuk, Keluar, Transfer)
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

// MENYIMPAN TRANSAKSI
if (transactionForm) {
  transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isTransfer = formType.value === 'transfer';
    
    // Validasi pencegahan transfer ke metode yang sama
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

    // Hanya tambahkan field "transferTo" jika tipenya adalah transfer
    if (isTransfer) {
      transactionData.transferTo = formTransferTo.value;
    }

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
      alert("Gagal menyimpan data ke cloud. Pastikan internet Anda lancar.");
    }
  });
}

