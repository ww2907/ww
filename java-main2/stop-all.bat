@echo off
chcp 936 >nul
title 食光登录系统 - 停止服务
setlocal enabledelayedexpansion

echo [停止] 正在结束后端（端口 8081）与前端（端口 5173）...

rem ---- 方式一：按端口 LISTENING 精确结束（先拿 PID 再 kill，避免误杀 TIME_WAIT） ----
for %%p in (8081 5173) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%p% " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%i >nul 2>&1 && echo   - 已结束 PID %%i ^(端口 %%p^)
    )
)

rem ---- 方式二：按窗口标题兜底（bat 启动时打的标题，防止端口复用导致漏杀） ----
taskkill /F /FI "WINDOWTITLE eq shiguang-backend-8081*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq shiguang-frontend-5173*" >nul 2>&1

rem ---- 方式三：按进程名兜底（mvnw/java 的 cmd 宿主、node/vite） ----
taskkill /F /FI "IMAGENAME eq java.exe" >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" >nul 2>&1

echo.
echo 已尝试停止前后端进程（MySQL 服务保持运行）。
echo 若仍有残留，请手动在任务管理器结束 java.exe / node.exe。
pause
