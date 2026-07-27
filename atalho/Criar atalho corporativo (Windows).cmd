@echo off
REM Cria o atalho do Flexo Simples no tema corporativo (cinza e amarelo).
title Flexo Simples - criar atalho corporativo
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar-atalho.ps1" -Tema corporativo
echo.
pause
