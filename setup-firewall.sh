#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root"
  exit
fi

# Enable UFW if not already enabled
ufw status | grep -q "Status: active" || {
    echo "Enabling UFW..."
    ufw enable
}

# Allow SSH (important to prevent lockout)
echo "Allowing SSH connections..."
ufw allow ssh

# Allow backend port
echo "Allowing backend port 3000..."
ufw allow 3000/tcp

# Allow frontend port
echo "Allowing frontend port 3001..."
ufw allow 3001/tcp

# Reload UFW
echo "Reloading UFW..."
ufw reload

# Show status
echo "Current UFW status:"
ufw status numbered

echo "Firewall configuration complete!"
echo "Make sure you can still access the server before closing this session." 