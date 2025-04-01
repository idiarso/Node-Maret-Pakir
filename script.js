// Parking management system
class ParkingSystem {
    constructor() {
        this.tickets = [];
        this.rates = {};
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        if (this.darkMode) document.body.classList.add('dark-mode');
        this.initializeEventListeners();
        this.loadParkingRates();
        this.updateParkingList();
        this.showLoginOrDashboard();
        this.initializeCharts();
        this.updateDashboard();
    }

    async loadParkingRates() {
        try {
            const response = await fetch('/api/rates');
            this.rates = await response.json();
            if (this.user?.role === 'admin') {
                this.showRatesManagement();
            }
        } catch (error) {
            console.error('Error loading parking rates:', error);
        }
    }

    initializeEventListeners() {
        const parkingForm = document.getElementById('parkingForm');
        if (parkingForm) {
            parkingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registerVehicle();
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => this.showTab(button.getAttribute('data-tab')));
        });

        // Report type change
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.addEventListener('change', () => this.changeReportType());
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                this.login(username, password);
            });
        }

        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        if (prevPageBtn && nextPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.updateParkingList();
                }
            });

            nextPageBtn.addEventListener('click', () => {
                const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
                if (this.currentPage < maxPage) {
                    this.currentPage++;
                    this.updateParkingList();
                }
            });
        }
    }

    generateTicketId() {
        return 'TKT' + Date.now().toString().slice(-6);
    }

    async registerVehicle() {
        const plateNumber = document.getElementById('plateNumber').value.toUpperCase();
        const vehicleType = document.getElementById('vehicleType').value;

        // Check if vehicle is already parked
        const existingTicket = this.tickets.find(ticket => 
            ticket.plate_number === plateNumber && ticket.status === 'active'
        );

        if (existingTicket) {
            alert('Kendaraan ini sudah terdaftar dan masih di dalam parkir!');
            return;
        }

        const ticket = {
            id: this.generateTicketId(),
            plateNumber: plateNumber,
            vehicleType: vehicleType,
            entryTime: new Date().toISOString(),
            status: 'active'
        };

        try {
            await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticket)
            });
            await this.updateParkingList();
            document.getElementById('parkingForm').reset();
        } catch (error) {
            console.error('Error registering vehicle:', error);
            alert('Terjadi kesalahan saat mendaftarkan kendaraan.');
        }
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showLoginOrDashboard();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Terjadi kesalahan saat login.');
        }
    }

    async checkoutVehicle(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const rate = this.rates[ticket.vehicle_type];
        const fee = rate;

        const confirmed = confirm(
            `Biaya Parkir:\n\n` +
            `Tarif Flat: Rp ${rate.toLocaleString()}\n\n` +
            `Konfirmasi pembayaran?`
        );

        if (confirmed) {
            try {
                await fetch(`/api/tickets/${ticketId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fee: fee
                    })
                });
                await this.updateParkingList();
            } catch (error) {
                console.error('Error checking out vehicle:', error);
                alert('Terjadi kesalahan saat checkout kendaraan.');
            }
        }
    }

    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async updateDashboard() {
        try {
            const response = await fetch('/api/dashboard/stats', {
                headers: this.getAuthHeaders()
            });
            const stats = await response.json();

            document.getElementById('todayVehicles').textContent = stats.todayVehicles;
            document.getElementById('todayIncome').textContent = `Rp ${stats.todayIncome.toLocaleString()}`;
            document.getElementById('activeVehicles').textContent = 
                stats.activeParking.reduce((sum, item) => sum + parseInt(item.count), 0);

            this.updateIncomeChart();
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    async updateIncomeChart() {
        try {
            const today = new Date();
            const response = await fetch(`/api/reports/monthly-income?month=${today.getMonth() + 1}&year=${today.getFullYear()}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();

            const chartData = {
                labels: data.map(item => item.date),
                datasets: [{
                    label: 'Pendapatan Harian',
                    data: data.map(item => item.total_income),
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    fill: true
                }]
            };

            this.incomeChart.data = chartData;
            this.incomeChart.update();
        } catch (error) {
            console.error('Error updating income chart:', error);
        }
    }

    initializeCharts() {
        const ctx = document.getElementById('incomeChart');
        if (ctx) {
            this.incomeChart = new Chart(ctx, {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => `Rp ${value.toLocaleString()}`
                            }
                        }
                    }
                }
            });
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const table = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        table.innerHTML = '';

        try {
            let url, data;
            if (reportType === 'daily') {
                const date = document.getElementById('reportDate').value;
                url = `/api/reports/daily-income?date=${date}`;
            } else {
                const monthInput = document.getElementById('reportMonth').value;
                const [year, month] = monthInput.split('-');
                url = `/api/reports/monthly-income?month=${month}&year=${year}`;
            }

            const response = await fetch(url, {
                headers: this.getAuthHeaders()
            });
            data = await response.json();

            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.date}</td>
                    <td>${row.total_vehicles}</td>
                    <td>Rp ${row.total_income.toLocaleString()}</td>
                `;
                table.appendChild(tr);
            });
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Terjadi kesalahan saat menghasilkan laporan.');
        }
    }

    changeReportType() {
        const reportType = document.getElementById('reportType').value;
        document.getElementById('dateSelector').style.display = 
            reportType === 'daily' ? 'block' : 'none';
        document.getElementById('monthSelector').style.display = 
            reportType === 'monthly' ? 'block' : 'none';
    }

    showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        if (tabId === 'dashboard') {
            this.updateDashboard();
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode);
    }

    getAuthHeaders() {
        return this.token ? {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    showLoginOrDashboard() {
        const container = document.querySelector('.container');
        if (!this.user) {
            container.innerHTML = `
                <div class="header">
                    <h1>Login Admin</h1>
                </div>
                <div class="parking-form">
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">Username:</label>
                            <input type="text" id="username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" required>
                        </div>
                        <button type="submit">Login</button>
                    </form>
                </div>
            `;
            this.initializeEventListeners();
        } else if (this.user.role === 'admin') {
            this.loadParkingRates();
        }
    }

    showRatesManagement() {
        const ratesManagement = document.createElement('div');
        ratesManagement.className = 'parking-form';
        ratesManagement.innerHTML = `
            <h2>Manajemen Tarif Parkir</h2>
            <form id="rateForm">
                <div class="form-group">
                    <label for="newVehicleType">Jenis Kendaraan:</label>
                    <input type="text" id="newVehicleType" required>
                </div>
                <div class="form-group">
                    <label for="newFlatRate">Tarif Flat:</label>
                    <input type="number" id="newFlatRate" required>
                </div>
                <div class="form-group">
                    <label for="description">Deskripsi:</label>
                    <input type="text" id="description" required>
                </div>
                <button type="submit">Tambah Tarif</button>
            </form>
            <div id="ratesList"></div>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(ratesManagement, container.children[1]);

        const rateForm = document.getElementById('rateForm');
        rateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const vehicleType = document.getElementById('newVehicleType').value;
            const flatRate = document.getElementById('newFlatRate').value;
            const description = document.getElementById('description').value;

            try {
                await fetch('/api/rates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({
                        vehicleType,
                        flatRate: parseInt(flatRate),
                        description
                    })
                });
                await this.loadParkingRates();
                rateForm.reset();
            } catch (error) {
                console.error('Error creating rate:', error);
                alert('Terjadi kesalahan saat menambah tarif.');
            }
        });
    }

    async updateParkingList() {
        try {
            const response = await fetch(`/api/tickets?page=${this.currentPage}&limit=${this.itemsPerPage}`);
            const data = await response.json();
            this.tickets = data.tickets;
            this.totalItems = data.total;

            const listElement = document.getElementById('parkingList');
            listElement.innerHTML = '';

            this.tickets.forEach(ticket => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${ticket.id}</td>
                    <td>${ticket.plate_number}</td>
                    <td>${ticket.vehicle_type === 'motor' ? 'Motor' : 'Mobil'}</td>
                    <td>${this.formatDateTime(ticket.entry_time)}</td>
                    <td class="status-${ticket.status}">
                        ${ticket.status === 'active' ? 'Aktif' : 'Selesai'}
                    </td>
                    <td>
                        ${ticket.status === 'active' ? 
                            `<button onclick="parkingSystem.checkoutVehicle('${ticket.id}')">Checkout</button>` : 
                            `Rp ${ticket.fee ? ticket.fee.toLocaleString() : 0}`}
                    </td>
                `;
                listElement.appendChild(row);
            });

            // Update pagination controls
            const prevPageBtn = document.getElementById('prevPage');
            const nextPageBtn = document.getElementById('nextPage');
            const currentPageSpan = document.getElementById('currentPage');
            
            if (prevPageBtn && nextPageBtn && currentPageSpan) {
                prevPageBtn.disabled = this.currentPage <= 1;
                nextPageBtn.disabled = this.currentPage >= Math.ceil(this.totalItems / this.itemsPerPage);
                currentPageSpan.textContent = this.currentPage;
            }
        } catch (error) {
            console.error('Error updating parking list:', error);
            alert('Terjadi kesalahan saat memuat daftar parkir.');
        }
    }
}

// Initialize the parking system
const parkingSystem = new ParkingSystem();
