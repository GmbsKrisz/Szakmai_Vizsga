@echo off
title Switch Konfigurator
color 0A
echo Szerver inditasa... kerlek varj egy picit!
echo.

:: Flask inditasa egy parhuzamos szalon, hogy ne akassza meg a bat futasat
start /B python app.py

:: Varunk 4 masodpercet, hogy a Python biztosan felebredjen
timeout /t 4 /nobreak >nul

:: Bongeszo megnyitasa
start http://127.0.0.1:5000

echo.
echo A bongeszonek most mar be kellett toltodnie.
echo Ha megse, csak nyomj egy F5-ot (Frissites)!
echo.
echo [A SZERVER FUT... BEZARASHOZ X-ELD KI EZT AZ ABLAKOT]
pause >nul