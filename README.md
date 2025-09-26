Guard – Intelligent Surveillance Robot
A Robotic Surveillance System for Autonomous Patrol, AI Monitoring, and Push-to-Talk Communication

Introduction
Guard is a robotic surveillance system designed to autonomously patrol predefined areas and provide real-time security monitoring.
 It follows user-set patrol routines, streams live video feeds to a central dashboard, and offers AI-powered features such as unauthorized person detection, vehicle number plate recognition, and event logging.
Note: After cloning, the TVoIP folder/file should be moved to the same path as the guard folder (siblings), as it is required for Push-to-Talk functionality.

Overview
This repository contains the Guard Robot Dashboard source code.
 The dashboard runs on the robot itself, acting as a bridge between the robot’s sensors/cameras and the main central control dashboard used by security operators.
The Guard ecosystem integrates:
Autonomous robot patrols for real-time area monitoring


AI-driven surveillance (face/object detection, number plate recognition)


Emergency communication via TVoIP / Push-to-Talk (PTT)


Secure evidence collection with timestamped video logs



Development Workflow
All feature development happens in feature branches (feature/*)


Completed features are merged into the development branch


Stable releases are created from development and merged into main



Key Features
Autonomous Patrol & Live Monitoring – Robot follows user-defined routes and streams live feed to the dashboard.


AI-Powered Surveillance – Detects unauthorized persons (YOLO + ArcFace) and captures vehicle plates (EasyOCR).


Robot Dashboard (Onboard) – Includes Push-to-Talk (PTT/TVoIP) support for emergency communication.


Evidence & Reporting – Records and timestamps all detections; playback is searchable.


Admin & Security Controls – Role-based authentication and encrypted storage for patrol logs and evidence.



Installation
Download the Application
git clone https://github.com/sakaristic/guard.git
cd guard

Clones the Guard repository and moves into the folder.


mv guard/tvoip ../

Moves the TVoIP folder out of guard so it is a sibling of guard.


After this, the structure should look like:


/home/sr06/guard
/home/sr06/tvoip

python3 -m venv guard-env

Creates a Python virtual environment to isolate dependencies.


source guard-env/bin/activate

Activates the virtual environment so Python packages are installed only here.



Backend Dependencies
cd src/backend
pip install -r requirements.txt

Installs all Python libraries listed in the backend requirements.txt.


Or install manually if requirements.txt is unavailable:
pip install fastapi uvicorn pandas numpy opencv-python matplotlib

Installs FastAPI for the backend server and libraries for data handling and image/video processing.


pip install torch torchvision ultralytics easyocr

Installs AI libraries for YOLO object detection, ArcFace face recognition, and EasyOCR for vehicle plate recognition.


pip install screen-brightness-control pyalsaaudio pydantic python-socketio python-multipart

Installs system controls, audio interface for PTT, validation, WebSocket communication, and file upload support.



Run Backend Server
uvicorn main:app --reload --port 5000

Starts the FastAPI server on port 5000 with live reload.


Backend API serves AI models and handles robot-dashboard requests.



Frontend & TVoIP Setup (Open a New Terminal)
cd guard/src

Moves to the directory containing the frontend dashboard.


npm install vite --save-dev

Installs Vite, the frontend build tool required to run the dashboard.


sudo apt-get update
sudo apt-get install pulseaudio alsa-utils sox -y

Installs system audio utilities needed for Push-to-Talk (PTT) / TVoIP functionality.


npm run dev

Starts the frontend development server (dashboard + TVoIP interface).


Frontend will typically be accessible at http://localhost:5173.



Usage Guide
Autonomous Patrol & Live Monitoring – Robot patrols user-defined routes and streams live video.


AI-Powered Surveillance – Detects unauthorized persons and vehicles, logs incidents.


Push-to-Talk (PTT / TVoIP) – Two-way emergency communication with operators.


Evidence & Reporting – Timestamped logs with searchable playback for investigations.


Admin Settings – Role-based dashboard access; update patrol routes and authorized personnel.



Technical Stack
Backend: Python (FastAPI, Pandas, OpenCV, NumPy)
 Frontend: Node.js + Vite
 AI Models: YOLO, ArcFace, EasyOCR
 Hardware: Jetson Orin Nano
 Audio: PyAlsaAudio, PulseAudio, TVoIP

Contributing
Managed internally. Contact the development team for feedback or issues.

License
Proprietary software owned by Sakar Robotics.

Contact
Sakar Robotics
 Email: admin@sakarrobotics.com



