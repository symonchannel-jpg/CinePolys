@echo off
title Cinepolis - Production Management
setlocal enabledelayedexpansion

echo ============================================
echo    Cinepolis - Production Management
echo ============================================
echo.

:: --- Verificar Node.js ---
where node >nul 2>&1 || (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo Instala desde: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: --- Verificar npm ---
where npm >nul 2>&1 || (
    echo [ERROR] npm no encontrado.
    pause
    exit /b 1
)

:: --- Instalar dependencias si no existen ---
if not exist "node_modules" (
    echo.
    echo Instalando dependencias...
    call npm install || (
        echo [ERROR] npm install fallo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas.
) else (
    echo [OK] Dependencias listas.
)

:: --- Reconstruir modulo nativo para la plataforma actual ---
echo.
echo Reconstruyendo modulo nativo...
call npm rebuild better-sqlite3 2>nul || (
    echo [INFO] Rebuild fallo, reinstalando modulo...
    call npm install better-sqlite3 --ignore-scripts 2>nul && call npm rebuild better-sqlite3 2>nul || (
        echo [WARN] No se pudo reconstruir el modulo nativo.
        echo [WARN] Si ves errores de base de datos, ejecuta: npm install
    )
)

:: --- Configurar Prisma ---
echo.
echo Configurando Prisma...
call node scripts\gen-sqlite-schema.mjs || (
    echo [ERROR] Generacion de schema SQLite fallo.
    pause
    exit /b 1
)
call npx prisma generate --schema prisma/schema-sqlite.generated.prisma || (
    echo [ERROR] Prisma generate fallo.
    pause
    exit /b 1
)
call npx prisma db push --schema prisma/schema-sqlite.generated.prisma || (
    echo [ERROR] Prisma db push fallo.
    pause
    exit /b 1
)
echo [OK] Base de datos lista.

:: --- Seed ---
echo.
echo Aplicando seed...
call npx tsx prisma/seed.ts || echo [WARN] Seed fallo (continuando)
echo [OK] Seed completado.

:: --- Abrir navegador ---
start "" "http://localhost:3001"

:: --- Arrancar servidor ---
echo.
echo ============================================
echo    Iniciando servidor Next.js...
echo    http://localhost:3001
echo ============================================
echo.

npm run dev -- --port 3001

:: --- Servidor detenido ---
echo.
echo ============================================
echo    Servidor detenido.
echo    Revisa los mensajes de arriba.
echo ============================================
echo.
pause
