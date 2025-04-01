import { ExitPoint } from './exit-point';

// Exit point configuration
const exitPointConfig = {
    serverUrl: process.env.SERVER_URL || 'ws://localhost:3000',
    operatorId: process.env.OPERATOR_ID || 'operator1',
    paymentMethods: ['cash', 'card', 'e-wallet'],
    rates: {
        car: {
            hourly: 5,
            daily: 50,
            weekly: 300
        },
        motorcycle: {
            hourly: 3,
            daily: 30,
            weekly: 180
        },
        truck: {
            hourly: 8,
            daily: 80,
            weekly: 480
        },
        bus: {
            hourly: 10,
            daily: 100,
            weekly: 600
        }
    }
};

// Hardware configuration
const hardwareConfig = {
    gate: {
        port: process.env.EXIT_GATE_PORT || 'COM4',
        baudRate: parseInt(process.env.EXIT_GATE_BAUD_RATE || '9600')
    },
    scanner: {
        port: process.env.EXIT_SCANNER_PORT || 'COM5',
        baudRate: parseInt(process.env.EXIT_SCANNER_BAUD_RATE || '9600'),
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    },
    printer: {
        port: process.env.EXIT_PRINTER_PORT || 'COM6',
        baudRate: parseInt(process.env.EXIT_PRINTER_BAUD_RATE || '9600'),
        width: 80,
        characterSet: 'SLOVENIA'
    }
};

// Initialize exit point
const exitPoint = new ExitPoint(exitPointConfig, hardwareConfig);

// UI Elements
const ticketInfo = document.getElementById('ticketInfo');
const paymentInfo = document.getElementById('paymentInfo');
const errorMessage = document.getElementById('errorMessage');
const connectionStatus = document.getElementById('connectionStatus');
const currentTime = document.getElementById('currentTime');
const scanTicketBtn = document.getElementById('scanTicketBtn');
const processPaymentBtn = document.getElementById('processPaymentBtn');
const openGateBtn = document.getElementById('openGateBtn');
const paymentMethodsContainer = document.getElementById('paymentMethods');

// Initialize payment method buttons
function initializePaymentMethods() {
    exitPointConfig.paymentMethods.forEach(method => {
        const button = document.createElement('button');
        button.className = 'payment-method-btn';
        button.textContent = method.toUpperCase();
        button.addEventListener('click', () => selectPaymentMethod(method));
        paymentMethodsContainer.appendChild(button);
    });
}

// Payment method selection
function selectPaymentMethod(method) {
    // Update button styles
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');

    // Update payment details
    const paymentMethodElement = document.getElementById('paymentMethod');
    paymentMethodElement.textContent = method.toUpperCase();
}

// Update time display
function updateTime(date) {
    currentTime.textContent = date.toLocaleTimeString();
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Format duration
function formatDuration(duration) {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

// Update ticket info display
function updateTicketInfo(ticket) {
    const plateNumber = document.getElementById('plateNumber');
    const vehicleType = document.getElementById('vehicleType');
    const entryTime = document.getElementById('entryTime');
    const duration = document.getElementById('duration');

    plateNumber.textContent = ticket.plateNumber;
    vehicleType.textContent = ticket.vehicleType;
    entryTime.textContent = new Date(ticket.entryTime).toLocaleString();
    duration.textContent = formatDuration(Date.now() - new Date(ticket.entryTime).getTime());

    ticketInfo.classList.remove('hidden');
    processPaymentBtn.disabled = false;
}

// Update payment info display
function updatePaymentInfo(payment) {
    const paymentAmount = document.getElementById('paymentAmount');
    paymentAmount.textContent = `$${payment.amount.toFixed(2)}`;
    paymentInfo.classList.remove('hidden');
}

// Event Listeners
exitPoint.on('connected', () => {
    connectionStatus.textContent = 'Connected';
    document.querySelector('.status-dot').classList.replace('disconnected', 'connected');
});

exitPoint.on('disconnected', () => {
    connectionStatus.textContent = 'Disconnected';
    document.querySelector('.status-dot').classList.replace('connected', 'disconnected');
});

exitPoint.on('timeUpdate', updateTime);

exitPoint.on('barcodeScanned', async (result) => {
    try {
        scanTicketBtn.disabled = true;
        const ticket = await exitPoint.validateTicket(result.barcode);
        updateTicketInfo(ticket);
    } catch (error) {
        showError(error.message);
    } finally {
        scanTicketBtn.disabled = false;
    }
});

exitPoint.on('ticketValidated', async (ticket) => {
    try {
        const payment = await exitPoint.calculatePayment();
        updatePaymentInfo(payment);
    } catch (error) {
        showError(error.message);
    }
});

exitPoint.on('error', (error) => {
    showError(error.message);
});

exitPoint.on('paymentProcessed', (payment) => {
    paymentInfo.classList.add('hidden');
    ticketInfo.classList.add('hidden');
    processPaymentBtn.disabled = true;
    openGateBtn.disabled = true;
    showError('Payment processed successfully!');
});

// Button event listeners
scanTicketBtn.addEventListener('click', async () => {
    try {
        scanTicketBtn.disabled = true;
        await exitPoint.triggerScan();
    } catch (error) {
        showError(error.message);
    } finally {
        scanTicketBtn.disabled = false;
    }
});

processPaymentBtn.addEventListener('click', async () => {
    try {
        processPaymentBtn.disabled = true;
        const selectedMethod = document.querySelector('.payment-method-btn.selected');
        if (!selectedMethod) {
            throw new Error('Please select a payment method');
        }

        const paymentMethod = selectedMethod.textContent.toLowerCase();
        const payment = await exitPoint.calculatePayment();
        payment.paymentMethod = paymentMethod;

        await exitPoint.processPayment(payment);
    } catch (error) {
        showError(error.message);
        processPaymentBtn.disabled = false;
    }
});

openGateBtn.addEventListener('click', async () => {
    try {
        openGateBtn.disabled = true;
        await exitPoint.openGate();
    } catch (error) {
        showError(error.message);
        openGateBtn.disabled = false;
    }
});

// Initialize UI
initializePaymentMethods();
updateTime(new Date()); 