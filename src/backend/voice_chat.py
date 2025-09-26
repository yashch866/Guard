"""
WebSocket handlers for voice chat functionality.
"""
import asyncio
from typing import Dict, Set
import socketio

# Initialize Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=['*'])

# Store connected clients
connected_clients: Set[str] = set()
# Store active voice connections
voice_connections: Dict[str, bool] = {}

@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    print(f"Voice chat client connected: {sid}")
    connected_clients.add(sid)
    voice_connections[sid] = True  # Automatically enable voice for connected clients
    
    # Notify other clients
    await notify_status_update()

@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    print(f"Voice chat client disconnected: {sid}")
    connected_clients.discard(sid)
    voice_connections.pop(sid, None)
    
    # Notify other clients
    await notify_status_update()

@sio.event
async def voice_data(sid, data):
    """Handle incoming voice data and broadcast to other clients."""
    # Always allow voice data transmission from connected clients
    data_size = len(data) if data else 0
    print(f"🎤 RECEIVED voice data from {sid}, size: {data_size} bytes")
    
    # Broadcast to all other connected clients
    forwarded_count = 0
    for client_sid in connected_clients:
        if client_sid != sid:  # Don't send back to sender
            try:
                await sio.emit('voice_data', data, room=client_sid)
                forwarded_count += 1
                print(f"📤 Forwarded voice data to {client_sid}")
            except Exception as e:
                print(f"❌ Error forwarding voice data to {client_sid}: {e}")
    
    print(f"📊 Voice data forwarded to {forwarded_count} clients")

@sio.event
async def start_voice(sid):
    """Handle client starting voice transmission."""
    print(f"🎙️ Client {sid} STARTED voice transmission")
    voice_connections[sid] = True
    await notify_status_update()

@sio.event
async def stop_voice(sid):
    """Handle client stopping voice transmission."""
    print(f"🛑 Client {sid} STOPPED voice transmission")
    voice_connections[sid] = False
    await notify_status_update()

async def notify_status_update():
    """Notify all clients about current connection status."""
    status = {
        'connected_clients': len(connected_clients),
        'active_voice': sum(1 for v in voice_connections.values() if v)
    }
    await sio.emit('status_update', status)

# Create ASGI app
app = socketio.ASGIApp(sio)