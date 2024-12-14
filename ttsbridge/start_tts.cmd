@echo off
cd /d D:\GPT-SoVITS-v2-240821\GPT-SoVITS-v2-240821
start "Python WebUI" cmd /c "runtime\python.exe webui.py zh_CN"
cd /d D:\ProgramSource\Sagaciousist\ttsbridge
node server.js