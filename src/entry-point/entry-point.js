import { EntryPoint } from './entry-point';

// Vehicle types configuration
const vehicleTypes = [
    { id: 'car', name: 'Car', price: 5 },
    { id: 'motorcycle', name: 'Motorcycle', price: 3 },
    { id: 'truck', name: 'Truck', price: 8 },
    { id: 'bus', name: 'Bus', price: 10 }
];

// Hardware configuration
const hardwareConfig = {
    gate: {
        port: process.env.GATE_PORT || '/dev/ttyUSB1',
        baudRate: parseInt(process.env.GATE_BAUD_RATE || '9600')
    },
    camera: {
        deviceId: 0,
        width: 1280,
        height: 720,
        quality: 100,
        output: 'jpeg'
    },
    printer: {
        name: process.env.PRINTER_NAME || 'TM-T82X-S-A-2',
        width: 80,
        characterSet: 'SLOVENIA'
    },
    scanner: {
        port: process.env.SCANNER_PORT || '/dev/ttyUSB2',
        baudRate: parseInt(process.env.SCANNER_BAUD_RATE || '9600'),
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
    }
};

// Entry point configuration
const entryPointConfig = {
    ...hardwareConfig,
    serverUrl: process.env.SERVER_URL || 'ws://localhost:3000',
    operatorId: process.env.OPERATOR_ID || 'operator1'
};

// Initialize entry point
const entryPoint = new EntryPoint(entryPointConfig, hardwareConfig);

// UI Elements
const cameraFeed = document.getElementById('cameraFeed');
const plateDisplay = document.getElementById('plateDisplay');
const errorMessage = document.getElementById('errorMessage');
const connectionStatus = document.getElementById('connectionStatus');
const currentTime = document.getElementById('currentTime');
const captureBtn = document.getElementById('captureBtn');
const generateTicketBtn = document.getElementById('generateTicketBtn');
const openGateBtn = document.getElementById('openGateBtn');
const vehicleTypesContainer = document.getElementById('vehicleTypes');

// Initialize vehicle type buttons
function initializeVehicleTypes() {
    vehicleTypes.forEach(type => {
        const button = document.createElement('button');
        button.className = 'vehicle-type-btn';
        button.textContent = `${type.name} ($${type.price})`;
        button.addEventListener('click', () => selectVehicleType(type));
        vehicleTypesContainer.appendChild(button);
    });
}

// Vehicle type selection
function selectVehicleType(type) {
    // Update button styles
    document.querySelectorAll('.vehicle-type-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');

    // Update entry point
    entryPoint.selectVehicleType(type);
    updateGenerateTicketButton();
}

// Update generate ticket button state
function updateGenerateTicketButton() {
    generateTicketBtn.disabled = !entryPoint.hasPlateNumber() || !entryPoint.hasSelectedVehicleType();
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

// Event Listeners
entryPoint.on('connected', () => {
    connectionStatus.textContent = 'Connected';
    document.querySelector('.status-dot').classList.replace('disconnected', 'connected');
});

entryPoint.on('disconnected', () => {
    connectionStatus.textContent = 'Disconnected';
    document.querySelector('.status-dot').classList.replace('connected', 'disconnected');
});

entryPoint.on('timeUpdate', updateTime);

entryPoint.on('cameraFrame', (image) => {
    cameraFeed.src = `data:image/jpeg;base64,${image}`;
});

entryPoint.on('plateRecognized', (plate) => {
    plateDisplay.textContent = plate;
    updateGenerateTicketButton();
});

entryPoint.on('error', (error) => {
    showError(error.message);
});

entryPoint.on('ticketGenerated', (ticket) => {
    plateDisplay.textContent = 'No plate detected';
    updateGenerateTicketButton();
    showError('Ticket generated successfully!');
});

// Button event listeners
captureBtn.addEventListener('click', async () => {
    try {
        captureBtn.disabled = true;
        await entryPoint.capturePlate();
    } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to capture plate');
    } finally {
        captureBtn.disabled = false;
    }
});

generateTicketBtn.addEventListener('click', async () => {
    try {
        generateTicketBtn.disabled = true;
        await entryPoint.generateTicket();
    } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to generate ticket');
    } finally {
        generateTicketBtn.disabled = false;
    }
});

openGateBtn.addEventListener('click', async () => {
    try {
        openGateBtn.disabled = true;
        await entryPoint.openGate();
    } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to open gate');
    } finally {
        openGateBtn.disabled = false;
    }
});

// Initialize UI
initializeVehicleTypes();
updateTime(new Date()); 