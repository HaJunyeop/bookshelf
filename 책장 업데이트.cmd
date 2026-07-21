@echo off
chcp 65001 > nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-bookshelf.ps1" -Publish
echo.
echo 업데이트가 끝났습니다. 아무 키나 누르면 닫힙니다.
pause > nul
