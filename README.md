# NodeTSpark - Parking Management System

A comprehensive parking management system built with Node.js, TypeScript, and React.

## Features

- 🚗 Vehicle entry and exit management
- 📸 Integration with Dahua cameras
- 🖨️ Thermal printer support for tickets
- 📱 Barcode scanner integration
- 💰 Payment processing
- 📊 Real-time dashboard
- 👥 User management
- 📝 Reporting system

## Hardware Requirements

- Thermal Printer (USB)
- Barcode Scanner (USB)
- Dahua IP Cameras
  - Entry Camera: 192.168.2.5
  - Exit Camera: 192.168.2.7
  - Server IP: 192.168.2.6

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- TypeScript
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/idiarso/NodeTSpark.git
cd NodeTSpark
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
npm run setup:db
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # React components
├── services/      # Business logic and hardware services
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── server/        # Backend server code
```

## Hardware Integration

### Printer Setup
- Connect thermal printer via USB
- Configure printer settings in `src/services/printer.ts`

### Camera Setup
- Configure camera IPs and credentials in `src/services/camera.ts`
- Default credentials:
  - Username: admin
  - Password: @dminparkir

### Barcode Scanner Setup
- Connect scanner via USB
- Configure COM port in `src/services/scanner.ts`

## Testing Hardware

Run the hardware test suite:
```bash
npm run test:hardware
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.