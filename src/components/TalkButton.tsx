import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MicOff, Volume2, Mic } from "lucide-react";
import { voiceChat } from "@/lib/voiceChat";
import { socket } from "@/lib/socket";
import { getAdaptiveConfig } from "@/lib/config";
 
const TalkButton = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true); // Start with mic muted
  const [isMuting, setIsMuting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState('Never');

  // Get adaptive API configuration
  const { apiUrl } = getAdaptiveConfig();
 
  // Check connection to backend server
  const checkConnection = async () => {
    const attemptTime = new Date().toLocaleTimeString();
    setLastConnectionAttempt(attemptTime);
    setConnectionStatus('Testing...');
    console.log(`[voice] Connection test at ${attemptTime}`);
    
    try {
      // Check backend voice chat status using adaptive config
      const response = await fetch(`${apiUrl}/voice-chat/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setIsConnected(true);
        setConnectionStatus('✅ Connected to voice chat server');
        console.log('[voice] Connected to voice chat server');
        return true;
      } else {
        const error = await response.text();
        setConnectionStatus(`❌ Server error: ${error}`);
        console.error('[voice] Server error:', error);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus(`❌ Connection failed - ${error instanceof Error ? error.message : String(error)}`);
    }
 
    setIsConnected(false);
    return false;
  };
 
  // Toggle microphone mute/unmute
  const handleMicToggle = async () => {
    if (!isConnected) {
      alert('Cannot activate microphone: Not connected to the server');
      return;
    }

    setIsMuting(true);
    try {
      // First check if socket is connected
      if (!voiceChat.isSocketConnected()) {
        console.log('Socket not connected, attempting to reconnect...');
        socket.connect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for connection
      }

      if (isMicMuted) {
        // Turn ON: Red -> Green
        console.log('Turning microphone ON');
        const success = await voiceChat.startVoiceChat();
        if (success) {
          setIsMicMuted(false);
          voiceChat.startTransmitting();
          console.log('✅ Voice chat started successfully');
        } else {
          throw new Error('Failed to start voice chat');
        }
      } else {
        // Turn OFF: Green -> Red
        console.log('Turning microphone OFF');
        // Stop transmitting FIRST before stopping voice chat
        if (voiceChat.isVoiceChatActive()) {
          voiceChat.stopTransmitting();
          console.log('✅ Voice transmission stopped');
          // Add a small delay to ensure the stop signal is sent
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        voiceChat.stopVoiceChat();
        setIsMicMuted(true);
        console.log('✅ Voice chat stopped successfully');
      }
    } catch (error) {
      console.error('Failed to toggle voice chat:', error);
      setIsMicMuted(true); // Ensure mic is marked as off on error
      alert('❌ Failed to control microphone: ' + (error.message || 'Unknown error'));
    } finally {
      setIsMuting(false);
    }
  };
 
  // Force restart VoIP in receive-only mode
  const handleRestartReceiveOnly = async () => {
    setIsRestarting(true);
    try {
      // Get credentials from user (in a real app, these might be stored securely)
      const credentials = {
        host: window.location.hostname || '192.168.0.101', // Guard device IP
        username: 'jetson', // Default Jetson username
        password: sessionStorage.getItem('jetsonPassword') || prompt('Enter Jetson password to force receive-only mode:')
      };
 
      if (!credentials.password) {
        setIsRestarting(false);
        return;
      }
 
      // Store password temporarily for this session
      sessionStorage.setItem('jetsonPassword', credentials.password);
 
      const response = await fetch('http://192.168.0.206:3004/voip/force-receive-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
 
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Success: ${result.message}`);
        setIsMicMuted(true); // Force receive-only mode mutes the mic
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to restart:', error);
      alert('❌ Failed to force receive-only mode. Check console for details.');
    } finally {
      setIsRestarting(false);
    }
  };
 
  // Check connection and socket status on component mount
  useEffect(() => {
    const checkConnectionAndSocket = async () => {
      const connectionOk = await checkConnection();
      if (connectionOk && !voiceChat.isSocketConnected()) {
        console.log('Reconnecting voice chat socket...');
        socket.connect();
      }
    };

    checkConnectionAndSocket();
    // Check connection every 5 seconds
    const interval = setInterval(checkConnectionAndSocket, 5000);
    
    // Stop voice chat if connection is lost
    if (!isConnected) {
      voiceChat.stopTransmitting();
      voiceChat.stopVoiceChat();
      setIsMicMuted(true);
    }
    
    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      voiceChat.stopTransmitting();
      voiceChat.stopVoiceChat();
    }
  }, [isConnected]);
 
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Button
        size="lg"
        onClick={handleMicToggle}
        disabled={isMuting || !isConnected}
        className={`w-64 h-64 rounded-full text-white text-xl font-bold shadow-2xl ${
          !isConnected 
            ? 'bg-gray-400 cursor-not-allowed'
            : isMicMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
        } transition-colors duration-300 flex flex-col items-center justify-center gap-2`}
      >
        {isMicMuted ? (
          <>
            <MicOff className="h-8 w-8" />
            MIC OFF
          </>
        ) : (
          <>
            <Mic className="h-8 w-8" />
            MIC ON
          </>
        )}
      </Button>
      
      {/* Connection Status */}
      <div className={`text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
        {isConnected ? '🟢 Voice Chat Server Connected' : '🔴 Voice Chat Server Connection Failed'}
      </div>
      
      {/* Manual Connection Test */}
      {!isConnected && (
        <div className="text-xs text-center space-y-2">
          <div className="text-orange-600">
            Connection failed. Make sure the backend server is running on port 5000.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            className="text-xs"
          >
            Test Connection
          </Button>
        </div>
      )}
    </div>
  );
};
 
export default TalkButton;