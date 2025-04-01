#!/bin/bash

# Backup script for NodeTSpark
# This script performs database and configuration backups

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root"
    exit 1
fi

# Load environment variables
if [ -f /var/www/NodeTSpark/.env ]; then
    source /var/www/NodeTSpark/.env
else
    error "Environment file not found"
    exit 1
fi

# Set backup directory
BACKUP_DIR="/var/backups/parking-system"
mkdir -p "$BACKUP_DIR"

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        log "$1"
    else
        error "$2"
        exit 1
    fi
}

# Create timestamp for backup files
TIMESTAMP=$(date +'%Y%m%d_%H%M%S')

# Backup database
log "Starting database backup..."
pg_dump -U parking_user -d parking_system > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
check_status "Database backup completed" "Database backup failed"

# Compress database backup
gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
check_status "Database backup compressed" "Database backup compression failed"

# Backup configuration files
log "Starting configuration backup..."
tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
    /var/www/NodeTSpark/.env \
    /var/www/NodeTSpark/config \
    /etc/parking-system
check_status "Configuration backup completed" "Configuration backup failed"

# Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -delete
check_status "Old backups cleaned up" "Cleanup failed"

# Check backup directory size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_SIZE_NUM=$(du -s "$BACKUP_DIR" | cut -f1)
DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 90 ]; then
    warn "Backup directory disk usage is high: ${DISK_USAGE}%"
fi

log "Backup completed successfully"
log "Backup size: $BACKUP_SIZE"
log "Backup location: $BACKUP_DIR" 