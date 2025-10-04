# Guard – Intelligent Surveillance Robot

A Robotic Surveillance System for Autonomous Patrol, AI Monitoring, and Push-to-Talk Communication

## 🛰️ Introduction

Guard is a robotic surveillance system designed to autonomously patrol predefined areas and provide real-time security monitoring. It follows user-set patrol routines, streams live video feeds to a central dashboard, and offers AI-powered features such as:

- Unauthorized person detection
- Vehicle number plate recognition
- Event logging
- Emergency communication via Push-to-Talk (PTT)

### ⚠️ Important Note

After cloning, the **TVoIP** folder should be placed in the **same path** as the Guard folder (they must be siblings), as it is required for Push-to-Talk (PTT) functionality.

📁 **Example structure:**
```
/home/username/Guard
/home/username/TVoIP
```

## 📦 Overview

This repository contains the Guard Robot Dashboard source code. The dashboard runs on the robot itself, acting as a bridge between the robot's sensors/cameras and the main central control dashboard used by security operators.

🔗 The Guard ecosystem integrates:
- Autonomous robot patrols for real-time area monitoring
- AI-driven surveillance (face/object detection, number plate recognition)
- Emergency communication via TVoIP / Push-to-Talk (PTT)
- Secure evidence collection with timestamped video logs

## 🛠️ Development Workflow

- All feature development happens in `feature/*` branches
- Completed features are merged into the `development` branch
- Stable releases are created from `development` and merged into `main`

## 🌟 Key Features

✅ **Autonomous Patrol & Live Monitoring** – Robot follows user-defined routes and streams live feed to the dashboard.

✅ **AI-Powered Surveillance** – Detects unauthorized persons (YOLO + ArcFace) and captures vehicle plates (EasyOCR).

✅ **Robot Dashboard (Onboard)** – Includes Push-to-Talk (PTT/TVoIP) support for emergency communication.

✅ **Evidence & Reporting** – Records and timestamps all detections; playback is searchable.

✅ **Admin & Security Controls** – Role-based authentication and encrypted storage for patrol logs and evidence.

## 🧰 Installation Guide

### 📥 Download the Application

```bash
git clone https://github.com/yashch866/Guard.git
cd Guard/
```

### ⚠️ Move the TVoIP Folder

After cloning, move the TVoIP folder out of guard so it becomes a sibling:

```bash
mv guard/tvoip ../
```

Your project structure should now look like:
```
/home/username/Guard
/home/username/TVoIP
```

### 🧪 Backend & Frontend Setup

```bash
# Create and activate virtual environment
python3 -m venv guard-env
source guard-env/bin/activate

# Install PyInstaller for packaging
pip install pyinstaller

# Install backend dependencies
cd src/backend
pip install -r requirements.txt

# Deactivate the virtual environment
deactivate

# Return to root and install frontend build tool
cd ../..
npm install --save-dev vite

# Package the application as an AppImage
npm run package

# Run the packaged application
./dist/GuardControls-0.0.1.AppImage
```

✅ You should see: **App is ready, starting backend...**

## 🚀 Usage Guide

- **Autonomous Patrol & Live Monitoring** – Robot patrols user-defined routes and streams live video.
- **AI-Powered Surveillance** – Detects unauthorized persons and vehicles, logs incidents.
- **Push-to-Talk (PTT / TVoIP)** – Two-way emergency communication with operators.
- **Evidence & Reporting** – Timestamped logs with searchable playback for investigations.
- **Admin Settings** – Role-based dashboard access; update patrol routes and authorized personnel.

## 🧱 Technical Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python (FastAPI, Pandas, OpenCV, NumPy) |
| Frontend | Node.js + Vite |
| AI Models | YOLOv8, ArcFace, EasyOCR |
| Audio | PyAlsaAudio, PulseAudio, TVoIP |
| Hardware | Jetson Orin Nano |

## 🤝 Contributing

Currently managed internally. Contact the development team for feedback or issues.

## 📜 License

Proprietary software owned by Sakar Robotics. Unauthorized use or distribution is prohibited.

## 📬 Contact

**Sakar Robotics**

📧 Email: info@sakarrobotics.com
