@echo off
chcp 936 >nul
title 食光登录系统 - 停止服务

echo [停止] 正在结束后端（端口 8081）...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1

echo [停止] 正在结束前端（端口 5173）...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1

echo.
echo 已停止前后端（MySQL 服务保持运行）。
pause
