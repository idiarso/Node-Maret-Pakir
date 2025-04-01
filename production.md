# Production Deployment Guide

This guide provides detailed instructions for deploying and maintaining the NodeTSpark parking management system in a production environment.

## System Requirements

### Hardware Requirements
- Server:
  - CPU: Intel Core i5/AMD Ryzen 5 or better
  - RAM: 8GB minimum, 16GB recommended
  - Storage: 256GB SSD minimum
  - Network: Gigabit Ethernet
  - UPS: Recommended for power backup

- Entry Point:
  - CPU: Intel Core i3/AMD Ryzen 3 or better
  - RAM: 4GB minimum
  - Storage: 128GB SSD
  - Network: Gigabit Ethernet
  - Hardware:
    - Thermal Printer
    - Dahua Camera (192.168.2.5)
    - Gate Control System
    - LED Display

- Exit Point:
  - CPU: Intel Core i3/AMD Ryzen 3 or better
  - RAM: 4GB minimum
  - Storage: 128GB SSD
  - Network: Gigabit Ethernet
  - Hardware:
    - Thermal Printer
    - Dahua Camera (192.168.2.7)
    - Barcode Scanner
    - Payment Terminal
    - Gate Control System
    - LED Display

### Network Requirements
- Static IP addresses for all components
- VLAN configuration for hardware devices
- Firewall rules:
  ```
  Server (192.168.2.6):
  - Port 80/443: Web interface
  - Port 5432: PostgreSQL
  - Port 37777: Dahua camera access
  - Port 3000: Development API (if needed)

  Entry Point (192.168.2.5):
  - Port 37777: Camera access
  - Port 9100: Printer
  - Port COM3: Gate control

  Exit Point (192.168.2.7):
  - Port 37777: Camera access
  - Port 9100: Printer
  - Port COM3: Barcode scanner
  ```

## Deployment Steps

### 1. Server Setup

1. Install Node.js and PostgreSQL:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

2. Configure PostgreSQL:
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE parking_system;
CREATE USER parking_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE parking_system TO parking_user;
```

3. Clone and setup application:
```bash
git clone https://github.com/idiarso/NodeTSpark.git
cd NodeTSpark
npm install
npm run build
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with production settings
```

5. Initialize database:
```bash
npm run setup:db
```

### 2. Entry Point Setup

1. Install dependencies:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install printer drivers
sudo apt-get install cups cups-client
```

2. Configure hardware:
```bash
# Test printer
lpstat -p
# Add printer if needed
sudo lpadmin -p PARKING_PRINTER -v usb://printer/device/uri

# Test camera connection
ping 192.168.2.5
```

3. Start the application:
```bash
cd NodeTSpark
npm install
npm run build
npm run start:entry
```

### 3. Exit Point Setup

1. Install dependencies:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install printer drivers
sudo apt-get install cups cups-client
```

2. Configure hardware:
```bash
# Test printer
lpstat -p
# Add printer if needed
sudo lpadmin -p PARKING_PRINTER -v usb://printer/device/uri

# Test camera connection
ping 192.168.2.7

# Test barcode scanner
ls /dev/ttyUSB*
```

3. Start the application:
```bash
cd NodeTSpark
npm install
npm run build
npm run start:exit
```

## Monitoring and Maintenance

### Daily Tasks
1. Check system logs:
```bash
# Server logs
tail -f /var/log/parking-system/server.log

# Entry point logs
tail -f /var/log/parking-system/entry.log

# Exit point logs
tail -f /var/log/parking-system/exit.log
```

2. Monitor hardware status:
```bash
# Check printer status
lpstat -p

# Check camera connections
ping 192.168.2.5
ping 192.168.2.7

# Check database status
psql -U parking_user -d parking_system -c "SELECT COUNT(*) FROM tickets;"
```

### Weekly Tasks
1. Database backup:
```bash
pg_dump -U parking_user parking_system > backup_$(date +%Y%m%d).sql
```

2. System updates:
```bash
sudo apt-get update
sudo apt-get upgrade
```

3. Log rotation:
```bash
sudo logrotate /etc/logrotate.d/parking-system
```

### Monthly Tasks
1. Performance optimization:
```bash
# Analyze database
psql -U parking_user -d parking_system -c "ANALYZE;"

# Clean old logs
find /var/log/parking-system -name "*.log" -mtime +30 -delete
```

2. Security updates:
```bash
npm audit fix
```

## Troubleshooting

### Common Issues

1. Printer Not Working
```bash
# Check printer status
lpstat -p

# Check printer logs
tail -f /var/log/cups/error_log

# Restart CUPS service
sudo systemctl restart cups
```

2. Camera Connection Issues
```bash
# Check network connectivity
ping 192.168.2.5
ping 192.168.2.7

# Check camera service
sudo systemctl status dahua-camera
```

3. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -U parking_user -d parking_system -c "\conninfo"
```

### Emergency Procedures

1. System Failure
```bash
# Stop all services
sudo systemctl stop parking-system
sudo systemctl stop parking-entry
sudo systemctl stop parking-exit

# Backup current state
pg_dump -U parking_user parking_system > emergency_backup.sql

# Restart services
sudo systemctl start parking-system
sudo systemctl start parking-entry
sudo systemctl start parking-exit
```

2. Data Recovery
```bash
# Restore from backup
psql -U parking_user -d parking_system < backup_YYYYMMDD.sql
```

## Security Considerations

1. Network Security
- Use VLANs to isolate hardware devices
- Implement firewall rules
- Use HTTPS for all web traffic
- Regular security audits

2. Data Security
- Regular database backups
- Encrypted communication
- Secure password policies
- Access control and audit logs

3. Physical Security
- Secure server room access
- UPS backup
- Regular hardware maintenance
- CCTV monitoring

## Performance Optimization

1. Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_tickets_entry_time ON tickets(entry_time);
CREATE INDEX idx_tickets_plate_number ON tickets(plate_number);
CREATE INDEX idx_payments_ticket_id ON payments(ticket_id);
```

2. Application Optimization
- Enable caching
- Implement rate limiting
- Optimize database queries
- Regular performance monitoring

## Backup and Recovery

1. Database Backup Schedule
```bash
# Daily backup
0 2 * * * pg_dump -U parking_user parking_system > /backup/daily_backup_$(date +%Y%m%d).sql

# Weekly backup
0 3 * * 0 pg_dump -U parking_user parking_system > /backup/weekly_backup_$(date +%Y%m%d).sql
```

2. Configuration Backup
```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz /etc/parking-system/
```

## Support and Maintenance

1. Contact Information
- Technical Support: support@example.com
- Emergency Contact: emergency@example.com
- Hardware Support: hardware@example.com

2. Documentation
- System documentation: /docs/
- API documentation: /docs/api/
- Hardware documentation: /docs/hardware/

3. Regular Maintenance Schedule
- Daily: System checks and log review
- Weekly: Database backup and updates
- Monthly: Performance optimization and security updates
- Quarterly: Full system audit and maintenance 