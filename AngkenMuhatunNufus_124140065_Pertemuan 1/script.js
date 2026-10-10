const STORAGE_KEY = "miniPOS_cart";
const DISCOUNT_THRESHOLD = 50000;
const DISCOUNT_RATE = 0.10;

const itemForm = document.getElementById("itemForm");
const namaInput = document.getElementById("nama");
const hargaInput = document.getElementById("harga");
const qtyInput = document.getElementById("qty");
const uangBayarInput = document.getElementById("uangBayar");

const cartBody = document.getElementById("cartBody");
const emptyMessage = document.getElementById("emptyMessage");
const itemCount = document.getElementById("itemCount");

const totalBelanjaEl = document.getElementById("totalBelanja");
const diskonEl = document.getElementById("diskon");
const totalAkhirEl = document.getElementById("totalAkhir");
const discountNote = document.getElementById("discountNote");

const kembalianEl = document.getElementById("kembalian");
const changeLabel = document.getElementById("changeLabel");
const paymentMessage = document.getElementById("paymentMessage");
const bayarError = document.getElementById("bayarError");

const completeBtn = document.getElementById("completeBtn");
const resetBtn = document.getElementById("resetBtn");

// Data keranjang selama aplikasi berjalan.
let cart = loadCart();

// Format angka menjadi Rupiah.
function formatRupiah(amount) {
return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
}).format(amount);
}

// Membaca data dari localStorage.
function loadCart() {
try {
    const savedCart = localStorage.getItem(STORAGE_KEY);

    if (!savedCart) {
    return [];
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
    return [];
    }

    // Memastikan data yang dibaca memiliki struktur yang benar.
    return parsedCart.filter(item =>
    item &&
    typeof item.id === "string" &&
    typeof item.nama === "string" &&
    item.nama.trim().length >= 3 &&
    Number.isSafeInteger(item.harga) &&
    item.harga >= 500 &&
    Number.isSafeInteger(item.qty) &&
    item.qty >= 1 &&
      Number.isSafeInteger(item.harga * item.qty) &&
    Number.isSafeInteger(item.id.length)
    );
} catch (error) {
    console.error("Gagal membaca keranjang:", error);
    return [];
}
}

// Menyimpan data keranjang ke localStorage.
function saveCart() {
try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
} catch (error) {
    console.error("Gagal menyimpan keranjang:", error);
    alert("Keranjang gagal disimpan di browser.");
}
}

// Menampilkan pesan validasi.
function showError(input, errorId, message) {
document.getElementById(errorId).textContent = message;
input.classList.toggle("invalid", Boolean(message));
input.setAttribute("aria-invalid", message ? "true" : "false");
}

// Menghapus pesan validasi.
function clearError(input, errorId) {
showError(input, errorId, "");
}

// Memvalidasi form barang.
function validateForm() {
let valid = true;

const nama = namaInput.value.trim();
const hargaText = hargaInput.value.trim();
const qtyText = qtyInput.value.trim();

const harga = Number(hargaText);
const qty = Number(qtyText);

if (nama.length < 3) {
    showError(
    namaInput,
    "namaError",
    "Nama barang wajib diisi minimal 3 karakter."
    );
    valid = false;
} else {
    clearError(namaInput, "namaError");
}

if (
    hargaText === "" ||
    !Number.isSafeInteger(harga) ||
    harga < 500
) {
    showError(
    hargaInput,
    "hargaError",
    "Harga harus berupa angka bulat minimal Rp500."
    );
    valid = false;
} else {
    clearError(hargaInput, "hargaError");
}

if (
    qtyText === "" ||
    !Number.isSafeInteger(qty) ||
    qty < 1
) 
{
    showError(
    qtyInput,
    "qtyError",
    "Jumlah harus berupa bilangan bulat minimal 1."
    );
    valid = false;
} else {
    clearError(qtyInput, "qtyError");
}

if (
    valid &&
    !Number.isSafeInteger(harga * qty)
) {
    showError(
      hargaInput,
      "hargaError",
      "Hasil perhitungan harga terlalu besar."
    );
    valid = false;
  }

  return valid;
}

// Menangani pengiriman form.
itemForm.addEventListener("submit", function(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const nama = namaInput.value.trim();
  const harga = Number(hargaInput.value);
  const qty = Number(qtyInput.value);

  const newItem = {
    id: crypto.randomUUID(),
    nama: nama,
    harga: harga,
    qty: qty
  };

  cart.push(newItem);
  saveCart();

  itemForm.reset();

  clearError(namaInput, "namaError");
  clearError(hargaInput, "hargaError");
  clearError(qtyInput, "qtyError");

  renderCart();
  namaInput.focus();
});

// Menampilkan keranjang dalam tabel.
function renderCart() {
  cartBody.replaceChildren();

  emptyMessage.hidden = cart.length > 0;

  cart.forEach(function(item, index) {
    const row = document.createElement("tr");

    const values = [
      index + 1,
      item.nama,
      formatRupiah(item.harga),
      item.qty,
      formatRupiah(item.harga * item.qty)
    ];

    values.forEach(function(value) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "btn btn-delete";
    deleteButton.textContent = "Hapus";

    deleteButton.addEventListener("click", function() {
      removeItem(item.id);
    });

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    cartBody.appendChild(row);
  });

  const totalQty = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  itemCount.textContent = `${totalQty} item`;

  calculateTotals();
}

// Menghitung subtotal keseluruhan, diskon, dan total akhir.
function calculateTotals() {
  const total = cart.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  );

  const discount = total >= DISCOUNT_THRESHOLD
    ? Math.floor(total * DISCOUNT_RATE)
    : 0;

  const finalTotal = total - discount;

  totalBelanjaEl.textContent = formatRupiah(total);
  diskonEl.textContent = "− " + formatRupiah(discount);
  totalAkhirEl.textContent = formatRupiah(finalTotal);

  if (discount > 0) {
    discountNote.textContent =
      "Diskon 10% berhasil diterapkan!";
  } else {
    const remaining = DISCOUNT_THRESHOLD - total;

    discountNote.textContent = cart.length === 0
      ? "Belanja minimal Rp50.000 untuk mendapat diskon 10%."
      : `Tambah belanja ${formatRupiah(remaining)} untuk mendapat diskon.`;
  }

  updatePayment(finalTotal);

  return { total, discount, finalTotal };
}

// Menghitung pembayaran dan kembalian.
function updatePayment(finalTotal) {
  const bayarText = uangBayarInput.value.trim();
  const bayar = Number(bayarText);

  clearError(uangBayarInput, "bayarError");

  if (cart.length === 0) {
    changeLabel.textContent = "Kembalian";
    kembalianEl.textContent = formatRupiah(0);
    paymentMessage.textContent =
      "Tambahkan barang sebelum melakukan pembayaran.";
    completeBtn.disabled = true;
    return;
  }

  if (bayarText === "") {
    changeLabel.textContent = "Kembalian";
    kembalianEl.textContent = formatRupiah(0);
    paymentMessage.textContent = "Masukkan nominal uang bayar.";
    completeBtn.disabled = true;
    return;
  }

  if (
    !Number.isSafeInteger(bayar) ||
    bayar < 0
  ) {
    showError(
      uangBayarInput,
      "bayarError",
      "Uang bayar harus berupa angka bulat nonnegatif."
    );
    kembalianEl.textContent = formatRupiah(0);
    paymentMessage.textContent = "Periksa nominal pembayaran.";
    completeBtn.disabled = true;
    return;
  }

  if (bayar < finalTotal) {
    const kekurangan = finalTotal - bayar;

    changeLabel.textContent = "Kekurangan";
    kembalianEl.textContent = formatRupiah(kekurangan);
    paymentMessage.textContent =
      "Uang belum mencukupi.";
    completeBtn.disabled = true;
  } else {
    changeLabel.textContent = "Kembalian";
    kembalianEl.textContent =
      formatRupiah(bayar - finalTotal);
    paymentMessage.textContent =
      "Uang pembayaran mencukupi.";
    completeBtn.disabled = false;
  }
}

// Menghapus satu barang berdasarkan ID.
function removeItem(id) {
  cart = cart.filter(item => item.id !== id);

  saveCart();
  renderCart();
}

// Menyelesaikan transaksi jika pembayaran cukup.
completeBtn.addEventListener("click", function() {
  const { total, discount, finalTotal } = calculateTotals();

  const bayarText = uangBayarInput.value.trim();
  const bayar = Number(bayarText);

  if (
    cart.length === 0 ||
    bayarText === "" ||
    !Number.isSafeInteger(bayar) ||
    bayar < finalTotal
  ) {
    updatePayment(finalTotal);
    return;
  }

  const change = bayar - finalTotal;

  alert(
    "TRANSAKSI BERHASIL!\n\n" +
    "Total belanja: " + formatRupiah(total) + "\n" +
    "Diskon: " + formatRupiah(discount) + "\n" +
    "Total akhir: " + formatRupiah(finalTotal) + "\n" +
    "Uang bayar: " + formatRupiah(bayar) + "\n" +
    "Kembalian: " + formatRupiah(change)
  );

  resetTransaction();
});

// Mengosongkan keranjang dan penyimpanan.
function resetTransaction() {
  cart = [];

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Gagal menghapus penyimpanan:", error);
    alert("Penyimpanan browser gagal dibersihkan.");
  }

  itemForm.reset();
  uangBayarInput.value = "";

  clearError(namaInput, "namaError");
  clearError(hargaInput, "hargaError");
  clearError(qtyInput, "qtyError");
  clearError(uangBayarInput, "bayarError");

  renderCart();
}

resetBtn.addEventListener("click", function() {
  if (cart.length > 0) {
    const confirmed = confirm(
      "Yakin ingin mengosongkan seluruh keranjang?"
    );

    if (!confirmed) {
      return;
    }
  }

  resetTransaction();
});

// Perbarui perhitungan saat uang bayar diubah.
uangBayarInput.addEventListener("input", function() {
  const { finalTotal } = calculateTotals();
  updatePayment(finalTotal);
});

// Bersihkan pesan kesalahan ketika pengguna memperbaiki input.
namaInput.addEventListener("input", function() {
  if (namaInput.value.trim().length >= 3) {
    clearError(namaInput, "namaError");
  }
});

hargaInput.addEventListener("input", function() {
  const value = Number(hargaInput.value);

  if (
    hargaInput.value.trim() !== "" &&
    Number.isSafeInteger(value) &&
    value >= 500
  ) {
    clearError(hargaInput, "hargaError");
  }
});

qtyInput.addEventListener("input", function() {
  const value = Number(qtyInput.value);

  if (
    qtyInput.value.trim() !== "" &&
    Number.isSafeInteger(value) &&
    value >= 1
  ) {
    clearError(qtyInput, "qtyError");
  }
});

// Tampilkan kembali data yang tersimpan saat halaman dibuka.
renderCart();