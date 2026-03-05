// script.js

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
  
  // Ambil elemen DOM
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
  // Set default ke bulan saat ini
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  monthFilter.value = currentYearMonth;
  document.getElementById('formDate').value = today.toISOString().split('T')[0];
  
// --- FUNGSI RENDER UTAMA ---
function renderApp() {
  const selectedMonth = monthFilter.value; 
  const selectedFilter = tableFilter.value; // Ambil nilai dropdown filter ('all', 'in', atau 'out')
  
  let saldoAwal = 0;
  let currentIncome = 0;
  let currentExpense = 0;
  let categoryExpenses = {};

  let monthTransactions = []; // Semua transaksi di bulan terpilih (untuk hitung saldo)

  // 1. Kalkulasi Logika Keuangan & Kumpulkan Data Bulan Ini
  transactions.forEach(t => {
    const tMonth = t.date.substring(0, 7); 

    if (tMonth < selectedMonth) {
      // Hitung Saldo Awal
      if (t.type === 'in') saldoAwal += t.amount;
      else saldoAwal -= t.amount;
    } else if (tMonth === selectedMonth) {
      // Masukkan semua transaksi ke bulan ini
      monthTransactions.push(t);
      
      // Hitung pemasukan dan pengeluaran bulan ini
      if (t.type === 'in') {
        currentIncome += t.amount;
      } else {
        currentExpense += t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
      }
    }
  });

  // Saldo Akhir
  let saldoAkhir = saldoAwal + currentIncome - currentExpense;

  // Update DOM Text Kartu Summary
  saldoAwalEl.innerText = `Rp ${formatRp(saldoAwal)}`;
  pemasukanEl.innerText = `Rp ${formatRp(currentIncome)}`;
  pengeluaranEl.innerText = `Rp ${formatRp(currentExpense)}`;
  saldoAkhirEl.innerText = `Rp ${formatRp(saldoAkhir)}`;

  // 2. Logika Filter Tabel
  // Menyaring data hanya untuk tampilan tabel berdasarkan tipe in/out
  let tableData = monthTransactions;
  if (selectedFilter !== 'all') {
    tableData = monthTransactions.filter(t => t.type === selectedFilter);
  }

  // 3. Render Tabel
  transactionBody.innerHTML = '';
  if (tableData.length === 0) {
    transactionBody.innerHTML = `<tr><td colSpan="6" class="px-6 py-12 text-center text-zinc-500 italic">Tidak ada transaksi yang sesuai.</td></tr>`;
  } else {
    // Urutkan dari yang terbaru
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
  
  // Ubah Filter Bulan
  monthFilter.addEventListener('change', renderApp);
  tableFilter.addEventListener('change', renderApp);
  
  // Hapus Transaksi (di-expose ke window object agar bisa dipanggil dari inline onclick HTML)
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
  
  btnOpenModal.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });
  
  btnCloseModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
  
  // Toggle Tipe In/Out
  btnTypeIn.addEventListener('click', () => {
    formType.value = 'in';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-green-600 text-white shadow-lg';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    optGaji.classList.remove('hidden');
  });
  
  btnTypeOut.addEventListener('click', () => {
    formType.value = 'out';
    btnTypeOut.className = 'flex-1 py-2 text-xs rounded-md transition-all bg-red-600 text-white shadow-lg';
    btnTypeIn.className = 'flex-1 py-2 text-xs rounded-md transition-all text-zinc-400';
    optGaji.classList.add('hidden');
    if(document.getElementById('formCategory').value === 'Gaji'){
      document.getElementById('formCategory').value = 'Makanan & Minuman';
    }
  });
  
  // Submit Form
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
    
    // Reset form dan tutup modal
    transactionForm.reset();
    document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
    btnCloseModal.click();
    
    // Render ulang layar
    renderApp();
  });
  
  // Jalankan render pertama kali dan inisialisasi icon
  renderApp();
  lucide.createIcons();