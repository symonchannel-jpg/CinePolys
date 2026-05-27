#Requires -Version 5.1
<#
.SYNOPSIS
    Cinepolis - Production Management Launcher (PowerShell)
.DESCRIPTION
    Verifica requisitos, configura Prisma, hace seed e inicia Next.js dev server.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = $PSScriptRoot }
Set-Location $ProjectRoot

$Host.UI.RawUI.WindowTitle = "Cinepolis - Production Management"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Cinepolis - Production Management" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Verificar Node.js ---
try {
    $nodeVer = node --version
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado o no esta en el PATH." -ForegroundColor Red
    Write-Host "        Instala desde: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# --- Verificar npm ---
try {
    npm --version | Out-Null
} catch {
    Write-Host "[ERROR] npm no encontrado." -ForegroundColor Red
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# --- Instalar dependencias si no existen ---
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install fallo." -ForegroundColor Red
        Write-Host "Presiona cualquier tecla para salir..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-Host "[OK] Dependencias instaladas." -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencias listas." -ForegroundColor Green
}

# --- Configurar Prisma ---
Write-Host "`nConfigurando Prisma..." -ForegroundColor Yellow
npx prisma generate --schema prisma/schema-sqlite.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Prisma generate fallo." -ForegroundColor Red
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
npx prisma db push --schema prisma/schema-sqlite.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Prisma db push fallo." -ForegroundColor Red
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "[OK] Base de datos lista." -ForegroundColor Green

# --- Seed ---
Write-Host "`nAplicando seed..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Seed fallo (continuando)" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Seed completado." -ForegroundColor Green
}

# --- Verificar puerto 3001 ---
Write-Host "`nVerificando puerto 3001..." -ForegroundColor Yellow
$portInUse = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
if ($portInUse) {
    Write-Host "[ERROR] Puerto 3001 ocupado por otro proceso." -ForegroundColor Red
    $portInUse | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "[OK] Puerto 3001 libre." -ForegroundColor Green

# --- Abrir navegador ---
Start-Process "http://localhost:3001"

# --- Arrancar servidor ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Iniciando servidor Next.js..." -ForegroundColor Cyan
Write-Host "   http://localhost:3001" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

npm run dev -- --port 3001

# --- Servidor detenido ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Servidor detenido." -ForegroundColor Cyan
Write-Host "   Revisa los mensajes de arriba." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
