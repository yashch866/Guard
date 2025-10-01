#!/bin/bash

echo "Setting up passwordless sudo for system reboot..."

# Add required sudoers entries for system reboot
echo "# Allow system reboot without password for user jetson
jetson ALL=(ALL) NOPASSWD: /usr/sbin/shutdown" | sudo EDITOR='tee -a' visudo

# Test the configuration
echo "Testing sudo access for shutdown..."
sudo -n shutdown --help >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Successfully configured passwordless sudo for system reboot"
    echo "The system reboot functionality should now work from the web interface"
else
    echo "Error: Failed to configure passwordless sudo"
    echo "Please run this script with sudo privileges"
    exit 1
fi