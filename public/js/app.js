// State management
let currentTicket = null;
let isOnline = navigator.onLine;
let pendingTransactions = [];

// DOM Elements
const barcodeInput = document.getElementById('barcodeInput');
const scanButton = document.getElementById('scanButton');
const ticketInfo = document.getElementById('ticketInfo');
const paymentForm = document.getElementById('paymentForm');
const plateNumber = document.getElementById('plateNumber');
const entryTime = document.getElementById('entryTime');
const duration = document.getElementById('duration');
const amount = document.getElementById('amount');
const paymentAmount = document.getElementById('paymentAmount');
const processPayment = document.getElementById('processPayment');
const openGate = document.getElementById('openGate');
const activityLog = document.getElementById('activityLog');

// Event Listeners
barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleBarcodeScan(barcodeInput.value);
    }
});

scanButton.addEventListener('click', () => {
    handleBarcodeScan(barcodeInput.value);
});

processPayment.addEventListener('click', handlePayment);
openGate.addEventListener('click', handleGateOpen);

// Network status monitoring
window.addEventListener('online', () => {
    isOnline = true;
    syncPendingTransactions();
});

window.addEventListener('offline', () => {
    isOnline = false;
});

// Core Functions
async function handleBarcodeScan(barcode) {
    if (!barcode) return;
    
    try {
        const ticket = await fetchTicketData(barcode);
        if (ticket) {
            displayTicketInfo(ticket);
            currentTicket = ticket;
            paymentForm.classList.remove('hidden');
            openGate.disabled = true;
        }
    } catch (error) {
        showError('Gagal mengambil data tiket');
    }
}

async function fetchTicketData(barcode) {
    if (isOnline) {
        try {
            const response = await fetch(`/api/tickets/${barcode}`);
            if (!response.ok) throw new Error('Tiket tidak ditemukan');
            return await response.json();
        } catch (error) {
            // Fallback to IndexedDB
            return await getTicketFromIndexedDB(barcode);
        }
    } else {
        return await getTicketFromIndexedDB(barcode);
    }
}

function displayTicketInfo(ticket) {
    ticketInfo.classList.remove('hidden');
    plateNumber.textContent = ticket.plateNumber;
    entryTime.textContent = new Date(ticket.entryTime).toLocaleString();
    
    const durationInHours = calculateDuration(ticket.entryTime);
    duration.textContent = `${durationInHours.toFixed(2)} jam`;
    
    const calculatedAmount = calculateAmount(durationInHours, ticket.vehicleType.price);
    amount.textContent = `Rp ${calculatedAmount.toLocaleString()}`;
    
    paymentAmount.value = calculatedAmount;
}

function calculateDuration(entryTime) {
    const entry = new Date(entryTime);
    const now = new Date();
    return (now - entry) / (1000 * 60 * 60);
}

function calculateAmount(duration, pricePerHour) {
    return Math.ceil(duration * pricePerHour);
}

async function handlePayment() {
    if (!currentTicket) return;
    
    const paidAmount = parseFloat(paymentAmount.value);
    const calculatedAmount = parseFloat(amount.textContent.replace(/[^0-9.-]+/g, ''));
    
    if (paidAmount < calculatedAmount) {
        showError('Jumlah pembayaran kurang');
        return;
    }
    
    try {
        const transaction = {
            id: crypto.randomUUID(),
            ticketId: currentTicket.id,
            amount: paidAmount,
            timestamp: new Date().toISOString()
        };
        
        if (isOnline) {
            await saveTransaction(transaction);
        } else {
            await saveTransactionToIndexedDB(transaction);
            pendingTransactions.push(transaction);
        }
        
        openGate.disabled = false;
        showSuccess('Pembayaran berhasil');
    } catch (error) {
        showError('Gagal memproses pembayaran');
    }
}

async function handleGateOpen() {
    if (!currentTicket) return;
    
    try {
        if (isOnline) {
            await fetch('/api/gate/open', { method: 'POST' });
        }
        
        // Add to activity log
        addToActivityLog(currentTicket);
        
        // Reset form
        resetForm();
        
        showSuccess('Gerbang dibuka');
    } catch (error) {
        showError('Gagal membuka gerbang');
    }
}

function resetForm() {
    barcodeInput.value = '';
    ticketInfo.classList.add('hidden');
    paymentForm.classList.add('hidden');
    currentTicket = null;
    openGate.disabled = true;
}

function addToActivityLog(ticket) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${activityLog.children.length + 1}</td>
        <td>${ticket.barcode}</td>
        <td>${new Date().toLocaleString()}</td>
        <td>Rp ${amount.textContent.replace(/[^0-9.-]+/g, '')}</td>
    `;
    activityLog.insertBefore(row, activityLog.firstChild);
}

// IndexedDB Functions
const dbName = 'parkingDB';
const dbVersion = 1;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('tickets')) {
                db.createObjectStore('tickets', { keyPath: 'barcode' });
            }
            
            if (!db.objectStoreNames.contains('transactions')) {
                db.createObjectStore('transactions', { keyPath: 'id' });
            }
        };
    });
}

async function getTicketFromIndexedDB(barcode) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tickets'], 'readonly');
        const store = transaction.objectStore('tickets');
        const request = store.get(barcode);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveTransactionToIndexedDB(transaction) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readwrite');
        const store = transaction.objectStore('transactions');
        const request = store.add(transaction);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// API Functions
async function saveTransaction(transaction) {
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
    });
    
    if (!response.ok) throw new Error('Gagal menyimpan transaksi');
    return await response.json();
}

async function syncPendingTransactions() {
    for (const transaction of pendingTransactions) {
        try {
            await saveTransaction(transaction);
            pendingTransactions = pendingTransactions.filter(t => t.id !== transaction.id);
        } catch (error) {
            console.error('Gagal sync transaksi:', error);
        }
    }
}

// UI Functions
function showError(message) {
    // Implement error notification
    alert(message);
}

function showSuccess(message) {
    // Implement success notification
    alert(message);
}

// Initialize
initDB(); 