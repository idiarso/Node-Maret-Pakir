#!/bin/bash

# Deployment script for NodeTSpark
# Usage: ./deploy.sh [environment]

# Default environment
ENVIRONMENT=${1:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Log function
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
if [ -f .env ]; then
    source .env
else
    error "Environment file not found"
    exit 1
fi

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        log "$1 successful"
    else
        error "$1 failed"
        exit 1
    fi
}

# Update system
log "Updating system..."
apt-get update
apt-get upgrade -y
check_status "System update"

# Install dependencies
log "Installing dependencies..."
apt-get install -y \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    cups \
    cups-client \
    git \
    curl \
    build-essential
check_status "Dependencies installation"

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    log "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    check_status "Node.js installation"
fi

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2
check_status "PM2 installation"

# Clone or update repository
if [ ! -d "NodeTSpark" ]; then
    log "Cloning repository..."
    git clone https://github.com/idiarso/NodeTSpark.git
    check_status "Repository clone"
else
    log "Updating repository..."
    cd NodeTSpark
    git pull origin main
    check_status "Repository update"
    cd ..
fi

# Install project dependencies
log "Installing project dependencies..."
cd NodeTSpark
npm install
check_status "Project dependencies installation"

# Build project
log "Building project..."
npm run build
check_status "Project build"

# Setup database
log "Setting up database..."
npm run setup:db
check_status "Database setup"

# Configure services
log "Configuring services..."

# Create systemd service files
cat > /etc/systemd/system/parking-system.service << EOL
[Unit]
Description=Parking System Server
After=network.target postgresql.service

[Service]
Type=simple
User=parking
WorkingDirectory=/var/www/NodeTSpark
ExecStart=/usr/bin/pm2 start dist/server/index.js --name parking-system
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

cat > /etc/systemd/system/parking-entry.service << EOL
[Unit]
Description=Parking Entry Point
After=network.target

[Service]
Type=simple
User=parking
WorkingDirectory=/var/www/NodeTSpark
ExecStart=/usr/bin/pm2 start dist/entry-point/entry-point.js --name parking-entry
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

cat > /etc/systemd/system/parking-exit.service << EOL
[Unit]
Description=Parking Exit Point
After=network.target

[Service]
Type=simple
User=parking
WorkingDirectory=/var/www/NodeTSpark
ExecStart=/usr/bin/pm2 start dist/exit-point/exit-point.js --name parking-exit
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Create parking user
if ! id "parking" &>/dev/null; then
    log "Creating parking user..."
    useradd -m -s /bin/bash parking
    check_status "User creation"
fi

# Set up application directory
log "Setting up application directory..."
mkdir -p /var/www
cp -r NodeTSpark /var/www/
chown -R parking:parking /var/www/NodeTSpark
check_status "Directory setup"

# Reload systemd
log "Reloading systemd..."
systemctl daemon-reload
check_status "Systemd reload"

# Start services
log "Starting services..."
systemctl enable parking-system
systemctl enable parking-entry
systemctl enable parking-exit

systemctl start parking-system
systemctl start parking-entry
systemctl start parking-exit
check_status "Service startup"

# Setup log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/parking-system << EOL
/var/log/parking-system/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 parking parking
}
EOL
check_status "Log rotation setup"

# Setup backup cron job
log "Setting up backup cron job..."
(crontab -l 2>/dev/null | grep -v "backup_script.sh"; echo "0 2 * * * /var/www/NodeTSpark/scripts/backup_script.sh") | crontab -
check_status "Backup cron setup"

log "Deployment completed successfully!"
log "Please check the logs at /var/log/parking-system/ for any issues." 