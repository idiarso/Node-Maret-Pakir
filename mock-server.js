const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // For testing purposes accept any login
  if (username && password) {
    return res.json({
      success: true,
      token: 'mock-jwt-token-for-testing',
      user: {
        id: 1,
        username: username,
        fullName: 'Test User',
        role: 'ADMIN',
        email: 'admin@example.com'
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Mock devices endpoint
app.get('/api/devices', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Entry Scanner',
      type: 'CAMERA',
      location: 'Main Entrance',
      port: 'COM1',
      ipAddress: '192.168.1.100',
      status: 'ONLINE',
      lastPing: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Exit Printer',
      type: 'PAYMENT_TERMINAL',
      location: 'Exit Gate',
      port: 'COM2',
      ipAddress: '192.168.1.101',
      status: 'ONLINE',
      lastPing: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
});

// Mock gates endpoint
app.get('/api/gates', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Main Entrance Gate',
      location: 'North Side',
      deviceId: 1,
      status: 'CLOSED',
      lastStatusChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Exit Gate',
      location: 'South Side',
      deviceId: 2,
      status: 'OPEN',
      lastStatusChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
});

// Mock vehicles endpoint
app.get('/api/vehicles', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        licensePlate: 'ABC123',
        type: 'CAR',
        make: 'Toyota',
        model: 'Camry',
        color: 'Blue',
        userId: 1,
        ownerName: 'John Doe',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        licensePlate: 'XYZ789',
        type: 'MOTORCYCLE',
        make: 'Honda',
        model: 'CBR',
        color: 'Red',
        userId: 1,
        ownerName: 'John Doe',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  });
});

// Mock parking areas endpoint
app.get('/api/parking-areas', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        name: 'Main Parking Lot',
        location: 'North Building',
        capacity: 200,
        availableSpots: 45,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'VIP Parking',
        location: 'East Wing',
        capacity: 50,
        availableSpots: 12,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  });
});

// Dashboard data endpoint
app.get('/api/dashboard', (req, res) => {
  // Generate 10 recent realistic transactions
  const recentTransactions = Array.from({ length: 10 }, (_, i) => {
    const randomAmount = Math.floor(Math.random() * 50000) + 15000; // Between 15,000 and 65,000 Rp
    const randomHoursAgo = Math.floor(Math.random() * 24); // Within last 24 hours
    const randomVehicleType = ['Car', 'Motorcycle', 'Truck'][Math.floor(Math.random() * 3)];
    const randomPlateLetters = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    return {
      id: i + 1,
      licensePlate: `B ${1000 + Math.floor(Math.random() * 9000)} ${randomPlateLetters}`,
      amount: randomAmount,
      vehicleType: randomVehicleType,
      timestamp: new Date(Date.now() - (randomHoursAgo * 60 * 60 * 1000)),
      duration: `${Math.floor(Math.random() * 4) + 1}.${Math.floor(Math.random() * 6)}h`
    };
  });

  // Calculate total revenue from transactions
  const totalRevenue = recentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) * 5; // Multiply by 5 to get a bigger number

  // Create realistic dashboard data
  res.json({
    activeTickets: 12,
    totalTickets: 85,
    availableSpots: 75,
    totalCapacity: 200,
    occupancyRate: 62.5,
    
    // Revenue data
    todayRevenue: 2500000, // 2.5 million Rp
    weeklyRevenue: 15750000,
    monthlyRevenue: 45000000,
    
    // Time data
    averageDuration: '2.5h',
    peakHours: ['08:00', '17:00'],
    
    // Vehicle data
    totalVehicles: 125,
    vehicleTypes: {
      car: 70,
      motorcycle: 45,
      truck: 10
    },
    
    // Device status
    deviceStatus: {
      online: 8,
      offline: 2,
      maintenance: 1
    },
    
    // Recent transactions
    recentTransactions,
    
    // Hourly stats for charts
    hourlyStats: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      entrances: Math.floor(Math.random() * 20),
      exits: Math.floor(Math.random() * 18),
      revenue: Math.floor(Math.random() * 500000)
    })),
    
    // Weekly stats for charts
    weeklyStats: Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - i);
      return {
        day: day.toLocaleDateString('id-ID', { weekday: 'short' }),
        date: day.toLocaleDateString('id-ID'),
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
        vehicles: Math.floor(Math.random() * 50) + 20
      };
    }).reverse()
  });
});

// Mock ticket scan endpoint
app.post('/api/tickets/scan', (req, res) => {
  const { barcode } = req.body;
  
  if (!barcode) {
    return res.status(400).json({
      success: false,
      message: 'Barcode is required'
    });
  }
  
  // Vehicle type to determine rate
  const vehicleType = ['CAR', 'MOTORCYCLE', 'TRUCK'][Math.floor(Math.random() * 3)];
  
  // Get base rate for this vehicle type
  let baseRate = 5000; // Default for Car
  if (vehicleType === 'MOTORCYCLE') baseRate = 2000;
  if (vehicleType === 'TRUCK') baseRate = 10000;
  
  // Return mock ticket data
  res.json({
    success: true,
    ticket: {
      id: Math.floor(Math.random() * 1000),
      barcode: barcode,
      entryTime: new Date(Date.now() - Math.floor(Math.random() * 4 * 60 * 60 * 1000)), // Random 0-4 hours ago
      vehicleType: vehicleType,
      licensePlate: `B ${Math.floor(Math.random() * 9999)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      status: 'ACTIVE',
      fee: baseRate, // Use base rate as fee for simplified model
      operatorId: 'GOUT01'
    }
  });
});

// Mock process payment endpoint
app.post('/api/payments/process', (req, res) => {
  const { ticketId, amount, paymentMethod } = req.body;
  
  if (!ticketId || !amount || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Return successful payment response
  res.json({
    success: true,
    payment: {
      id: Math.floor(Math.random() * 10000),
      ticketId,
      amount,
      paymentMethod,
      timestamp: new Date(),
      receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
      operatorId: 'GOUT01',
      // Add flag that this was a one-time payment
      isOneTimePayment: true,
      ticketType: 'STANDARD'
    },
    message: 'Payment processed successfully'
  });
});

// Mock recent exit transactions endpoint
app.get('/api/transactions/exit', (req, res) => {
  // Generate some mock transactions
  const mockTransactions = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    barcode: `TCK${Math.floor(Math.random() * 100000)}`,
    exitTime: new Date(Date.now() - (i * 15 * 60 * 1000)), // Each 15 minutes apart
    fee: Math.floor(Math.random() * 50000) + 5000,  // Random fee between 5000-55000
    vehicleType: ['CAR', 'MOTORCYCLE', 'TRUCK'][Math.floor(Math.random() * 3)],
    paymentMethod: ['CASH', 'CARD'][Math.floor(Math.random() * 2)],
    operatorId: 'GOUT01'
  }));
  
  res.json({
    success: true,
    transactions: mockTransactions
  });
});

// Mock parking sessions endpoint
app.get('/api/parking-sessions', (req, res) => {
  const mockSessions = Array.from({ length: 20 }, (_, i) => {
    const isActive = i < 12;
    const entryTime = new Date(Date.now() - (Math.floor(Math.random() * 12) + 1) * 60 * 60 * 1000);
    const exitTime = isActive ? null : new Date(entryTime.getTime() + (Math.floor(Math.random() * 4) + 1) * 60 * 60 * 1000);
    const randomPlateLetters = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const licensePlate = `B ${1000 + Math.floor(Math.random() * 9000)} ${randomPlateLetters}`;
    const vehicleType = ['CAR', 'MOTORCYCLE', 'TRUCK'][Math.floor(Math.random() * 3)];
    
    return {
      id: i + 1,
      licensePlate,
      vehicleType,
      entryTime,
      exitTime,
      entryGateId: Math.floor(Math.random() * 3) + 1,
      exitGateId: isActive ? null : Math.floor(Math.random() * 3) + 1,
      parkingAreaId: Math.floor(Math.random() * 2) + 1,
      status: isActive ? 'ACTIVE' : 'COMPLETED',
      durationMinutes: isActive ? Math.floor((Date.now() - entryTime.getTime()) / 60000) : Math.floor((exitTime.getTime() - entryTime.getTime()) / 60000),
      fee: isActive ? null : Math.floor(Math.random() * 50000) + 10000,
      vehicleImageUrl: `https://source.unsplash.com/random/300x200?${vehicleType.toLowerCase()}&sig=${i}`,
      barcodeImageUrl: `https://barcodeapi.org/api/code128/${licensePlate.replace(/\s/g, '')}`,
      captureTimestamp: entryTime
    };
  });
  
  res.json({
    data: mockSessions,
    total: mockSessions.length,
    page: 1,
    limit: 20
  });
});

// Mock tickets endpoint
app.get('/api/tickets', (req, res) => {
  const mockTickets = Array.from({ length: 15 }, (_, i) => {
    const createdAt = new Date(Date.now() - (Math.floor(Math.random() * 24) + 1) * 60 * 60 * 1000);
    const randomPlateLetters = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const isPaid = Math.random() > 0.3;
    
    return {
      id: i + 1,
      ticketNumber: `T${Date.now().toString().substring(7)}${i}`,
      licensePlate: `B ${1000 + Math.floor(Math.random() * 9000)} ${randomPlateLetters}`,
      vehicleType: ['CAR', 'MOTORCYCLE', 'TRUCK'][Math.floor(Math.random() * 3)],
      entryTime: createdAt,
      parkingAreaName: ['Main Parking Lot', 'VIP Parking'][Math.floor(Math.random() * 2)],
      status: isPaid ? 'PAID' : 'UNPAID',
      amount: Math.floor(Math.random() * 50000) + 10000,
      paymentMethod: isPaid ? ['CASH', 'CARD', 'E_WALLET'][Math.floor(Math.random() * 3)] : null,
      paymentTime: isPaid ? new Date(createdAt.getTime() + (Math.floor(Math.random() * 4) + 1) * 60 * 60 * 1000) : null,
      issuedBy: 'GOUT01'
    };
  });
  
  res.json({
    data: mockTickets,
    total: mockTickets.length,
    page: 1,
    limit: 15
  });
});

// Single ticket retrieval
app.get('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ticket ID'
    });
  }
  
  const createdAt = new Date(Date.now() - (Math.floor(Math.random() * 24) + 1) * 60 * 60 * 1000);
  const randomPlateLetters = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
  
  res.json({
    id,
    ticketNumber: `T${Date.now().toString().substring(7)}${id}`,
    licensePlate: `B ${1000 + Math.floor(Math.random() * 9000)} ${randomPlateLetters}`,
    vehicleType: ['CAR', 'MOTORCYCLE', 'TRUCK'][Math.floor(Math.random() * 3)],
    entryTime: createdAt,
    exitTime: new Date(createdAt.getTime() + (Math.floor(Math.random() * 4) + 1) * 60 * 60 * 1000),
    parkingAreaName: ['Main Parking Lot', 'VIP Parking'][Math.floor(Math.random() * 2)],
    status: 'PAID',
    amount: Math.floor(Math.random() * 50000) + 10000,
    paymentMethod: ['CASH', 'CARD', 'E_WALLET'][Math.floor(Math.random() * 3)],
    paymentTime: new Date(createdAt.getTime() + (Math.floor(Math.random() * 4) + 1) * 60 * 60 * 1000),
    issuedBy: 'GOUT01',
    notes: 'Regular ticket'
  });
});

// Parking rates endpoint
app.get('/api/parking-rates', (req, res) => {
  const parkingRates = [
    {
      id: 1,
      vehicleType: 'Car',
      baseRate: 5000,
      // Simplified model - only using baseRate and maxRate
      maxRate: 20000,
      isActive: true,
      description: 'Flat rate for cars - one-time payment',
      createdAt: new Date(2023, 1, 15),
      updatedAt: new Date()
    },
    {
      id: 2,
      vehicleType: 'Motorcycle',
      baseRate: 2000,
      // Simplified model - only using baseRate and maxRate
      maxRate: 8000,
      isActive: true,
      description: 'Flat rate for motorcycles - one-time payment',
      createdAt: new Date(2023, 1, 15),
      updatedAt: new Date()
    },
    {
      id: 3,
      vehicleType: 'Truck',
      baseRate: 10000,
      // Simplified model - only using baseRate and maxRate
      maxRate: 40000,
      isActive: true,
      description: 'Flat rate for trucks - one-time payment',
      createdAt: new Date(2023, 1, 15),
      updatedAt: new Date()
    },
    {
      id: 4,
      vehicleType: 'Bus',
      baseRate: 15000,
      // Simplified model - only using baseRate and maxRate
      maxRate: 60000,
      isActive: false,
      description: 'Flat rate for buses - one-time payment',
      createdAt: new Date(2023, 1, 15),
      updatedAt: new Date()
    }
  ];

  res.json(parkingRates);
});

// Memberships endpoint
app.get('/api/memberships', (req, res) => {
  const memberships = [
    {
      id: 1,
      customerName: 'Joko Widodo',
      customerId: 101,
      membershipType: 'Gold',
      vehiclePlate: 'B 1234 JKW',
      vehicleType: 'Car',
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2023, 11, 31),
      status: 'ACTIVE',
      discountRate: 20,
      membershipNumber: 'GOLD-2023-0001',
      createdAt: new Date(2022, 11, 15),
      updatedAt: new Date()
    },
    {
      id: 2,
      customerName: 'Prabowo Subianto',
      customerId: 102,
      membershipType: 'Platinum',
      vehiclePlate: 'B 5678 PRB',
      vehicleType: 'Car',
      startDate: new Date(2023, 0, 15),
      endDate: new Date(2024, 0, 14),
      status: 'ACTIVE',
      discountRate: 30,
      membershipNumber: 'PLAT-2023-0002',
      createdAt: new Date(2023, 0, 10),
      updatedAt: new Date()
    },
    {
      id: 3,
      customerName: 'Megawati Soekarnoputri',
      customerId: 103,
      membershipType: 'Silver',
      vehiclePlate: 'B 9012 MGW',
      vehicleType: 'Car',
      startDate: new Date(2023, 2, 1),
      endDate: new Date(2023, 9, 30),
      status: 'EXPIRED',
      discountRate: 10,
      membershipNumber: 'SILV-2023-0003',
      createdAt: new Date(2023, 1, 25),
      updatedAt: new Date()
    },
    {
      id: 4,
      customerName: 'Anies Baswedan',
      customerId: 104,
      membershipType: 'Regular',
      vehiclePlate: 'B 3456 ANS',
      vehicleType: 'Motorcycle',
      startDate: new Date(2023, 4, 1),
      endDate: new Date(2024, 3, 30),
      status: 'ACTIVE',
      discountRate: 5,
      membershipNumber: 'REG-2023-0004',
      createdAt: new Date(2023, 3, 28),
      updatedAt: new Date()
    },
    {
      id: 5,
      customerName: 'Ganjar Pranowo',
      customerId: 105,
      membershipType: 'Corporate',
      vehiclePlate: 'B 7890 GNJ',
      vehicleType: 'Car',
      startDate: new Date(2023, 5, 15),
      endDate: new Date(2024, 5, 14),
      status: 'ACTIVE',
      discountRate: 25,
      membershipNumber: 'CORP-2023-0005',
      createdAt: new Date(2023, 5, 10),
      updatedAt: new Date()
    },
    {
      id: 6,
      customerName: 'Ridwan Kamil',
      customerId: 106,
      membershipType: 'Gold',
      vehiclePlate: 'D 1234 RDW',
      vehicleType: 'Car',
      startDate: new Date(2023, 1, 1),
      endDate: new Date(2023, 7, 31),
      status: 'EXPIRED',
      discountRate: 20,
      membershipNumber: 'GOLD-2023-0006',
      createdAt: new Date(2023, 0, 25),
      updatedAt: new Date()
    }
  ];

  res.json(memberships);
});

// CRUD operations for parking rates
app.post('/api/parking-rates', (req, res) => {
  // Mock create operation
  const newRate = {
    id: 999,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  res.status(201).json(newRate);
});

app.put('/api/parking-rates/:id', (req, res) => {
  // Mock update operation
  const updatedRate = {
    id: parseInt(req.params.id),
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedRate);
});

app.delete('/api/parking-rates/:id', (req, res) => {
  // Mock delete operation
  res.status(204).send();
});

// CRUD operations for memberships
app.post('/api/memberships', (req, res) => {
  // Mock create operation
  const newMembership = {
    id: 999,
    ...req.body,
    membershipNumber: `${req.body.membershipType.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  res.status(201).json(newMembership);
});

app.put('/api/memberships/:id', (req, res) => {
  // Mock update operation
  const updatedMembership = {
    id: parseInt(req.params.id),
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedMembership);
});

app.delete('/api/memberships/:id', (req, res) => {
  // Mock delete operation
  res.status(204).send();
});

// Mock shifts endpoint
app.get('/api/shifts', (req, res) => {
  const shifts = Array.from({ length: 10 }, (_, i) => {
    const isActive = i < 5;
    const startTime = new Date(Date.now() - (Math.floor(Math.random() * 24) + 1) * 60 * 60 * 1000);
    const endTime = isActive ? null : new Date(startTime.getTime() + (Math.floor(Math.random() * 8) + 4) * 60 * 60 * 1000);
    
    return {
      id: i + 1,
      operatorId: Math.floor(Math.random() * 5) + 1,
      operatorName: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 'Michael Brown'][Math.floor(Math.random() * 5)],
      startTime,
      endTime,
      assignedGateId: Math.floor(Math.random() * 3) + 1,
      assignedGateName: ['Main Entrance Gate', 'Exit Gate', 'VIP Gate'][Math.floor(Math.random() * 3)],
      status: isActive ? 'ACTIVE' : (Math.random() > 0.7 ? 'CANCELLED' : 'COMPLETED'),
      totalTransactions: isActive ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 50) + 10,
      totalRevenue: isActive ? Math.floor(Math.random() * 1000000) : Math.floor(Math.random() * 2000000) + 500000,
      createdAt: new Date(startTime.getTime() - 1000 * 60 * 30),
      updatedAt: new Date()
    };
  });
  
  res.json({
    data: shifts,
    total: shifts.length,
    page: 1,
    limit: 10
  });
});

app.get('/api/shifts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shift ID'
    });
  }
  
  const startTime = new Date(Date.now() - (Math.floor(Math.random() * 24) + 1) * 60 * 60 * 1000);
  const isActive = Math.random() > 0.5;
  const endTime = isActive ? null : new Date(startTime.getTime() + (Math.floor(Math.random() * 8) + 4) * 60 * 60 * 1000);
  
  res.json({
    id,
    operatorId: Math.floor(Math.random() * 5) + 1,
    operatorName: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 'Michael Brown'][Math.floor(Math.random() * 5)],
    startTime,
    endTime,
    assignedGateId: Math.floor(Math.random() * 3) + 1,
    assignedGateName: ['Main Entrance Gate', 'Exit Gate', 'VIP Gate'][Math.floor(Math.random() * 3)],
    status: isActive ? 'ACTIVE' : (Math.random() > 0.7 ? 'CANCELLED' : 'COMPLETED'),
    totalTransactions: isActive ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 50) + 10,
    totalRevenue: isActive ? Math.floor(Math.random() * 1000000) : Math.floor(Math.random() * 2000000) + 500000,
    createdAt: new Date(startTime.getTime() - 1000 * 60 * 30),
    updatedAt: new Date()
  });
});

app.post('/api/shifts', (req, res) => {
  const newShift = {
    id: 999,
    ...req.body,
    status: 'ACTIVE',
    totalTransactions: 0,
    totalRevenue: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  res.status(201).json(newShift);
});

app.put('/api/shifts/:id', (req, res) => {
  const updatedShift = {
    id: parseInt(req.params.id),
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedShift);
});

app.post('/api/shifts/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shift ID'
    });
  }
  
  res.json({
    id,
    status: 'COMPLETED',
    endTime: new Date(),
    updatedAt: new Date()
  });
});

app.delete('/api/shifts/:id', (req, res) => {
  res.status(204).send();
});

// Settings endpoints
app.get('/api/settings/system', (req, res) => {
  res.json({
    id: 1,
    companyName: 'PT Parkir Jaya',
    companyLogo: 'https://via.placeholder.com/150',
    address: 'Jl. Gatot Subroto No. 123, Jakarta Selatan',
    contactPhone: '+62 21 555-7890',
    contactEmail: 'info@parkirjaya.com',
    taxId: '123.456.7-891.000',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    updatedAt: new Date()
  });
});

app.put('/api/settings/system', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.get('/api/settings/language', (req, res) => {
  res.json({
    id: 1,
    defaultLanguage: 'id',
    availableLanguages: ['id', 'en', 'zh', 'ja'],
    translations: {
      // Main navigation
      dashboard: {
        en: 'Dashboard',
        id: 'Dasbor',
        zh: '仪表板',
        ja: 'ダッシュボード'
      },
      
      // Parking Management
      parkingManagement: {
        en: 'Parking Management',
        id: 'Manajemen Parkir',
        zh: '停车管理',
        ja: '駐車場管理'
      },
      parkingSessions: {
        en: 'Parking Sessions',
        id: 'Sesi Parkir',
        zh: '停车会话',
        ja: '駐車セッション'
      },
      tickets: {
        en: 'Tickets',
        id: 'Tiket',
        zh: '票据',
        ja: 'チケット'
      },
      parkingAreas: {
        en: 'Parking Areas',
        id: 'Area Parkir',
        zh: '停车区域',
        ja: '駐車エリア'
      },
      parkingRates: {
        en: 'Parking Rates',
        id: 'Tarif Parkir',
        zh: '停车费率',
        ja: '駐車料金'
      },
      
      // Customer Management
      customerManagement: {
        en: 'Customer Management',
        id: 'Manajemen Pelanggan',
        zh: '客户管理',
        ja: '顧客管理'
      },
      vehicles: {
        en: 'Vehicles',
        id: 'Kendaraan',
        zh: '车辆',
        ja: '車両'
      },
      memberships: {
        en: 'Memberships',
        id: 'Keanggotaan',
        zh: '会员资格',
        ja: 'メンバーシップ'
      },
      payments: {
        en: 'Payments',
        id: 'Pembayaran',
        zh: '支付',
        ja: '支払い'
      },
      
      // System
      system: {
        en: 'System',
        id: 'Sistem',
        zh: '系统',
        ja: 'システム'
      },
      users: {
        en: 'Users',
        id: 'Pengguna',
        zh: '用户',
        ja: 'ユーザー'
      },
      devices: {
        en: 'Devices',
        id: 'Perangkat',
        zh: '设备',
        ja: 'デバイス'
      },
      gates: {
        en: 'Gates',
        id: 'Gerbang',
        zh: '闸门',
        ja: 'ゲート'
      },
      shifts: {
        en: 'Shifts',
        id: 'Shift',
        zh: '班次',
        ja: 'シフト'
      },
      reports: {
        en: 'Reports',
        id: 'Laporan',
        zh: '报告',
        ja: 'レポート'
      },
      
      // Settings
      settings: {
        en: 'Settings',
        id: 'Pengaturan',
        zh: '设置',
        ja: '設定'
      },
      language: {
        en: 'Language',
        id: 'Bahasa',
        zh: '语言',
        ja: '言語'
      },
      backup: {
        en: 'Backup',
        id: 'Cadangan',
        zh: '备份',
        ja: 'バックアップ'
      },
      systemSettings: {
        en: 'System',
        id: 'Sistem',
        zh: '系统',
        ja: 'システム'
      },
      
      // Other UI elements
      logout: {
        en: 'Logout',
        id: 'Keluar',
        zh: '登出',
        ja: 'ログアウト'
      },
      save: {
        en: 'Save',
        id: 'Simpan',
        zh: '保存',
        ja: '保存'
      },
      cancel: {
        en: 'Cancel',
        id: 'Batal',
        zh: '取消',
        ja: 'キャンセル'
      },
      edit: {
        en: 'Edit',
        id: 'Edit',
        zh: '编辑',
        ja: '編集'
      },
      delete: {
        en: 'Delete',
        id: 'Hapus',
        zh: '删除',
        ja: '削除'
      },
      add: {
        en: 'Add',
        id: 'Tambah',
        zh: '添加',
        ja: '追加'
      },
      parkingSystem: {
        en: 'Parking System',
        id: 'Sistem Parkir',
        zh: '停车系统',
        ja: '駐車システム'
      },
      
      // Parking Rates Page
      "parkingRates": {
        "en": "Parking Rates",
        "id": "Tarif Parkir",
        "zh": "停车费率",
        "ja": "駐車料金"
      },
      "configureRatesDescription": {
        "en": "Configure and manage parking rates and pricing structures.",
        "id": "Konfigurasikan dan kelola tarif parkir dan struktur harga.",
        "zh": "配置和管理停车费率和定价结构。",
        "ja": "駐車料金と価格体系を設定および管理します。"
      },
      "errorLoadingRates": {
        "en": "Error loading parking rates",
        "id": "Error memuat tarif parkir",
        "zh": "加载停车费率时出错",
        "ja": "駐車料金の読み込み中にエラーが発生しました"
      },
      "noRatesFound": {
        "en": "No parking rates found.",
        "id": "Tidak ditemukan tarif parkir.",
        "zh": "未找到停车费率。",
        "ja": "駐車料金が見つかりません。"
      },
      "vehicleType": {
        "en": "Vehicle Type",
        "id": "Jenis Kendaraan",
        "zh": "车辆类型",
        "ja": "車両タイプ"
      },
      "baseRate": {
        "en": "Base Rate",
        "id": "Tarif Dasar",
        "zh": "基本费率",
        "ja": "基本料金"
      },
      "hourlyRate": {
        "en": "Hourly Rate",
        "id": "Tarif Per Jam",
        "zh": "小时费率",
        "ja": "時間料金"
      },
      "maxDailyRate": {
        "en": "Max Daily Rate",
        "id": "Tarif Harian Maksimal",
        "zh": "最高日费率",
        "ja": "最大日料金"
      },
      "status": {
        "en": "Status",
        "id": "Status",
        "zh": "状态",
        "ja": "ステータス"
      },
      "actions": {
        "en": "Actions",
        "id": "Aksi",
        "zh": "操作",
        "ja": "アクション"
      },
      "active": {
        "en": "Active",
        "id": "Aktif",
        "zh": "活动",
        "ja": "アクティブ"
      },
      "inactive": {
        "en": "Inactive",
        "id": "Tidak Aktif",
        "zh": "非活动",
        "ja": "非アクティブ"
      },
      "hour": {
        "en": "hour",
        "id": "jam",
        "zh": "小时",
        "ja": "時間"
      },
      "day": {
        "en": "day",
        "id": "hari",
        "zh": "天",
        "ja": "日"
      },
      "addRate": {
        "en": "Add Rate",
        "id": "Tambah Tarif",
        "zh": "添加费率",
        "ja": "料金を追加"
      },
      "refresh": {
        "en": "Refresh",
        "id": "Perbarui",
        "zh": "刷新",
        "ja": "更新"
      },
      "editParkingRate": {
        "en": "Edit Parking Rate",
        "id": "Edit Tarif Parkir",
        "zh": "编辑停车费率",
        "ja": "駐車料金を編集"
      },
      "addNewParkingRate": {
        "en": "Add New Parking Rate",
        "id": "Tambah Tarif Parkir Baru",
        "zh": "添加新停车费率",
        "ja": "新しい駐車料金を追加"
      },
      "confirmDeleteRate": {
        "en": "Are you sure you want to delete this rate?",
        "id": "Apakah Anda yakin ingin menghapus tarif ini?",
        "zh": "您确定要删除此费率吗？",
        "ja": "この料金を削除してもよろしいですか？"
      },
      "create": {
        "en": "Create",
        "id": "Buat",
        "zh": "创建",
        "ja": "作成"
      },
      "update": {
        "en": "Update",
        "id": "Perbarui",
        "zh": "更新",
        "ja": "更新"
      },
      "parkingRateSaved": {
        "en": "Parking rate saved successfully",
        "id": "Tarif parkir berhasil disimpan",
        "zh": "停车费率保存成功",
        "ja": "駐車料金が正常に保存されました"
      },
      "errorSavingParkingRate": {
        "en": "Error saving parking rate",
        "id": "Gagal menyimpan tarif parkir",
        "zh": "保存停车费率时出错",
        "ja": "駐車料金の保存中にエラーが発生しました"
      },
      "parkingRateUpdated": {
        "en": "Parking rate updated successfully",
        "id": "Tarif parkir berhasil diperbarui",
        "zh": "停车费率更新成功",
        "ja": "駐車料金が正常に更新されました"
      },
      "errorUpdatingParkingRate": {
        "en": "Error updating parking rate",
        "id": "Gagal memperbarui tarif parkir",
        "zh": "更新停车费率时出错",
        "ja": "駐車料金の更新中にエラーが発生しました"
      },
      "parkingRateDeleted": {
        "en": "Parking rate deleted successfully",
        "id": "Tarif parkir berhasil dihapus",
        "zh": "停车费率删除成功",
        "ja": "駐車料金が正常に削除されました"
      },
      "errorDeletingParkingRate": {
        "en": "Error deleting parking rate",
        "id": "Gagal menghapus tarif parkir",
        "zh": "删除停车费率时出错",
        "ja": "駐車料金の削除中にエラーが発生しました"
      }
    },
    updatedAt: new Date()
  });
});

app.put('/api/settings/language', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.get('/api/settings/backup', (req, res) => {
  res.json({
    id: 1,
    autoBackup: true,
    backupFrequency: 'DAILY',
    backupTime: '02:00',
    backupLocation: '/backups',
    retentionPeriodDays: 30,
    lastBackupAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    nextBackupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  });
});

app.put('/api/settings/backup', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    nextBackupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.post('/api/settings/backup/trigger', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Backup completed successfully',
      timestamp: new Date()
    });
  }, 2000); // Simulate backup process taking 2 seconds
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock server is running on port ${PORT}`);
}); 