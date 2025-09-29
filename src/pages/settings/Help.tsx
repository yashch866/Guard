import SettingsLayout from "@/components/SettingsLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FAQSearch } from "@/components/FAQSearch";

interface QROverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const QROverlay: React.FC<QROverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-background p-8 rounded-lg shadow-lg relative max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X size={24} />
        </button>
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-center">Scan QR Code to Contact Us</h4>
          <div className="flex flex-col items-center bg-white p-4 rounded-lg">
            <img
              src="qrcode_www.sakarrobotics.com.png"
              alt="Contact Us QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Help = () => {
  const [isQROpen, setIsQROpen] = useState(false);
  
  const helpSections = {
    "Introduction": "Guard is an intelligent surveillance robot built for real-time monitoring, security, and situational awareness. With advanced sensors, AI-powered vision, and autonomous mobility, Guard serves as a mobile security unit capable of detecting, analyzing, and reporting potential threats.\n\nThis Guard Dashboard provides direct access to the robot's operational status, settings configuration, and system diagnostics. The interface is designed for easy monitoring and control, giving you focused insights into Guard's performance and seamless integration into your security workflows.",
    
    "Getting Started / Basics": "Welcome to the Guard Dashboard! Here's how to get started:\n\nDashboard Overview:\n- See the current date and time in the header\n- Check network connection status (ONLINE/OFFLINE/NO INTERNET)\n- View recording status indicator\n- Use the large talk button for voice communication\n\nDaily Operation:\n- Monitor connection status in the header\n- Use push-to-talk for voice communication\n- Check system status via the bottom navigation\n- Access settings for customization\n\nNavigation:\n- Home: Main dashboard with talk button\n- Settings: Configure display themes, volume, WiFi, and general settings\n- System Status: View camera status and temperature monitoring",
    
    "Features & Controls": `Dashboard Features:

1. Header Status Bar
   • Company logo display (Sakar)
   • Real-time date and time display
   • Connection status indicator (ONLINE/OFFLINE/NO INTERNET)
   • Recording status indicator (always shows RECORDING)

2. Communication System
   • Large Talk Button (Push-to-Talk)
     - Red when OFF (MIC OFF): Press to start talking
     - Green when ON (MIC ON): Press to stop talking
     - Voice chat server connection status display
     - Connection test button when disconnected

3. Bottom Navigation
   • Home: Returns to main dashboard
   • Settings: Access configuration options
   • System Status: View system health information

4. Settings Sections Available
   • Display: Theme selection (Auto/Light/Dark) and brightness display
   • Audio: Volume control with mute/unmute functionality
   • WiFi: Network configuration and connection management
   • General: System settings and information
   • About: Version information and details
   • Help: This help documentation`,
    
    "Settings & Configuration": `Available Settings Sections:

1. Display Settings
   • Theme Selection
     - Auto: Automatically switches between light/dark based on time
     - Light: Always use light theme
     - Dark: Always use dark theme
   • Brightness Display
     - Shows current screen brightness level
     - Read-only brightness indicator (fixed at 100%)

2. Audio Settings
   • Volume Control
     - System volume adjustment
     - Real-time volume slider
     - Audio output level control
   • Communication Settings
     - Talk button configuration
     - Audio quality preferences

3. Network Settings
   • WiFi Configuration
     - Available network display
     - Connection strength monitoring
     - Network status indicators
   • Connection Management
     - Network troubleshooting
     - Signal quality monitoring

4. System Information
   • Robot Status Overview
   • System Health Monitoring
   • Version Information
   • Performance Indicators`,

    "System Status & Monitoring": `System Status Page Features:

1. Camera Status Card
   • CONNECTED/DISCONNECTED status display
   • Lists all camera devices and their status
   • Shows Active/Inactive state for each device
   • Real-time camera connection monitoring

2. Temperature Monitoring
   • CPU Temperature Card
     - Real-time CPU temperature in Celsius
     - Status indicators: Normal/Warm/High
     - Temperature thresholds for warnings
   • GPU Temperature Card
     - Real-time GPU temperature monitoring
     - Status indicators for thermal health
     - Overheating warnings when needed

3. Connection Status (in Header)
   • ONLINE: Full internet connectivity
   • NO INTERNET: WiFi connected but no internet access
   • OFFLINE: No network connection
   • Recording indicator (always active)

4. System Notifications
   • Toast notifications for status changes
   • Camera connection/disconnection alerts
   • System connection status updates
   • Error messages for troubleshooting`,
    
    "Troubleshooting Guide": `Common Issues and Solutions:

1. Connection Problems
   • Check WiFi signal strength indicator
   • Verify network settings in Settings > Network
   • Ensure robot is within WiFi range
   • Contact support if issues persist

2. Video Feed Issues
   • Check connection status indicator
   • Verify camera is not obstructed
   • Test network bandwidth
   • Try refreshing the dashboard

3. Audio Communication Problems
   • Check volume settings in Settings > Audio
   • Test talk button functionality
   • Verify microphone permissions
   • Check speaker output levels

4. Performance Issues
   • Monitor system status indicators
   • Check network connection stability
   • Verify all systems are operational
   • Contact support for persistent issues`,
    
    "FAQs": `Frequently Asked Questions:

Q: How do I use the talk button?
A: Press the large red button to turn the microphone ON (green). Press again to turn it OFF (red). The button shows MIC OFF/MIC ON status clearly.

Q: What do the connection status indicators mean?
A: ONLINE = Full internet connection, NO INTERNET = WiFi connected but no web access, OFFLINE = No network connection.

Q: Can I change the theme?
A: Yes! Go to Settings > Display and choose from Auto, Light, or Dark themes. Auto automatically switches between light and dark based on time of day.

Q: How do I adjust the volume?
A: Go to Settings > Audio. You'll find a volume slider and mute/unmute button to control system audio levels.

Q: What does the recording indicator mean?
A: The red "RECORDING" indicator in the header shows that the system is actively recording audio/video for security purposes.

Q: How can I check if the camera is working?
A: Go to System Status (info icon in bottom navigation) to see camera connection status and active devices.

Q: Where can I find WiFi settings?
A: Navigate to Settings > WiFi to view network status, connection information, and manage WiFi connections.

Q: What are the temperature readings for?
A: System Status shows CPU and GPU temperatures to monitor system health and prevent overheating.

Q: How do I get technical support?
A: Use the "Contact Us (QR)" button in the Help section to scan the QR code and reach our support team.`
  };

  const issueTypes = {
    "Connection / Network Problem": "Follow these steps to resolve connection issues:\n\n1. Check Status Indicators:\n- Look at connection status in the header (ONLINE/NO INTERNET/OFFLINE)\n- ONLINE = Full connection working properly\n- NO INTERNET = WiFi connected but no web access\n- OFFLINE = No network connection at all\n\n2. Basic Network Troubleshooting:\n- Go to Settings > WiFi to view current network status\n- Check if other devices can connect to the same network\n- Verify network password and credentials are correct\n- Ensure device is within WiFi range\n\n3. Advanced Steps:\n- Restart your router/modem\n- Check for network interference from other devices\n- Try connecting to a different network if available\n- Verify firewall settings aren't blocking the connection\n\nIf connection problems persist, use the Contact Us QR code to report the issue with specific connection status and symptoms.",

    "Camera System Issues": "Resolve camera connection problems with these steps:\n\n1. Check System Status:\n- Go to System Status page (info icon in bottom navigation)\n- Look at Camera Status card - should show CONNECTED\n- Check if camera devices are listed as Active\n- Watch for system notifications about camera changes\n\n2. Basic Troubleshooting:\n- Verify connection status shows ONLINE in header\n- Check if camera hardware is properly connected\n- Ensure adequate power supply to camera system\n- Look for any physical obstructions or damage\n\n3. Advanced Steps:\n- Check system temperatures aren't too high\n- Verify network stability for camera communication\n- Try accessing dashboard from different device\n- Monitor for recurring disconnection patterns\n\nIf camera remains disconnected, contact us via QR code with camera status details and any error notifications.",

    "Audio Communication Problems": "Fix audio system issues using these steps:\n\n1. Basic Audio Checks:\n- Test volume levels in Settings > Audio\n- Verify talk button shows visual feedback when pressed\n- Check device microphone and speaker functionality\n- Ensure browser has microphone permissions\n\n2. Communication Testing:\n- Test talk button by pressing and holding\n- Listen for audio feedback through robot speakers\n- Verify two-way communication capability\n- Check for echo or feedback issues\n\n3. System Settings:\n- Adjust volume slider in audio settings\n- Test with different volume levels\n- Verify browser audio permissions\n- Check device audio output settings\n\nFor persistent audio problems, contact support via QR code with information about specific symptoms, volume levels, and communication test results.",

    "System Temperature Issues": "Address overheating problems with these steps:\n\n1. Monitor Temperature Status:\n- Go to System Status page to view CPU and GPU temperatures\n- Normal: Below 60°C, Warm: 60-80°C, High: Above 80°C\n- Watch for temperature warnings and notifications\n- Check if temperatures are consistently high\n\n2. Immediate Actions for High Temperatures:\n- Ensure adequate ventilation around the system\n- Check for dust buildup on cooling components\n- Verify cooling fans are operating properly\n- Reduce system load if possible\n\n3. Prevention and Maintenance:\n- Keep system in well-ventilated area\n- Regularly clean dust from vents and fans\n- Monitor temperature trends over time\n- Avoid blocking air vents or cooling ports\n\nFor persistent overheating issues, contact support via QR code with temperature readings and environmental details."
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">HELP PAGE</h2>

        {/* FAQ Search */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
          <FAQSearch />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Help Topics</h3>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(helpSections)
              .filter(([section]) => section !== "FAQs") // Remove FAQs section
              .map(([section, description], index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-bold text-lg">
                  {section}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground text-base leading-relaxed py-2">
                    {description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Contact Us (QR)</h3>
            <Button 
              variant="outline"
              onClick={() => setIsQROpen(true)}
            >
              📱 Contact Us (QR)
            </Button>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(issueTypes).map(([issue, description], index) => (
              <AccordionItem key={index} value={`issue-${index}`}>
                <AccordionTrigger className="text-left font-bold text-lg">
                  {issue}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-base leading-relaxed py-2">
                      {description}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <QROverlay isOpen={isQROpen} onClose={() => setIsQROpen(false)} />
    </SettingsLayout>
  );
};

export default Help;