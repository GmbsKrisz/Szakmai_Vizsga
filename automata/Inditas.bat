@echo off
echo =========================================
echo  Switch Konfigurator API Inditasa...
echo =========================================
echo.

:: Python szerver indítása egy új, külön ablakban
start "Switch API Szerver" cmd /c "python app.py"

echo Varakozas a szerver indulasara...
timeout /t 2 /nobreak >nul

:: Böngésző megnyitása a lokális szerver címével
start http://localhost:5000

:: Bezárja ezt a kis fekete ablakot
exit
