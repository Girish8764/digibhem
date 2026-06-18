@echo off
cd /d c:\Users\HP\Desktop\MediBook\server
call npm install
if %errorlevel% neq 0 (
    echo npm install failed, trying alternative...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "npm install"
)
