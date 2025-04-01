// State management
let currentUser = null;
let charts = {};

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const logoutBtn = document.getElementById('logoutBtn');
const notification = document.getElementById('notification');

// Event Listeners
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.dataset.page;
        switchPage(pageId);
    });
});

logoutBtn.addEventListener('click', handleLogout);

// Page Navigation
function switchPage(pageId) {
    // Update menu items
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });

    // Update pages
    pages.forEach(page => {
        page.classList.add('hidden');
        if (page.id === `${pageId}Page`) {
            page.classList.remove('hidden');
        }
    });

    // Load page data
    loadPageData(pageId);
}

// Page Data Loading
async function loadPageData(pageId) {
    try {
        switch (pageId) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'tickets':
                await loadTicketsData();
                break;
            case 'finance':
                await loadFinanceData();
                break;
            case 'users':
                await loadUsersData();
                break;
            case 'rates':
                await loadRatesData();
                break;
            case 'devices':
                await loadDevicesData();
                break;
            case 'logs':
                await loadLogsData();
                break;
            case 'gates':
                await loadGatesData();
                break;
            case 'stats':
                await loadStatsData();
                break;
            case 'settings':
                await loadSettingsData();
                break;
            case 'notifications':
                await loadNotificationsData();
                break;
            case 'help':
                await loadHelpData();
                break;
        }
    } catch (error) {
        showError('Gagal memuat data');
        console.error('Error loading page data:', error);
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        // Update stats cards
        document.querySelector('#dashboardPage .text-blue-600').textContent = data.vehiclesIn;
        document.querySelector('#dashboardPage .text-green-600').textContent = data.vehiclesOut;
        document.querySelector('#dashboardPage .text-yellow-600').textContent = formatCurrency(data.dailyRevenue);
        document.querySelector('#dashboardPage .text-purple-600').textContent = `${data.parkingCapacity}%`;

        // Initialize charts
        initDailyStatsChart(data.dailyStats);
        initWeeklyRevenueChart(data.weeklyRevenue);
    } catch (error) {
        throw new Error('Failed to load dashboard data');
    }
}

function initDailyStatsChart(data) {
    const ctx = document.getElementById('dailyStatsChart').getContext('2d');
    if (charts.dailyStats) {
        charts.dailyStats.destroy();
    }

    charts.dailyStats = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Kendaraan Masuk',
                    data: data.vehiclesIn,
                    borderColor: '#3b82f6',
                    tension: 0.1
                },
                {
                    label: 'Kendaraan Keluar',
                    data: data.vehiclesOut,
                    borderColor: '#10b981',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initWeeklyRevenueChart(data) {
    const ctx = document.getElementById('weeklyRevenueChart').getContext('2d');
    if (charts.weeklyRevenue) {
        charts.weeklyRevenue.destroy();
    }

    charts.weeklyRevenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Pendapatan',
                    data: data.revenue,
                    backgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// Ticket Management Functions
async function loadTicketsData() {
    try {
        const response = await fetch('/api/tickets');
        const tickets = await response.json();
        renderTicketsTable(tickets);
    } catch (error) {
        throw new Error('Failed to load tickets data');
    }
}

function renderTicketsTable(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    tbody.innerHTML = '';

    tickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticket.barcode}</td>
            <td>${ticket.plateNumber}</td>
            <td>${formatDateTime(ticket.entryTime)}</td>
            <td>${ticket.exitTime ? formatDateTime(ticket.exitTime) : '-'}</td>
            <td>${ticket.vehicleType.name}</td>
            <td>
                <span class="px-2 py-1 rounded-full text-xs ${
                    ticket.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                }">
                    ${ticket.status === 'ACTIVE' ? 'Masih Parkir' : 'Selesai'}
                </span>
            </td>
            <td>${ticket.amount ? formatCurrency(ticket.amount) : '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editTicket('${ticket.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteTicket('${ticket.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount);
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('id-ID');
}

function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

// Authentication Functions
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        showError('Gagal logout');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load initial page data
    loadPageData('dashboard');
});

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        currentUser = await response.json();
        updateUserInfo();
    } catch (error) {
        window.location.href = '/login.html';
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.querySelector('.text-sm.text-gray-600').textContent = 
            `Selamat datang, ${currentUser.fullName}`;
    }
} 