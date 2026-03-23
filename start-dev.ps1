$ErrorActionPreference = "Stop"

function Test-PortListening {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mongoExe = Join-Path $root ".local\mongodb\dist\mongodb-win32-x86_64-windows-8.2.5\bin\mongod.exe"
$mongoDbPath = Join-Path $root ".local\mongodb\data\db"
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

Write-Host "Starting RentAll local dev stack..."

# MongoDB
if (Test-PortListening -Port 27017) {
    Write-Host "MongoDB already running on 27017."
} else {
    if (-not (Test-Path $mongoExe)) {
        throw "MongoDB binary not found at $mongoExe"
    }
    New-Item -ItemType Directory -Force -Path $mongoDbPath | Out-Null
    Start-Process -FilePath $mongoExe `
        -ArgumentList "--dbpath `"$mongoDbPath`" --bind_ip 127.0.0.1 --port 27017" `
        -WorkingDirectory $root
    Write-Host "MongoDB started on 27017."
}

# Backend
if (Test-PortListening -Port 8000) {
    Write-Host "Backend already running on 8000."
} else {
    Start-Process -FilePath "powershell" `
        -ArgumentList "-NoExit", "-Command", "cd `"$backendDir`"; python -m uvicorn server:app --host 0.0.0.0 --port 8000" `
        -WorkingDirectory $backendDir
    Write-Host "Backend started on 8000."
}

# Frontend
if (Test-PortListening -Port 3001) {
    Write-Host "Frontend already running on 3001."
} elseif (Test-PortListening -Port 3000) {
    Write-Host "Port 3000 is busy, starting frontend on 3001."
    Start-Process -FilePath "powershell" `
        -ArgumentList "-NoExit", "-Command", "cd `"$frontendDir`"; `$env:PORT=3001; npm start" `
        -WorkingDirectory $frontendDir
    Write-Host "Frontend started on 3001."
} else {
    Start-Process -FilePath "powershell" `
        -ArgumentList "-NoExit", "-Command", "cd `"$frontendDir`"; npm start" `
        -WorkingDirectory $frontendDir
    Write-Host "Frontend started on 3000."
}

Write-Host "Done. Open app at http://localhost:3000 or http://localhost:3001"
Write-Host "API at http://localhost:8000/api/"
