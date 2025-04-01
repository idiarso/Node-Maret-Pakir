# NodeTSpark Parking Management System

A comprehensive parking management system with Arduino integration for ticket scanning and gate control.

## Features

### Core Features
- Ticket scanning and validation
- Gate control with servo motor
- Real-time status monitoring
- Error handling and recovery
- Health checks and diagnostics
- Test mode for development
- Voltage monitoring
- Memory management
- Crash reporting

### Arduino Integration
- Barcode scanner support
- Gate control with servo motor
- LED and buzzer feedback
- Test mode for hardware diagnostics
- Configuration via EEPROM
- Health monitoring system
- Voltage sensor integration
- Memory usage tracking
- Automatic retry mechanism

### Server Features
- RESTful API endpoints
- Real-time status updates
- Error logging and monitoring
- Configuration management
- Health check reporting
- Crash report collection
- Log rotation
- Performance metrics

## Hardware Requirements

### Arduino Components
- Arduino Uno or compatible board
- Barcode scanner (compatible with SoftwareSerial)
- Servo motor for gate control
- LED for status indication
- Buzzer for audio feedback
- Push button for trigger
- Test mode switch (optional)
- Voltage sensor (optional)

### Wiring Diagram
```
Arduino Pin | Component
-----------|-----------
2          | Push Button (with pull-up)
3          | Buzzer
4          | Status LED
5          | Servo Motor
10         | Barcode Scanner RX
11         | Barcode Scanner TX
12         | Test Mode Switch (optional)
A0         | Voltage Sensor (optional)
```

## Software Requirements

- Node.js 14.x or higher
- Arduino IDE
- PostgreSQL database
- Windows 10 or higher (for batch scripts)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nodetspark.git
cd nodetspark
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
SERVER_URL=http://localhost:3000
ARDUINO_PORT=COM3
DEBUG=true
LOG_LEVEL=INFO
GATE_OPEN_TIME=5
BUZZER_VOLUME=128
TEST_MODE=false
DEBUG_MODE=false
HEALTH_CHECK_INTERVAL=300000
SCANNER_TIMEOUT=5000
GATE_TIMEOUT=10000
VOLTAGE_THRESHOLD=4.5
AUTO_RETRY=true
MAX_RETRIES=3
LOG_ROTATION_SIZE=10485760
LOG_ROTATION_COUNT=5
ENABLE_CRASH_REPORTING=true
CRASH_REPORT_URL=http://localhost:3000/api/crashes
```

4. Upload Arduino sketch:
- Open `src/arduino/ticket_scanner.ino` in Arduino IDE
- Select your board and port
- Upload the sketch

## Usage

### Starting the Application

1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend && npm run dev
```

3. Start the Arduino client:
```bash
start_arduino.bat
```

### Test Mode

To enter test mode:
1. Press the test mode switch (if connected)
2. The LED will blink to indicate test mode
3. Press the main button to cycle through test functions:
   - LED test
   - Buzzer test
   - Gate test
   - Scanner test
   - Voltage sensor test
   - Memory test
   - Communication test

### Configuration

The Arduino configuration can be updated through the server API:
```bash
curl -X POST http://localhost:3000/api/devices/config \
  -H "Content-Type: application/json" \
  -d '{
    "gateOpenTime": 5,
    "buzzerVolume": 128,
    "testMode": false,
    "debugMode": false,
    "scannerTimeout": 5000,
    "gateTimeout": 10000,
    "voltageThreshold": 4.5,
    "autoRetry": true,
    "maxRetries": 3
  }'
```

## Error Handling

The system includes comprehensive error handling:

### Arduino Errors
- SCANNER_ERROR: Barcode scanner malfunction
- GATE_ERROR: Gate servo motor issues
- COMMUNICATION_ERROR: Serial communication problems
- CONFIG_ERROR: Configuration issues
- VOLTAGE_ERROR: Low voltage detected
- TIMEOUT_ERROR: Operation timeout
- HARDWARE_ERROR: Hardware malfunction
- MEMORY_ERROR: Memory allocation issues

### Error Recovery
- Automatic retry mechanism
- Critical error detection
- Status reporting to server
- Visual and audio feedback
- Component reset on failure
- Error logging and tracking

## Health Monitoring

The system performs periodic health checks:
- Device connectivity
- Scanner functionality
- Gate operation
- Communication status
- Voltage levels
- Memory usage
- System uptime

Health status is reported every 5 minutes (configurable via HEALTH_CHECK_INTERVAL).

## Development

### Adding New Features
1. Update the Arduino sketch in `src/arduino/ticket_scanner.ino`
2. Modify the Node.js client in `src/client/arduino_client.js`
3. Update the server API endpoints
4. Add frontend components as needed

### Testing
1. Use test mode for hardware diagnostics
2. Run unit tests: `npm test`
3. Check logs in `logs/arduino_client.log`
4. Monitor crash reports in `logs/crashes/`

## Troubleshooting

### Common Issues
1. Arduino not detected
   - Check COM port in .env file
   - Verify USB connection
   - Check device manager

2. Scanner not working
   - Verify wiring
   - Check scanner power
   - Test in test mode
   - Check timeout settings

3. Gate not responding
   - Check servo connections
   - Verify power supply
   - Test in test mode
   - Check timeout settings

4. Voltage issues
   - Verify voltage sensor connection
   - Check power supply
   - Adjust voltage threshold
   - Monitor voltage readings

5. Memory problems
   - Check memory usage
   - Monitor for memory leaks
   - Adjust buffer sizes
   - Enable debug mode

### Logs
- Application logs: `logs/arduino_client.log`
- Server logs: `logs/server.log`
- Frontend logs: Browser console
- Crash reports: `logs/crashes/`

## Security Considerations

1. API Authentication
   - All endpoints require authentication
   - JWT tokens for secure communication
   - Rate limiting
   - Input validation

2. Device Security
   - Encrypted communication
   - Access control for configuration
   - Error logging for security events
   - Secure firmware updates

3. Data Protection
   - Secure storage of credentials
   - Regular backup of configuration
   - Audit logging
   - Data encryption

## Maintenance

### Regular Tasks
1. Check error logs daily
2. Verify health status reports
3. Test gate operation weekly
4. Clean scanner optics monthly
5. Backup configuration regularly
6. Monitor voltage levels
7. Check memory usage
8. Review crash reports

### Updates
1. Check for firmware updates
2. Update dependencies regularly
3. Review security patches
4. Test after updates
5. Backup before updates
6. Monitor system after updates

## Performance Optimization

1. Memory Management
   - Buffer optimization
   - Memory leak prevention
   - Garbage collection
   - Resource cleanup

2. Communication
   - Serial buffer management
   - Network optimization
   - Data compression
   - Batch processing

3. Hardware
   - Power management
   - Component calibration
   - Timing optimization
   - Resource sharing

## Support

For support:
1. Check the documentation
2. Review error logs
3. Contact system administrator
4. Submit issue on GitHub
5. Check crash reports
6. Monitor health status
7. Review performance metrics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.