# Hardware Testing Documentation

## Overview

The hardware testing system provides comprehensive testing of all hardware components in the parking system. This document outlines the test procedures, requirements, and troubleshooting steps.

## Test Components

### 1. Camera System
- **Initialization Test**
  - Verifies camera connection
  - Checks camera properties (resolution, FPS)
  - Validates camera stream

- **Image Capture Test**
  - Tests different resolutions (1920x1080, 1280x720, 640x480)
  - Verifies image quality
  - Saves test images for verification

- **OCR Test**
  - Tests plate recognition accuracy
  - Verifies OCR performance in different conditions
  - Validates text extraction

### 2. Printer System
- **Initialization Test**
  - Verifies printer connection
  - Checks printer status
  - Validates printer settings

- **Print Test**
  - Tests different ticket formats
  - Verifies print quality
  - Checks barcode generation

- **Error Handling**
  - Tests printer offline scenarios
  - Verifies paper out detection
  - Checks error recovery

### 3. Gate Control System
- **Initialization Test**
  - Verifies gate controller connection
  - Checks gate status
  - Validates control signals

- **Operation Test**
  - Tests gate opening
  - Verifies gate closing
  - Checks safety interlocks

- **Error Handling**
  - Tests power failure scenarios
  - Verifies obstruction detection
  - Checks emergency stop functionality

### 4. Barcode Scanner
- **Initialization Test**
  - Verifies scanner connection
  - Checks scanner settings
  - Validates scanner response

- **Scan Test**
  - Tests different barcode formats
  - Verifies scan accuracy
  - Checks read distance

- **Error Handling**
  - Tests scanner timeout
  - Verifies error recovery
  - Checks invalid code handling

### 5. Trigger System
- **Initialization Test**
  - Verifies GPIO connection
  - Checks trigger settings
  - Validates debounce timing

- **Trigger Test**
  - Tests button press detection
  - Verifies debounce functionality
  - Checks multiple press handling

- **Error Handling**
  - Tests connection failure
  - Verifies error recovery
  - Checks false trigger prevention

### 6. Database System
- **Connection Test**
  - Verifies database connection
  - Checks connection pool
  - Validates credentials

- **Transaction Test**
  - Tests ticket creation
  - Verifies data retrieval
  - Checks update operations

- **Error Handling**
  - Tests connection failure
  - Verifies transaction rollback
  - Checks data integrity

### 7. System Integration
- **Entry Process Test**
  - Tests complete entry flow
  - Verifies component interaction
  - Checks data consistency

- **Exit Process Test**
  - Tests complete exit flow
  - Verifies payment processing
  - Checks gate control

- **Error Handling**
  - Tests component failure
  - Verifies system recovery
  - Checks data synchronization

## Test Execution

### Prerequisites
1. All hardware components connected
2. Database initialized
3. Environment variables configured
4. Test images prepared
5. Test barcodes available

### Running Tests
```bash
npm run test:hardware
```

### Test Output
- Detailed test results for each component
- Error messages and stack traces
- Test images and logs
- Performance metrics

## Troubleshooting

### Common Issues

1. Camera Issues
   - Check USB connection
   - Verify camera permissions
   - Check camera driver installation
   - Verify camera resolution settings

2. Printer Issues
   - Check serial connection
   - Verify printer power
   - Check paper supply
   - Verify printer settings

3. Gate Issues
   - Check power supply
   - Verify control signals
   - Check safety sensors
   - Verify gate alignment

4. Scanner Issues
   - Check USB connection
   - Verify scanner settings
   - Check barcode format
   - Verify scan distance

5. Trigger Issues
   - Check GPIO connection
   - Verify button wiring
   - Check debounce settings
   - Verify ground connection

6. Database Issues
   - Check network connection
   - Verify credentials
   - Check database status
   - Verify table structure

### Error Recovery

1. Hardware Errors
   - Power cycle affected components
   - Check physical connections
   - Verify component settings
   - Check for physical damage

2. Software Errors
   - Restart test application
   - Check log files
   - Verify configuration
   - Update drivers if needed

3. Database Errors
   - Check network connectivity
   - Verify database service
   - Check connection pool
   - Verify transaction logs

## Maintenance

### Regular Checks
1. Clean hardware components
2. Update firmware
3. Check connections
4. Verify settings
5. Test backup systems

### Performance Monitoring
1. Track test results
2. Monitor error rates
3. Measure response times
4. Check resource usage
5. Analyze failure patterns

## Support

For additional support:
1. Check the troubleshooting guide
2. Review error logs
3. Contact technical support
4. Check manufacturer documentation
5. Review system requirements 