#!/bin/bash

# Add required sudoers entries
echo "# Allow WiFi control commands without password for user jetson
jetson ALL=(ALL) NOPASSWD: /usr/bin/nmcli
jetson ALL=(ALL) NOPASSWD: /usr/sbin/rfkill
jetson ALL=(ALL) NOPASSWD: /usr/sbin/ip link set *" | sudo EDITOR='tee -a' visudo

# Make wifi_control.sh executable
chmod +x ./src/backend/wifi_control.sh

# Test the configuration
echo "Testing sudo access for nmcli..."
sudo -n nmcli general status
if [ $? -eq 0 ]; then
    echo "Successfully configured passwordless sudo for WiFi commands"
else
    echo "Error: Failed to configure passwordless sudo"
    exit 1
fi