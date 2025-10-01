from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import asyncio
import time
import os
import re
import shutil
import sys
from contextlib import asynccontextmanager
import platform
# import screen_brightness_control as sbc
# import alsaaudio
import socketio

# PyInstaller path handling
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS  # PyInstaller temp folder
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, BASE_DIR)

# Import local modules after path setup
from camera_status import check_camera_status
# Don't import voice_chat as separate app, we'll integrate it directly

# Context manager for lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting WiFi monitoring task...")
    monitor_task = asyncio.create_task(monitor_wifi_status())
    yield
    # Shutdown
    print("Stopping WiFi monitoring task...")
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

# --------------------------
# Setup: Socket.IO + FastAPI
# --------------------------

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*"  # Allow all origins for Electron app
)

fastapi_app = FastAPI(
    title="Jetson + Device API",
    root_path="",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Electron app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Final ASGI application
app = socketio.ASGIApp(sio, fastapi_app)

# --------------------------
# Models
# --------------------------

class ToggleRequest(BaseModel):
    state: str

class VoiceChatRequest(BaseModel):
    action: str  # 'start' or 'stop'

class VolumeRequest(BaseModel):
    volume: int

# --------------------------
# Audio
# --------------------------

def get_mixer():
    """Try to return an ALSA mixer object if python-alsaaudio is available.
    Raises ImportError if module is missing so callers can fallback.
    """
    import alsaaudio  # may raise ImportError
    try:
        return alsaaudio.Mixer('PCM', cardindex=0)
    except Exception:
        try:
            return alsaaudio.Mixer('Master', cardindex=0)
        except Exception:
            mixers = alsaaudio.mixers()
            if mixers:
                return alsaaudio.Mixer(mixers[0])
            raise Exception("No audio mixers found")


def amixer_try_controls() -> list[str]:
    return [
        "PCM",
        "Master",
        "Speaker",
        "Headphone",
        "Digital",
    ]


def amixer_get_volume() -> tuple[int | None, str | None]:
    """Return (volume_percent, control_used) using amixer if available."""
    if shutil.which("amixer") is None:
        return (None, None)
    percent_re = re.compile(r"(\d+)%")
    for control in amixer_try_controls():
        try:
            result = subprocess.run(
                ["amixer", "get", control],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                match = percent_re.search(result.stdout)
                if match:
                    return (int(match.group(1)), control)
        except Exception:
            continue
    return (None, None)


def amixer_set_volume(level: int) -> bool:
    if shutil.which("amixer") is None:
        return False
    for control in amixer_try_controls():
        try:
            result = subprocess.run(
                ["amixer", "set", control, f"{level}%"],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                return True
        except Exception:
            continue
    return False


def pactl_get_volume() -> tuple[int | None, str | None]:
    if shutil.which("pactl") is None:
        return (None, None)
    try:
        result = subprocess.run(
            ["pactl", "get-sink-volume", "@DEFAULT_SINK@"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            # Example: Volume: front-left: 32768 /  50% / -18.06 dB, ...
            m = re.search(r"(\d+)%", result.stdout)
            if m:
                return (int(m.group(1)), "pactl")
    except Exception:
        pass
    return (None, None)


def pactl_set_volume(level: int) -> bool:
    if shutil.which("pactl") is None:
        return False
    try:
        result = subprocess.run(
            ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0
    except Exception:
        return False


def wpctl_get_volume() -> tuple[int | None, str | None]:
    if shutil.which("wpctl") is None:
        return (None, None)
    try:
        # wpctl get-volume @DEFAULT_AUDIO_SINK@
        result = subprocess.run(
            ["wpctl", "get-volume", "@DEFAULT_AUDIO_SINK@"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            # Output like: Volume: 0.50 [50%]
            m = re.search(r"(\d+)%", result.stdout)
            if m:
                return (int(m.group(1)), "wpctl")
    except Exception:
        pass
    return (None, None)


def wpctl_set_volume(level: int) -> bool:
    if shutil.which("wpctl") is None:
        return False
    try:
        # wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.50
        vol_float = max(0.0, min(1.0, level / 100.0))
        result = subprocess.run(
            ["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", str(vol_float)],
            capture_output=True,
            text=True,
        )
        return result.returncode == 0
    except Exception:
        return False

@fastapi_app.get("/volume")
async def get_volume():
    try:
        # Prefer userland tools that exist in most desktops first
        vol, control = pactl_get_volume()
        if vol is None:
            vol, control = wpctl_get_volume()
        if vol is None:
            vol, control = amixer_get_volume()
        if vol is not None:
            return {
                "volume": int(vol),
                "mixer": control or "system",
                "card": "system",
            }

        # Last resort: python-alsaaudio if present
        try:
            mixer = get_mixer()
            try:
                volumes = mixer.getvolume()
            except AttributeError:
                volumes = [mixer.getvol()[0]]
            mixer_name = getattr(mixer, "mixer", lambda: "unknown")()
            card_name = getattr(mixer, "cardname", lambda: "unknown")()
            return {
                "volume": int(volumes[0]),
                "mixer": mixer_name,
                "card": card_name,
            }
        except ImportError:
            raise Exception("No audio control available (pactl/wpctl/amixer/alsaaudio missing)")
    except Exception as e:
        return {"error": str(e), "volume": 50}

@fastapi_app.post("/volume")
async def set_volume(request: VolumeRequest):
    try:
        volume = max(0, min(100, request.volume))
        # Prefer pactl/wpctl/amixer first
        if pactl_set_volume(volume) or wpctl_set_volume(volume) or amixer_set_volume(volume):
            return {"success": True, "volume": volume}
        # Last resort: python-alsaaudio if installed
        try:
            mixer = get_mixer()
            try:
                mixer.setvolume(volume)
            except AttributeError:
                mixer.setvol(volume)
            return {"success": True, "volume": volume}
        except ImportError:
            return {"success": False, "error": "No system volume tool available (pactl/wpctl/amixer/alsaaudio)"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# --------------------------
# Voice Chat
# --------------------------

# --------------------------
# Brightness
# --------------------------

@fastapi_app.post("/display/brightness/{level}")
def set_brightness(level: int):
    try:
        if not 0 <= level <= 100:
            return {"error": "Brightness must be 0-100"}
        
        # Try to import and use screen_brightness_control
        try:
            import screen_brightness_control as sbc
            sbc.set_brightness(level)
            return {"status": "success", "brightness": level}
        except ImportError:
            # Fallback: brightnessctl if available
            if shutil.which("brightnessctl"):
                result = subprocess.run([
                    "brightnessctl", "set", f"{level}%"
                ], capture_output=True, text=True)
                if result.returncode == 0:
                    return {"status": "success", "brightness": level}
                return {"status": "failed", "error": result.stderr or "brightnessctl failed"}
            return {"status": "failed", "error": "screen_brightness_control and brightnessctl not available"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

@fastapi_app.get("/display/brightness")
def get_brightness():
    try:
        # Try to import and use screen_brightness_control
        try:
            import screen_brightness_control as sbc
            current = sbc.get_brightness(display=0)[0]
            return {"brightness": current}
        except ImportError:
            # Fallback: brightnessctl if available
            if shutil.which("brightnessctl"):
                result = subprocess.run(["brightnessctl", "get"], capture_output=True, text=True)
                if result.returncode == 0:
                    # brightnessctl outputs current value and requires max to compute percent
                    cur = int(result.stdout.strip() or 0)
                    max_res = subprocess.run(["brightnessctl", "max"], capture_output=True, text=True)
                    max_v = int(max_res.stdout.strip() or 1)
                    percent = int(round(cur * 100 / max_v))
                    return {"brightness": percent}
            return {"brightness": 50, "error": "screen_brightness_control/brightnessctl not available"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

# --------------------------
# System Monitoring
# --------------------------

@fastapi_app.get("/system/camera")
async def camera_status():
    """Get the status of connected cameras."""
    return check_camera_status()

def get_temperatures():
    try:
        # We know exact zones for Jetson:
        # thermal_zone0 is cpu-thermal
        # thermal_zone1 is gpu-thermal
        cpu_temp = None
        gpu_temp = None
        
        # Read CPU temperature (thermal_zone0)
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                cpu_temp = round(int(f.read().strip()) / 1000.0, 1)
        except Exception as e:
            print(f"Error reading CPU temperature: {e}")
            
        # Read GPU temperature (thermal_zone1)
        try:
            with open('/sys/class/thermal/thermal_zone1/temp', 'r') as f:
                gpu_temp = round(int(f.read().strip()) / 1000.0, 1)
        except Exception as e:
            print(f"Error reading GPU temperature: {e}")
                
        return {
            "cpu": cpu_temp if cpu_temp is not None else 0.0,
            "gpu": gpu_temp if gpu_temp is not None else 0.0
        }
    except Exception as e:
        print(f"Error reading temperatures: {e}")
        return None

@fastapi_app.get("/system/temperature")
async def system_temperature():
    temps = get_temperatures()
    if not temps:
        raise HTTPException(status_code=500, detail="Could not read system temperatures")
    return temps

@fastapi_app.post("/system/reboot")
async def reboot_system():
    try:
        system = platform.system().lower()
        if system == "linux":
            subprocess.run(["sudo", "shutdown", "-r", "now"], check=True)
        elif system == "windows":
            subprocess.run(["shutdown", "/r", "/t", "0"], check=True)
        elif system == "darwin":  # macOS
            subprocess.run(["sudo", "shutdown", "-r", "now"], check=True)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operating system: {system}")
        return {"message": "System reboot initiated"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to reboot: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# --------------------------
# Wi-Fi
# --------------------------

class WifiConnectRequest(BaseModel):
    ssid: str
    password: str | None = None
    rememberNetwork: bool = True

@fastapi_app.get("/wifi/scan")
def wifi_scan():
    try:
        # Check WiFi status first
        status = wifi_status()
        if status["status"] == "off":
            return {"networks": [], "status": "off"}

        # Get network info including security
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SECURITY", "dev", "wifi", "list"],
            capture_output=True,
            text=True,
            check=True
        )
        
        networks = []
        current = current_wifi()
        # Get list of known/saved connections
        known_connections = set()
        try:
            known_result = subprocess.run([
                "nmcli", "-t", "-f", "NAME,TYPE", "connection", "show"
            ], capture_output=True, text=True, check=True)
            for line in known_result.stdout.strip().split('\n'):
                if line:
                    name, typ = line.split(":", 1)
                    if typ == "802-11-wireless":
                        known_connections.add(name)
        except Exception as e:
            print(f"Error getting known connections: {e}")
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split(":")
                if len(parts) >= 2:
                    ssid = parts[0].strip()
                    security = parts[1] if parts[1] else "--"
                    if ssid:  # skip empty SSID rows
                        network = {
                            "ssid": ssid,
                            "security": security,
                            "known": ssid in known_connections
                        }
                        # Mark if this is the current network
                        if current.get("connected") and current.get("ssid") == ssid:
                            network["connected"] = True
                        networks.append(network)
        return {"networks": networks, "status": "on"}
    except Exception as e:
        print(f"Scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to run commands with sudo (no password required)
def run_sudo_command(cmd):
    try:
        sudo_cmd = ["sudo", "-n"] + cmd  # -n flag for non-interactive mode
        process = subprocess.run(
            sudo_cmd,
            capture_output=True,
            text=True,
            check=True
        )
        return process.stdout
    except Exception as e:
        print(f"Failed to run sudo command: {e}")
        raise

def ensure_network_manager():
    """Ensure NetworkManager is running and responding"""
    try:
        # Check if NetworkManager is running
        nm_status = subprocess.run(
            ["systemctl", "is-active", "NetworkManager"],
            capture_output=True,
            text=True
        )
        
        if nm_status.stdout.strip() != "active":
            print("NetworkManager is not running, attempting to start...")
            subprocess.run(["sudo", "systemctl", "start", "NetworkManager"], check=True)
            time.sleep(2)  # Give it time to start
            
        # Verify NetworkManager is responding
        test_cmd = subprocess.run(
            ["nmcli", "general", "status"],
            capture_output=True,
            text=True
        )
        
        if test_cmd.returncode != 0:
            print("NetworkManager not responding, attempting to restart...")
            subprocess.run(["sudo", "systemctl", "restart", "NetworkManager"], check=True)
            time.sleep(3)  # Give it time to restart
            
        return True
    except Exception as e:
        print(f"Failed to ensure NetworkManager is running: {e}")
        return False

@fastapi_app.get("/wifi/connection")
def current_wifi():
    try:
        # First ensure NetworkManager is running
        if not ensure_network_manager():
            return {"connected": False, "ssid": None, "signal": None, "error": "NetworkManager not available"}
        
        # Get current WiFi status
        wifi_state = wifi_status()
        if wifi_state["status"] != "on":
            return {"connected": False, "ssid": None, "signal": None, "status": wifi_state["status"]}
        
        # Get all active connections with detailed info
        connection_result = subprocess.run(
            ["nmcli", "-t", "-f", "TYPE,NAME,DEVICE,STATE", "connection", "show", "--active"],
            capture_output=True,
            text=True
        )
        
        if connection_result.returncode != 0:
            print("Error getting active connections:", connection_result.stderr)
            return {"connected": False, "ssid": None, "signal": None, "error": "Failed to get connections"}
        
        wifi_connection = None
        wifi_device = None
        connection_state = None
        
        # Find active WiFi connection
        for line in connection_result.stdout.strip().split('\n'):
            if line:
                try:
                    parts = line.strip().split(':')
                    if len(parts) >= 4:
                        conn_type, name, device, state = parts[:4]
                        if (conn_type == "802-11-wireless" or device.startswith('wl')) and state == "activated":
                            wifi_connection = name
                            wifi_device = device
                            connection_state = state
                            break
                except (ValueError, IndexError):
                    continue
        
        if not wifi_connection:
            # No active WiFi connection found
            # Check if WiFi is enabled but not connected
            device_status = subprocess.run(
                ["nmcli", "device", "status"],
                capture_output=True,
                text=True
            )
            
            if device_status.returncode == 0:
                for line in device_status.stdout.split('\n'):
                    if 'wifi' in line.lower():
                        status_parts = line.split()
                        if len(status_parts) >= 3:
                            status = status_parts[2].lower()
                            if status == "disconnected":
                                return {
                                    "connected": False,
                                    "ssid": None,
                                    "status": "disconnected",
                                    "device": status_parts[0]
                                }
            return {"connected": False, "ssid": None}
        
        # Get detailed info about the current connection
        detail_result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY", "device", "wifi", "list"],
            capture_output=True,
            text=True
        )
        
        if detail_result.returncode == 0:
            current_details = None
            for line in detail_result.stdout.strip().split('\n'):
                fields = line.strip().split(':')
                if len(fields) >= 3 and fields[0] == wifi_connection:
                    current_details = {
                        "connected": True,
                        "ssid": fields[0],
                        "security": fields[2] if len(fields) > 2 else "--",
                        "device": wifi_device,
                        "state": connection_state
                    }
                    break
            
            if current_details:
                return current_details
        
        # Fallback if we couldn't get detailed info
        return {
            "connected": True,
            "ssid": wifi_connection,
            "security": "--",
            "device": wifi_device,
            "state": connection_state
        }
    except Exception as e:
        print(f"Error getting WiFi connection: {str(e)}")
        return {
            "connected": False,
            "ssid": None,
            "error": str(e)
        }

@fastapi_app.get("/wifi/status")
def wifi_status():
    try:
        # First check if NetworkManager is running
        nm_status = subprocess.run(
            ["systemctl", "is-active", "NetworkManager"],
            capture_output=True,
            text=True
        )
        
        if nm_status.stdout.strip() != "active":
            print("NetworkManager is not running, attempting to start...")
            try:
                run_sudo_command(["systemctl", "start", "NetworkManager"])
                time.sleep(2)  # Give it time to start
            except Exception as start_err:
                print(f"Failed to start NetworkManager: {start_err}")
                return {"status": "error", "reason": "NetworkManager failed to start"}
            try:
                # Try to start NetworkManager
                subprocess.run(["sudo", "systemctl", "start", "NetworkManager"], check=True)
                print("Started NetworkManager")
                # Give it a moment to initialize
                time.sleep(2)
            except Exception as nm_err:
                print(f"Failed to start NetworkManager: {nm_err}")
                return {"status": "error", "reason": "NetworkManager not running"}
                
        # Check if the wifi hardware is blocked
        rfkill = subprocess.run(
            ["rfkill", "list", "wifi"],
            capture_output=True,
            text=True
        )
        
        if "Soft blocked: yes" in rfkill.stdout:
            print("WiFi is soft blocked, attempting to unblock...")
            try:
                subprocess.run(["rfkill", "unblock", "wifi"], check=True)
                time.sleep(1)  # Give it a moment
            except Exception as unblock_err:
                print(f"Failed to unblock WiFi: {unblock_err}")
                return {"status": "off", "reason": "blocked"}
            
        # Then check nmcli status
        result = subprocess.run(
            ["nmcli", "radio", "wifi"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            status = result.stdout.strip().lower()
            if status != "enabled":
                print("WiFi radio is disabled, attempting to enable...")
                try:
                    subprocess.run(["nmcli", "radio", "wifi", "on"], check=True)
                    time.sleep(1)  # Give it a moment
                    return {"status": "on", "message": "WiFi radio enabled"}
                except Exception as radio_err:
                    print(f"Failed to enable WiFi radio: {radio_err}")
                    
            return {"status": "on" if status == "enabled" else "off"}
            
        # If nmcli command failed, check device status directly
        dev_status = subprocess.run(
            ["nmcli", "device", "status"],
            capture_output=True,
            text=True
        )
        
        if dev_status.returncode == 0:
            wifi_found = False
            for line in dev_status.stdout.split('\n'):
                if 'wifi' in line.lower():
                    wifi_found = True
                    if 'unavailable' in line.lower():
                        print("WiFi device is unavailable, checking hardware...")
                        # Try to bring up the WiFi interface
                        try:
                            interfaces = subprocess.run(
                                ["ip", "link", "show"],
                                capture_output=True,
                                text=True
                            )
                            for iface_line in interfaces.stdout.split('\n'):
                                if 'wlan' in iface_line.lower() or 'wifi' in iface_line.lower():
                                    iface_name = iface_line.split(':')[1].strip()
                                    subprocess.run(["sudo", "ip", "link", "set", iface_name, "up"], check=True)
                                    time.sleep(2)  # Give interface time to come up
                                    return {"status": "on", "message": f"Enabled interface {iface_name}"}
                        except Exception as iface_err:
                            print(f"Failed to bring up WiFi interface: {iface_err}")
                    else:
                        return {"status": "on"}
                        
            if not wifi_found:
                return {"status": "error", "reason": "No WiFi device found"}
                    
        return {"status": "off", "reason": "unavailable"}
        
    except Exception as e:
        print(f"Error checking WiFi status: {str(e)}")
        return {"status": "error", "reason": str(e)}

@fastapi_app.post("/wifi/toggle")
async def toggle_wifi(req: ToggleRequest):
    print(f"Received toggle request with state: {req.state}")
    
    if req.state not in ["on", "off"]:
        raise HTTPException(status_code=400, detail="Invalid state. Use 'on' or 'off'")

    try:
        if req.state == "off":
            # First, disconnect from any active WiFi connections
            try:
                current = current_wifi()
                if current.get("connected") and current.get("device"):
                    print(f"Disconnecting from current network on device {current['device']}")
                    subprocess.run(
                        ["sudo", "nmcli", "device", "disconnect", current["device"]],
                        capture_output=True,
                        text=True,
                        check=True
                    )
            except Exception as e:
                print(f"Warning: Error during disconnect: {e}")

            await asyncio.sleep(1)

                        # First, use rfkill to block WiFi at hardware level
            print("Blocking WiFi at hardware level...")
            try:
                run_sudo_command(["rfkill", "block", "wifi"])
                # Then disable WiFi in NetworkManager
                run_sudo_command(["nmcli", "radio", "wifi", "off"])
            except Exception as block_err:
                print(f"Error blocking WiFi: {block_err}")
                raise HTTPException(status_code=500, detail=f"Failed to block WiFi: {str(block_err)}")
            subprocess.run(
                ["sudo", "rfkill", "block", "wifi"],
                capture_output=True,
                text=True,
                check=True
            )

            # Then disable in NetworkManager
            print("Disabling NetworkManager WiFi...")
            subprocess.run(
                ["sudo", "nmcli", "radio", "wifi", "off"],
                capture_output=True,
                text=True,
                check=True
            )

        else:  # Turn WiFi on
            print("Enabling WiFi...")
            try:
                # First unblock WiFi at hardware level
                run_sudo_command(["rfkill", "unblock", "wifi"])
                await asyncio.sleep(1)
                
                # Then enable WiFi in NetworkManager
                run_sudo_command(["nmcli", "radio", "wifi", "on"])
                await asyncio.sleep(2)
                
                # Ensure WiFi device is managed by NetworkManager
                run_sudo_command(["nmcli", "device", "set", "wlan0", "managed", "yes"])
            except Exception as enable_err:
                print(f"Error enabling WiFi: {enable_err}")
                raise HTTPException(status_code=500, detail=f"Failed to enable WiFi: {str(enable_err)}")
            print("Unblocking WiFi at hardware level...")
            subprocess.run(
                ["sudo", "rfkill", "unblock", "wifi"],
                capture_output=True,
                text=True,
                check=True
            )

            await asyncio.sleep(1)

            # Then enable in NetworkManager
            print("Enabling WiFi in NetworkManager...")
            subprocess.run(
                ["sudo", "nmcli", "radio", "wifi", "on"],
                capture_output=True,
                text=True,
                check=True
            )

        print(f"WiFi {req.state} commands completed")
        
        # Wait for changes to take effect
        await asyncio.sleep(3)
        
        # Get the updated status
        status = wifi_status()
        current = None
        if status["status"] == "on":
            try:
                current = current_wifi()
            except Exception as e:
                print(f"Error getting current WiFi status: {e}")
        
        # Double-check if WiFi is really off when requested
        if req.state == "off" and status["status"] == "on":
            # Try one more time with more aggressive approach
            try:
                subprocess.run(["sudo", "rfkill", "block", "all"], check=True)
                subprocess.run(["sudo", "nmcli", "radio", "all", "off"], check=True)
                await asyncio.sleep(1)
                status = wifi_status()
            except Exception as e:
                print(f"Warning: Error during aggressive WiFi disable: {e}")

        # Notify all clients
        await sio.emit('wifi_state_change', {
            'status': status["status"],
            'current_network': current,
            'timestamp': time.time()
        })
        
        return {"status": status["status"]}
        
    except subprocess.CalledProcessError as e:
        error_msg = f"Failed to toggle WiFi: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Unexpected error while toggling WiFi: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@fastapi_app.post("/wifi/connect")
async def connect_wifi(req: WifiConnectRequest):
    try:
        # Check if we're currently connected to a network
        current = current_wifi()
        if current["connected"]:
            # If we're already connected to the requested network, return early
            if current["ssid"] == req.ssid:
                return {"status": "connected", "connection": current}
            
            # Disconnect from current network first
            try:
                disconnect_result = subprocess.run(
                    ["nmcli", "device", "disconnect", current["device"]],
                    capture_output=True,
                    text=True,
                    check=True
                )
                # Wait for disconnection
                await asyncio.sleep(2)
            except subprocess.CalledProcessError as e:
                print(f"Warning: Failed to disconnect from current network: {str(e)}")

        # Force a rescan of available networks
        try:
            subprocess.run(["nmcli", "device", "wifi", "rescan"], check=True)
            await asyncio.sleep(1)  # Give time for the scan to complete
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to rescan networks: {str(e)}")

        # Check if this is a known/saved network (no password required)
        known_result = subprocess.run([
            "nmcli", "-t", "-f", "NAME,TYPE", "connection", "show"
        ], capture_output=True, text=True)
        known_connections = set()
        for line in known_result.stdout.strip().split('\n'):
            if line:
                name, typ = line.split(":", 1)
                if typ == "802-11-wireless":
                    known_connections.add(name)

        if req.ssid in known_connections:
            # Just bring up the saved connection, no password needed
            cmd = ["nmcli", "connection", "up", req.ssid]
        elif req.password:
            if req.rememberNetwork:
                # Save the connection for auto-connect
                cmd = ["nmcli", "device", "wifi", "connect", req.ssid, 
                      "password", req.password, 
                      "private", "yes",  # Save only for this user
                      "hidden", "no"]
            else:
                # Connect without saving
                cmd = ["nmcli", "--ask", "device", "wifi", "connect", req.ssid,
                      "password", req.password]
        else:
            if req.rememberNetwork:
                cmd = ["nmcli", "device", "wifi", "connect", req.ssid,
                      "private", "yes",
                      "hidden", "no"]
            else:
                cmd = ["nmcli", "device", "wifi", "connect", req.ssid]

        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Failed to connect: {result.stderr}")
            
        # Wait for connection to establish
        await asyncio.sleep(3)
        
        # Get current connection status
        current = current_wifi()
        if current["connected"] and current["ssid"] == req.ssid:
            # Notify all clients about the new connection
            await sio.emit('wifi_state_change', {
                'status': "on",
                'current_network': current
            })
            return {"status": "connected", "connection": current}
        else:
            raise HTTPException(status_code=400, detail="Connection failed to establish")
            
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")
        
@fastapi_app.post("/wifi/disconnect")
async def disconnect_wifi():
    try:
        # Get current connection first
        current = current_wifi()
        if not current["connected"]:
            return {"status": "not_connected"}
            
        # Store device info for reconnection
        device = current.get("device")
        
        # Try to notify clients before disconnecting
        try:
            await sio.emit('wifi_state_change', {
                'status': "disconnecting",
                'current_network': None
            })
        except Exception as notify_err:
            print(f"Warning: Could not notify clients before disconnect: {notify_err}")
            
        # Disconnect from WiFi
        result = subprocess.run(
            ["nmcli", "device", "disconnect", device] if device else ["nmcli", "connection", "down", current["ssid"]],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Brief pause to let the disconnection take effect
        await asyncio.sleep(1)
        
        # Start monitoring connection status
        retry_count = 0
        max_retries = 3
        while retry_count < max_retries:
            try:
                # Check if actually disconnected
                current_check = current_wifi()
                if not current_check["connected"]:
                    return {"status": "disconnected"}
                    
                # If still connected, try again
                if retry_count < max_retries - 1:
                    print(f"Still connected after disconnect attempt {retry_count + 1}, retrying...")
                    subprocess.run(
                        ["nmcli", "device", "disconnect", device] if device else ["nmcli", "connection", "down", current["ssid"]],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    await asyncio.sleep(1)
                    
            except Exception as check_err:
                print(f"Error checking connection status: {check_err}")
                
            retry_count += 1
            
        raise HTTPException(
            status_code=500,
            detail="Failed to confirm disconnection after multiple attempts"
        )
            
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during disconnect: {str(e)}")



# --------------------------
# Voice Chat
# --------------------------
# Voice Chat Integration
# --------------------------

# Store voice chat connected clients
voice_connected_clients = set()
voice_connections = {}

@sio.event(namespace='/voice')
async def connect(sid, environ):
    """Handle voice chat client connection."""
    print(f"🔗 Voice chat client connected: {sid}")
    voice_connected_clients.add(sid)
    voice_connections[sid] = True  # Automatically enable voice for connected clients
    
    # Notify other clients
    await notify_voice_status_update()

@sio.event(namespace='/voice')
async def disconnect(sid):
    """Handle voice chat client disconnection."""
    print(f"❌ Voice chat client disconnected: {sid}")
    voice_connected_clients.discard(sid)
    voice_connections.pop(sid, None)
    
    # Notify other clients
    await notify_voice_status_update()

@sio.event(namespace='/voice')
async def voice_data(sid, data):
    """Handle incoming voice data and broadcast to other clients."""
    data_size = len(data) if data else 0
    print(f"🎤 RECEIVED voice data from {sid}, size: {data_size} bytes")
    
    # Broadcast to all other connected clients in the voice namespace
    forwarded_count = 0
    for client_sid in voice_connected_clients:
        if client_sid != sid:  # Don't send back to sender
            try:
                await sio.emit('voice_data', data, room=client_sid, namespace='/voice')
                forwarded_count += 1
                print(f"📤 Forwarded voice data to {client_sid}")
            except Exception as e:
                print(f"❌ Error forwarding voice data to {client_sid}: {e}")
    
    print(f"📊 Voice data forwarded to {forwarded_count} clients")

@sio.event(namespace='/voice')
async def start_voice(sid):
    """Handle client starting voice transmission."""
    print(f"🎙️ Client {sid} STARTED voice transmission")
    voice_connections[sid] = True
    await notify_voice_status_update()

@sio.event(namespace='/voice')
async def stop_voice(sid):
    """Handle client stopping voice transmission."""
    print(f"🛑 Client {sid} STOPPED voice transmission")
    voice_connections[sid] = False
    await notify_voice_status_update()

async def notify_voice_status_update():
    """Notify all voice clients about current connection status."""
    status = {
        'connected_clients': len(voice_connected_clients),
        'active_voice': sum(1 for v in voice_connections.values() if v)
    }
    await sio.emit('status_update', status, namespace='/voice')

# --------------------------

# Don't mount voice chat as separate app anymore
# fastapi_app.mount("/voice", voice_app)

@fastapi_app.get("/voice-chat/status")
async def voice_chat_status():
    """Check voice chat server status."""
    return {"status": "ok", "message": "Voice chat server is running"}

@fastapi_app.websocket("/ws/voice")
async def voice_websocket(websocket):
    """WebSocket endpoint for voice data."""
    await websocket.accept()
    
    # Add this connection to the voice namespace
    sid = str(id(websocket))  # Use object id as session id
    voice_connected_clients.add(sid)
    
    try:
        while True:
            # Receive voice data from this client
            data = await websocket.receive_bytes()
            
            # Broadcast to other clients via Socket.IO
            await sio.emit('voice_data', data, namespace='/voice')
            
            # Also broadcast to other WebSocket clients if any
            # (This would need a registry of WebSocket connections)
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        voice_connected_clients.discard(sid)
        await websocket.close()

# --------------------------
# Socket.IO
# --------------------------

# Store connected clients
connected_clients = set()

# Background task to monitor WiFi status
async def monitor_wifi_status():
    previous_status = None
    previous_connection = None
    consecutive_errors = 0
    max_consecutive_errors = 3
    
    while True:
        try:
            # Always force a NetworkManager check
            ensure_network_manager()
            
            wifi_state = wifi_status()
            current = None
            
            # Always try to get current connection info, even if status appears off
            try:
                current = current_wifi()
            except Exception as conn_err:
                print(f"Error getting current connection: {conn_err}")
                
            # More comprehensive status change detection
            status_changed = (
                previous_status != wifi_state["status"] or
                previous_connection is None or current is None or
                (current is not None and previous_connection is not None and
                 (current.get("connected") != previous_connection.get("connected") or
                  current.get("ssid") != previous_connection.get("ssid") or
                  current.get("signal") != previous_connection.get("signal") or
                  current.get("error") != previous_connection.get("error")))
            )
            
            if status_changed or consecutive_errors >= max_consecutive_errors:
                print(f"WiFi status changed: {wifi_state['status']}, Connection: {current}")
                
                # Broadcast to all connected clients
                if len(connected_clients) > 0:
                    await sio.emit('wifi_state_change', {
                        'status': wifi_state["status"],
                        'current_network': current,
                        'timestamp': time.time()
                    })
                
                previous_status = wifi_state["status"]
                previous_connection = current
                consecutive_errors = 0  # Reset error counter on successful update
                
        except Exception as e:
            consecutive_errors += 1
            print(f"Error in WiFi monitor (attempt {consecutive_errors}): {e}")
            
            if consecutive_errors >= max_consecutive_errors:
                # After several errors, notify clients of the problem
                if len(connected_clients) > 0:
                    await sio.emit('wifi_state_change', {
                        'status': 'error',
                        'current_network': {
                            'connected': False,
                            'ssid': None,
                            'signal': None,
                            'error': f"System error: {str(e)}"
                        },
                        'timestamp': time.time()
                    })
                
                # Wait longer between retries after repeated errors
                await asyncio.sleep(5)
            
        # Adaptive sleep: shorter interval if there are clients connected
        await asyncio.sleep(1 if connected_clients else 3)

@sio.event
async def connect(sid, environ):
    print(f"Socket.IO client connected: {sid}")
    connected_clients.add(sid)
    try:
        # Ensure NetworkManager is running
        ensure_network_manager()
        
        # Get current WiFi status
        wifi_state = wifi_status()
        current = None
        
        # Always try to get current connection info
        try:
            current = current_wifi()
        except Exception as conn_err:
            print(f"Error getting initial connection state: {conn_err}")
            current = {
                'connected': False,
                'ssid': None,
                'signal': None,
                'error': str(conn_err)
            }
            
        # Send initial state to the new client
        await sio.emit('wifi_state_change', {
            'status': wifi_state["status"],
            'current_network': current,
            'timestamp': time.time()
        }, to=sid)
        
        print(f"Sent initial state to {sid}: {wifi_state['status']}, {current}")
        
    except Exception as e:
        print(f"Error sending initial states to {sid}: {e}")
        # Send error state to client
        await sio.emit('wifi_state_change', {
            'status': 'error',
            'current_network': {
                'connected': False,
                'ssid': None,
                'signal': None,
                'error': f"System error: {str(e)}"
            },
            'timestamp': time.time()
        }, to=sid)

@sio.event
async def disconnect(sid):
    print(f"Socket.IO client disconnected: {sid}")
    connected_clients.discard(sid)  # Remove from connected clients set

# --------------------------
# CLI Entry Point
# --------------------------

if __name__ == "__main__":
    import argparse
    import uvicorn
    import json
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Guard Controls Backend Server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind the server to (0.0.0.0 for all interfaces)')
    args = parser.parse_args()
    
    print(f"Starting Guard Controls Backend Server on {args.host}:{args.port}")
    
    # Write config file for frontend to discover backend port
    config_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend-config.json')
    backend_config = {
        'host': args.host,
        'port': args.port,
        'apiUrl': f'http://{args.host}:{args.port}',
        'timestamp': time.time()
    }
    
    try:
        with open(config_file_path, 'w') as f:
            json.dump(backend_config, f, indent=2)
        print(f"Backend config written to: {config_file_path}")
    except Exception as e:
        print(f"Warning: Could not write backend config: {e}")
    
    # Run the FastAPI app using uvicorn
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )
