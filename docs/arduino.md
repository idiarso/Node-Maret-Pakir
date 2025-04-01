# Arduino Integration Guide

## Overview
This document describes how to integrate Arduino devices with the NodeTSpark parking management system. The system supports various Arduino-based devices for entry/exit gates, sensors, and display boards.

## Hardware Requirements

### Entry/Exit Gate Controller
- Arduino Uno/Nano
- RFID-RC522 Module
- Servo Motor (for gate control)
- LED Indicators (Red/Green)
- Buzzer
- Ethernet Shield or ESP8266/ESP32 for WiFi connectivity

### Parking Sensor
- Arduino Pro Mini
- Ultrasonic Sensor (HC-SR04)
- NRF24L01+ for wireless communication
- Power supply (battery or solar)

### Display Board
- Arduino Mega
- MAX7219 LED Matrix (4x)
- Ethernet Shield or ESP8266/ESP32
- Power supply

## Software Requirements

### Arduino IDE
- Version: 2.0 or higher
- Required Libraries:
  - RFID-RC522
  - Servo
  - Ethernet
  - NRF24L01+
  - MAX7219
  - ESP8266WiFi (if using ESP8266)
  - WiFiNINA (if using ESP32)

### NodeTSpark Client
- Version: 1.0.0 or higher
- Required Dependencies:
  - `serialport`
  - `node-rfid`
  - `node-nrf24`

## Installation Steps

### 1. Arduino Setup

1. Install Arduino IDE
2. Install required libraries through Library Manager
3. Configure board settings:
   - Select correct board type
   - Set correct port
   - Set upload speed to 115200

### 2. Client Setup

1. Install NodeTSpark client:
```bash
npm install nodetspark-client
```

2. Configure client settings:
```javascript
const client = new NodeTSparkClient({
    serverUrl: 'http://your-server:3000',
    deviceId: 'your-device-id',
    deviceType: 'GATE', // or 'SENSOR' or 'DISPLAY'
    apiKey: 'your-api-key'
});
```

3. Create start script (start.bat for Windows):
```batch
@echo off
cd /d %~dp0
node client.js
pause
```

## File Structure

### Required Files for Client
```
client/
├── config/
│   └── config.json
├── src/
│   ├── arduino/
│   │   ├── gate.ino
│   │   ├── sensor.ino
│   │   └── display.ino
│   ├── services/
│   │   ├── deviceService.js
│   │   └── communicationService.js
│   └── utils/
│       └── helpers.js
├── node_modules/
├── package.json
├── start.bat
└── client.js
```

### Files to Copy to Client Computer
1. `client/` directory
2. `node_modules/` directory
3. `package.json`
4. `start.bat`

## Device Communication

### Entry/Exit Gate
1. RFID Card Reading
2. Gate Control
3. Status LED Control
4. Buzzer Feedback

### Parking Sensor
1. Distance Measurement
2. Occupancy Detection
3. Wireless Communication
4. Battery Status Monitoring

### Display Board
1. Parking Status Display
2. Available Spots
3. Rate Information
4. Error Messages

## API Integration

### Device Registration
```javascript
await client.registerDevice({
    name: 'Main Entry Gate',
    type: 'GATE',
    location: 'Main Entrance',
    capabilities: ['RFID', 'GATE_CONTROL', 'LED', 'BUZZER']
});
```

### Health Check
```javascript
await client.updateHealthStatus({
    status: 'ACTIVE',
    battery: 85,
    signal: 90,
    lastMaintenance: new Date()
});
```

### Event Reporting
```javascript
await client.reportEvent({
    type: 'CARD_READ',
    data: {
        cardId: '123456789',
        timestamp: new Date(),
        status: 'SUCCESS'
    }
});
```

## Troubleshooting

### Common Issues
1. Connection Problems
   - Check network connectivity
   - Verify server URL
   - Check firewall settings

2. Device Recognition
   - Verify USB connection
   - Check COM port settings
   - Update device drivers

3. Communication Errors
   - Check API key
   - Verify device ID
   - Check server logs

### Debug Mode
Enable debug mode in config.json:
```json
{
    "debug": true,
    "logLevel": "DEBUG"
}
```

## Security Considerations

1. API Key Protection
   - Store in environment variables
   - Use secure storage
   - Regular key rotation

2. Device Authentication
   - Unique device IDs
   - Certificate-based auth
   - Regular re-authentication

3. Data Encryption
   - HTTPS communication
   - Encrypted storage
   - Secure updates

## Maintenance

### Regular Tasks
1. Check device health
2. Update firmware
3. Clean sensors
4. Test backup systems

### Backup Procedures
1. Save configuration
2. Export device data
3. Document changes
4. Test restore process

## Support

For technical support:
- Email: support@nodetspark.com
- Documentation: https://docs.nodetspark.com
- GitHub Issues: https://github.com/your-repo/issues 