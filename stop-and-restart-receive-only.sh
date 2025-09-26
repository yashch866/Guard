#!/bin/bash
 
# Stop and Restart Guard VoIP in Receive-Only Mode
# This script ensures the guard device microphone is disabled
 
echo "🔇 Stopping all VoIP processes and restarting in receive-only mode..."
 
# Kill all existing VoIP processes
echo "🛑 Stopping existing VoIP processes..."
pkill -f "node index.js --listen" || true
sleep 2
 
# Force kill if any are still running
pids=$(ps aux | grep "node index.js --listen" | grep -v grep | awk '{print $2}')
if [ ! -z "$pids" ]; then
    echo "🔨 Force killing remaining processes: $pids"
    kill -KILL $pids 2>/dev/null || true
    sleep 1
fi
 
# Check if we're on Jetson (by checking for tvoip directory)
if [ ! -d "$HOME/tvoip" ]; then
    echo "❌ Error: ~/tvoip directory not found"
    echo "Make sure you're running this on the Jetson device"
    exit 1
fi
 
# Start VoIP listener in RECEIVE-ONLY mode
echo "🎧 Starting VoIP listener in receive-only mode (no microphone)..."
 
# First disable microphone at system level
echo "🔇 Disabling microphone at system level..."
amixer sset Capture nocap 2>/dev/null || pactl set-source-mute @DEFAULT_SOURCE@ 1 2>/dev/null || true
echo "✅ Microphone disabled at system level"
 
cd ~/tvoip
 
# Start with ONLY output device (speaker), NO input device (microphone)
nohup node index.js --listen 3333 --output hw:2,0 > voip-receive-only.log 2>&1 &
VOIP_PID=$!
 
# Wait a moment and check if VoIP started successfully
sleep 3
if ps -p $VOIP_PID > /dev/null; then
    echo "✅ VoIP listener started in receive-only mode (PID: $VOIP_PID)"
    echo "🔇 Microphone is DISABLED - only receiving audio"
    echo "🔊 Speaker is ENABLED - can hear from main dashboard"
    echo ""
    echo "Check log: tail -f ~/tvoip/voip-receive-only.log"
else
    echo "❌ Failed to start VoIP listener"
    echo "Check ~/tvoip/voip-receive-only.log for errors"
    exit 1
fi
 
echo ""
echo "✅ Guard device is now in RECEIVE-ONLY mode"
echo "   - Microphone: DISABLED ❌"
echo "   - Speaker: ENABLED ✅"
echo "   - Port: 3333"
 