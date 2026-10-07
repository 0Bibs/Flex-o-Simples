@echo off
REM Cria o atalho do Flexo Simples. Basta dar duplo clique neste arquivo.
title Flexo Simples - criar atalho
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar-atalho.ps1"
echo.
pause
