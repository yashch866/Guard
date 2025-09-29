Guard – Intelligent Surveillance Robot

A Robotic Surveillance System for Autonomous Patrol, AI Monitoring, and Push-to-Talk Communication

Introduction

Guard is a robotic surveillance system designed to autonomously patrol predefined areas and provide real-time security monitoring. It follows user-defined patrol routines, streams live video feeds to a central dashboard, and offers AI-powered features such as:

Unauthorized person detection

Vehicle number plate recognition

Event logging

Emergency communication via Push-to-Talk (PTT)

Note: After cloning, the TVoIP folder must be moved to the same path as the guard folder (they must be siblings), as it is required for Push-to-Talk functionality.

Repository Overview

This repository contains the Guard Robot Dashboard source code. The dashboard runs on the robot itself, acting as a bridge between the robot’s sensors/cameras and the central control dashboard used by security personnel.

Key Integrations:

Autonomous robot patrols for real-time area monitoring

AI-powered surveillance using YOLO, ArcFace, and EasyOCR

Emergency communication via TVoIP (Push-to-Talk)

Secure evidence collection with timestamped logs

Development Workflow

All new features are built in feature/* branches

Features are merged into the development branch

Stable releases are merged from development into main

Key Features

✅ Autonomous Patrol & Live Monitoring
– Robot follows predefined routes and streams live video feeds to the dashboard.

✅ AI-Powered Surveillance
– Detects unauthorized persons using YOLO + ArcFace
– Recognizes vehicle license plates via EasyOCR

✅ Push-to-Talk (PTT)
– TVoIP-based emergency communication with security personnel

✅ Evidence Collection & Logging
– Records and timestamps detections
– Supports search/playback of incident logs

✅ Admin & Security Controls
– Role-based authentication
– Encrypted patrol logs and evidence

Installation Guide
1. Clone the Repository
git clone https://github.com/sakaristic/guard.git
cd guard

2. Move TVoIP Folder
mv guard/tvoip ../


This will make the project structure look like:

/home/sr06/guard
/home/sr06/tvoip

Backend Setup
3. Create Python Environment
python3 -m venv guard-env
source guard-env/bin/activate

4. Install Backend Dependencies
cd src/backend
pip install -r requirements.txt


If requirements.txt is missing, install manually:

pip install fastapi uvicorn pandas numpy opencv-python matplotlib
pip install torch torchvision ultralytics easyocr
pip install screen-brightness-control pyalsaaudio pydantic python-socketio python-multipart

5. Run Backend Server
uvicorn main:app --reload --port 5000

Frontend Setup
6. Prepare Frontend Environment
cd guard/src
npm install
npm install vite --save-dev

7. Install System Audio Dependencies (for TVoIP)
sudo apt-get update
sudo apt-get install pulseaudio alsa-utils sox -y

8. Start Frontend Development Server
npm run dev


Access frontend at: http://localhost:5173

Build & Package App (Optional)

To create the production build and package as an AppImage:

npm run package


After building, run:

./dist/Guard\ Controls-0.0.1.AppImage


You should see:

App is ready, starting backend...

Usage Guide

Autonomous Patrol – Robot moves along configured routes

Live Monitoring – Real-time video stream on dashboard

AI Detection – Logs faces, vehicles, and intrusions

Push-to-Talk (PTT) – Real-time voice chat with control room

Evidence Playback – Search and view past detection logs

Admin Panel – Manage users, patrols, and logs

Technical Stack
Component	Tech
Backend	Python, FastAPI, OpenCV, NumPy
Frontend	Node.js, React, Vite
AI Models	YOLOv8, ArcFace, EasyOCR
Audio	PyAlsaAudio, PulseAudio, TVoIP
Hardware	Jetson Orin Nano
Contributing

Currently managed internally. For feedback or issues, contact the development team.

License

Proprietary Software – Owned by Sakar Robotics.
Unauthorized use or distribution is prohibited.

Contact

📧 Email: admin@sakarrobotics.com
