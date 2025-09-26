"""Camera status checker for Jetson."""
import subprocess
import socket
import json
import re
from fastapi import HTTPException

# Camera configuration
CAMERA_MAC = "BC:29:78:41:90:1C"
CAMERA_INTERFACE = "enP8p1s0"
CAMERA_PORTS = [80, 554, 8080, 9000]  # Common camera ports

def get_camera_ip() -> str:
    """Get camera IP from ARP table using MAC address."""
    try:
        result = subprocess.run(
            ["arp", "-n"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                if CAMERA_MAC.lower() in line.lower():
                    ip = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                    if ip:
                        return ip.group(1)
    except Exception as e:
        print(f"Error getting camera IP: {e}")
    return None

def check_interface_status(interface: str) -> dict:
    """Check the ethernet interface status."""
    try:
        result = subprocess.run(
            ["ip", "link", "show", interface],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            output = result.stdout.lower()
            return {
                "up": "state up" in output,
                "status": "up" if "state up" in output else "down",
                "info": result.stdout.strip()
            }
    except Exception as e:
        print(f"Error checking interface: {e}")
    return {"up": False, "status": "error", "info": "Failed to check interface"}

def check_link_status():
    """Check ethernet link status using ethtool."""
    try:
        result = subprocess.run(
            ["ethtool", CAMERA_INTERFACE],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            if "Link detected: yes" in result.stdout:
                speed = re.search(r'Speed: (\d+\w+)', result.stdout)
                duplex = re.search(r'Duplex: (\w+)', result.stdout)
                return {
                    "linked": True,
                    "speed": speed.group(1) if speed else "unknown",
                    "duplex": duplex.group(1) if duplex else "unknown"
                }
    except Exception as e:
        print(f"Error checking link status: {e}")
    return {"linked": False, "speed": "unknown", "duplex": "unknown"}

def check_camera_status():
    """Check if network camera is connected and responding."""
    try:
        print("Checking camera status...")
        
        # First check interface status
        interface_status = check_interface_status(CAMERA_INTERFACE)
        if not interface_status["up"]:
            return {
                "connected": False,
                "status": "Network interface down",
                "devices": [{
                    "device": CAMERA_INTERFACE,
                    "active": False,
                    "info": f"Interface status: {interface_status['status']}"
                }]
            }

        # Get link status
        link_status = check_link_status()
        
        # Get camera IP
        camera_ip = get_camera_ip()
        if not camera_ip:
            return {
                "connected": interface_status["up"] and link_status["linked"],
                "status": "Camera detected but no IP",
                "devices": [{
                    "device": f"MAC: {CAMERA_MAC}",
                    "active": False,
                    "info": (
                        f"Interface: {CAMERA_INTERFACE} ({interface_status['status']}), "
                        f"Link: {link_status['speed']} {link_status['duplex']}"
                    )
                }]
            }

        # Check ports
        active_ports = []
        for port in CAMERA_PORTS:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                if sock.connect_ex((camera_ip, port)) == 0:
                    active_ports.append(port)
            except:
                pass
            finally:
                sock.close()

        # Build status information
        is_active = len(active_ports) > 0
        status_info = (
            f"IP: {camera_ip}, "
            f"Interface: {CAMERA_INTERFACE} ({interface_status['status']}), "
            f"Link: {link_status['speed']} {link_status['duplex']}, "
            f"Active ports: {', '.join(map(str, active_ports)) if active_ports else 'none'}"
        )

        return {
            "connected": True,
            "status": "Active" if is_active else "Connected but not responding",
            "devices": [{
                "device": f"Camera {CAMERA_MAC}",
                "active": is_active,
                "info": status_info
            }]
        }
        
    except Exception as e:
        print(f"Error in check_camera_status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check camera status: {str(e)}"
        )