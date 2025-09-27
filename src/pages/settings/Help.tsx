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
          <h4 className="text-xl font-semibold text-center">Scan QR Code to Report Issue</h4>
          <div className="flex flex-col items-center bg-white p-4 rounded-lg">
            <img
              src="qrcode_www.sakarrobotics.com.png"
              alt="Report Issue QR Code"
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
    "Introduction": "Guard is an intelligent surveillance robot built for real-time monitoring, security, and situational awareness. With advanced sensors, AI-powered vision, and autonomous mobility, Guard serves as a mobile security unit capable of detecting, analyzing, and reporting potential threats. \n This dedicated Guard Dashboard provides direct access to the robot’s operational status and system diagnostics. While the primary command center coordinates overall security operations, this interface gives you focused control and insights into Guard’s performance — ensuring reliable monitoring, quick response, and seamless integration into larger security workflows.",
    
    "Getting Started / Basics": "Let's get you started with the basics:\n\nStarting Your Day:\n- Make sure the robot is charged\n- Check if it's connected to WiFi\n- Look at the screen to see if everything is OK\n\nUsing The Robot:\n- Press buttons on screen to start patrols\n- Watch the camera feed to see what robot sees\n- Use the voice button to talk through robot\n\nIf Things Go Wrong:\n- Go to Settings > General and use the Reboot button\n- Make sure WiFi is working\n- Check if battery needs charging\n\nMost problems can be fixed with a quick reboot - just go to Settings > General section and click the Reboot button!",
    
    "Features & Controls": `Core System Capabilities:

1. Security Monitoring
   • Live threat detection
   • Automated incident recording
   • Instant alert notifications
   • Real-time situation analysis
   • Event history tracking

2. Environment Awareness
   • Area mapping system
   • Obstacle detection
   • Environmental conditions
   • Lighting adaptation
   • Movement tracking

3. Communication System
   • Voice Control (PTT)
     - Press once to activate microphone
     - Press again to deactivate
     - LED status indicator shows active state
     - Visual feedback on dashboard
   • Audio Management
     - Interactive volume control
     - Microphone sensitivity adjustment
     - Noise reduction settings
     - Echo cancellation options
   • Team Collaboration
     - Multi-user access control
     - Shift handover tools
     - Team communication
     - Activity logging

4. Patrol Operation
   • One-click patrol activation
   • Pre-programmed route selection
   • Real-time route modification
   • Patrol speed adjustment
   • Position tracking display

5. Surveillance Tools
   • HD video monitoring
   • Night vision toggle
   • Motion detection system
   • Threat level indicators
   • Automated recording

6. Interactive Controls
   • Simple directional controls
   • Camera angle adjustment
   • Zoom level selection
   • Light intensity control
   • Quick stop function`,
    

    
    "Settings & Configuration": `System Optimization Guide:

1. Patrol Configuration
   • Coverage area setup
   • Patrol route planning
   • Schedule management
   • Alert threshold settings
   • Response time targets

2. Security Settings
   • Detection sensitivity
   • Recording preferences
   • Alert criteria setup
   • Access permissions
   • Emergency protocols

3. Performance Tuning
   • Battery optimization
   • Network prioritization
   • Sensor calibration
   • System backup plans
   • Update management`,

    "System Status & Maintenance": `System Health and Care Guide:

1. System Status Overview
Battery Life:
   • Real-time charge level monitoring
   • Charging status indicators
   • Low battery warnings
   • Power consumption tracking

Network Connection:
   • WiFi connection status
   • Signal strength monitoring
   • Communication capability
   • Network health indicators

Robot Health:
   • System status monitoring
   • Component health tracking
   • Maintenance indicators
   • Reboot requirements

2. Daily Maintenance
   • Physical inspection steps
   • Sensor cleaning process
   • Battery maintenance
   • System checks routine
   • Performance validation

3. Software Management
   • Update installation
   • Version tracking
   • Backup procedures
   • Recovery options
   • System optimization

4. Long-term Care
   • Preventive maintenance
   • Component tracking
   • Wear monitoring
   • Service scheduling
   • Health reports`,
    
    "Troubleshooting Guide": "If you're having problems, try these simple fixes first:\n\nStep 1: Reboot the Robot\n- Go to Settings menu\n- Click on 'General' section\n- Find and click the 'Reboot' button\n- Wait for the robot to fully restart (about 2 minutes)\n\nStep 2: Check Basic Things\n- Make sure the robot has enough battery power\n- Check if you're connected to WiFi\n- Make sure nothing is blocking the robot's sensors\n\nStep 3: Still Having Problems?\n- Try the reboot button in Settings > General again\n- Contact support if problems continue\n\nRemember: Most problems can be fixed by using the Reboot button in the General section of Settings!",
    
    "Safety & Emergency": `Safety and Emergency Procedures:

1. Emergency Response
   • Immediate stop activation
   • Emergency override controls
   • Fail-safe engagement
   • Alert system activation
   • Quick evacuation paths

2. Hazard Prevention
   • Obstacle detection zones
   • Collision avoidance
   • Safety boundary setup
   • Speed limit controls
   • Area restriction rules

3. Safety Monitoring
   • Real-time status checks
   • Environmental scanning
   • Personnel detection
   • Hazard identification
   • Safety zone alerts

4. Crisis Management
   • Incident assessment
   • Response coordination
   • Damage control steps
   • Team mobilization
   • Communication plan

5. Recovery Operations
   • System restoration
   • Damage assessment
   • Status reporting
   • Safety verification
   • Normal operations restart`,
    
    "FAQs": `Quick Reference Guide:

1. Common Operations
   • Starting patrols
   • Emergency handling
   • Battery management
   • System monitoring
   • Alert response

2. Technical Support
   • Basic troubleshooting
   • Update installation
   • Network setup
   • System recovery
   • Performance tips

3. Maintenance Tips
   • Daily checklist
   • Cleaning guide
   • Regular upkeep
   • Service intervals
   • Component care`
  };

  const issueTypes = {
    "Connection / Network Problem": "Follow these steps to diagnose and resolve connection issues:\n\n1. Initial Checks:\n- Verify connection icon status in header bar\n- Check WiFi signal strength indicator\n- Confirm network settings are correct\n- Test other network-dependent features\n\n2. Basic Troubleshooting:\n- Power cycle the robot system\n- Restart the control dashboard\n- Check for physical obstructions\n- Verify WiFi network availability\n\n3. Advanced Steps:\n- Run network diagnostics in settings\n- Test alternative connection methods\n- Check for system updates\n- Verify firewall settings\n\nIf problems persist after these steps, scan the QR code to report detailed connection issues. Include specific symptoms, error messages, and steps already attempted.",

    "GPS / Location Inaccuracy": "Follow this process to resolve location tracking issues:\n\n1. Environment Check:\n- Ensure clear line of sight to sky\n- Move away from tall buildings/obstacles\n- Check for interference sources\n- Verify outdoor operation\n\n2. System Diagnostics:\n- Check GPS signal strength\n- Verify satellite connection count\n- Monitor position update rate\n- Test manual position refresh\n\n3. System Reset Procedure:\n- Save current location data\n- Perform full GPS reset\n- Wait for satellite reacquisition\n- Verify position accuracy\n\nIf location remains inaccurate, scan QR code to report. Include environment details, signal strength, and number of visible satellites.", 

    "Software / Performance Lag": "Address performance issues with these steps:\n\n1. System Health Check:\n- Monitor CPU temperature\n- Check available memory\n- Verify storage space\n- Review running processes\n\n2. Optimization Steps:\n- Close unnecessary processes\n- Clear system cache\n- Check for software updates\n- Verify cooling system operation\n\n3. Advanced Troubleshooting:\n- Run system diagnostics\n- Monitor resource usage\n- Test in safe mode\n- Check error logs\n\nIf performance issues continue, scan QR code to report. Include system temperatures, resource usage stats, and specific lag symptoms.",

    "Robot Control / Movement Error": "Resolution steps for movement issues:\n\n1. Safety Checks:\n- Check for physical obstacles\n- Verify surface conditions\n- Ensure safe operating space\n- Check emergency stop status\n\n2. System Diagnostics:\n- Verify motor power status\n- Check battery charge level\n- Test manual control response\n- Monitor motor temperatures\n\n3. Advanced Diagnostics:\n- Run motor diagnostics\n- Test sensor systems\n- Verify control calibration\n- Check error logs\n\nIf movement issues persist, scan QR code to report. Include specific movement symptoms, error messages, and environmental conditions.",

    "System Crash / App Error": "Follow these recovery steps for system crashes:\n\n1. Immediate Actions:\n- Record any error messages\n- Save important data if possible\n- Note system state before crash\n- Check for pattern in crashes\n\n2. Recovery Steps:\n- Perform safe system restart\n- Check system logs\n- Verify software versions\n- Test basic functions\n\n3. Prevention Measures:\n- Check for updates\n- Verify system requirements\n- Monitor system resources\n- Review recent changes\n\nFor recurring crashes, scan QR code to report. Include exact error messages, crash circumstances, and frequency of occurrences.",

    "Camera / Video Issue": "Resolve camera system issues with these steps:\n\n1. Hardware Checks:\n- Check for physical obstructions\n- Verify lens cleanliness\n- Check camera connections\n- Verify power supply\n\n2. Software Diagnostics:\n- Test camera initialization\n- Check video processing\n- Verify stream settings\n- Monitor frame rate\n\n3. Advanced Troubleshooting:\n- Run camera diagnostics\n- Test different resolutions\n- Check bandwidth usage\n- Verify driver status\n\nIf video issues continue, scan QR code to report. Include specific symptoms, video quality issues, and any error messages.",

    "Audio Communication Problems": "Troubleshoot audio issues using these steps:\n\n1. Basic Checks:\n- Test microphone function\n- Verify speaker operation\n- Check volume settings\n- Test audio feedback\n\n2. System Settings:\n- Verify audio device selection\n- Check input/output levels\n- Test echo cancellation\n- Verify codec settings\n\n3. Advanced Diagnostics:\n- Run audio diagnostics\n- Test alternative devices\n- Check for interference\n- Monitor latency\n\nIf audio problems persist, scan QR code to report. Include specific symptoms, test results, and environmental conditions.",

    "Battery / Power Issues": "Address power-related problems:\n\n1. Power Analysis:\n- Check current charge level\n- Monitor power consumption\n- Verify charging status\n- Test power supply\n\n2. System Impact:\n- Check for high-drain processes\n- Monitor temperature effects\n- Verify sleep mode function\n- Test power management\n\n3. Long-term Solutions:\n- Calibrate battery monitor\n- Check charging cycles\n- Verify battery health\n- Test backup systems\n\nFor persistent power issues, scan QR code to report. Include battery statistics, usage patterns, and specific symptoms.",

    "Sensor System Failures": "Diagnose sensor issues with these steps:\n\n1. Initial Assessment:\n- Check sensor status\n- Verify physical condition\n- Test basic function\n- Monitor error states\n\n2. Diagnostic Steps:\n- Run sensor tests\n- Check calibration\n- Verify data accuracy\n- Test in different conditions\n\n3. Advanced Testing:\n- Run full diagnostics\n- Check interference sources\n- Verify sensor fusion\n- Test redundancy systems\n\nIf sensor problems continue, scan QR code to report. Include sensor data, error states, and environmental conditions."
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
            <h3 className="text-xl font-semibold">Report Issue</h3>
            <Button 
              variant="outline"
              onClick={() => setIsQROpen(true)}
            >
              📱 QR for Report Issue
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