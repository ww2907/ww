@echo off
chcp 936 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"
title 食光登录系统 - 一键启动

rem ============================================================
rem  食光登录系统 · 一键启动（检查MySQL + 后端8081 + 前端5173）
rem  特点：GBK编码 / 相对路径 / 不依赖 node_modules 与 target（缺失自动补）
rem  说明：本文件必须保持 GBK 编码 + CRLF 换行，用记事本或 IDE 另存为
rem        UTF-8 会导致中文注释乱码甚至脚本行为异常
rem ============================================================

rem ---- 0. 清理端口劫持环境变量（重要，勿删） ----
rem WorkBuddy/IDE 的终端里可能带有 SERVER__PORT 变量，Spring Boot 的
rem 松散绑定会把它当成 server.port，而它指向的端口被 IDE 自己占用，
rem 会导致后端起不来，所以这里必须显式清空
set "SERVER__PORT="
set "SERVER_PORT="

rem ---- 1. 定位 JAVA_HOME（mvnw 必需） ----
if defined JAVA_HOME goto :java_ok
if exist "C:\Program Files\Java\jdk-17\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-17" & goto :java_ok
if exist "C:\Program Files\Zulu\zulu-21\bin\java.exe" set "JAVA_HOME=C:\Program Files\Zulu\zulu-21" & goto :java_ok
for /f "delims=" %%j in ('where java 2^>nul') do set "JAVA_HOME=%%~dpj.." & goto :java_ok
:java_ok
if not defined JAVA_HOME (
    echo [错误] 找不到 JDK（需要 17 或以上），请先安装
    pause & exit /b 1
)
echo [环境] JAVA_HOME = %JAVA_HOME%

rem ---- 2. 定位 npm ----
where npm >nul 2>&1
if not errorlevel 1 goto :npm_ok
for /d %%v in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do set "NODE_DIR=%%v"
if defined NODE_DIR set "PATH=%NODE_DIR%;%NODE_DIR%\node_modules\npm\bin;%PATH%"
set "NODE_DIR="
where npm >nul 2>&1
if not errorlevel 1 goto :npm_ok
if exist "D:\Program Files\nodejs\npm.cmd" set "PATH=D:\Program Files\nodejs;%PATH%"
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 找不到 npm，请安装 Node.js 18 或以上版本
    pause & exit /b 1
)
:npm_ok
echo [环境] npm 已就绪

rem ---- 3. 定位 mysql.exe 并确保数据库存在 ----
set "MYSQL_BIN="
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not defined MYSQL_BIN if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
if not defined MYSQL_BIN for /d %%d in ("C:\Program Files\MySQL\MySQL Server *") do if not defined MYSQL_BIN if exist "%%d\bin\mysql.exe" set "MYSQL_BIN=%%d\bin\mysql.exe"
if not defined MYSQL_BIN (
    echo [错误] 找不到 mysql.exe，请确认 MySQL 已安装
    pause & exit /b 1
)
"%MYSQL_BIN%" -uroot -p123456 -e "USE shiguang_food;" >nul 2>&1
if errorlevel 1 (
    echo [数据库] shiguang_food 不存在，正在执行 springBootTest\sql\init.sql 初始化...
    "%MYSQL_BIN%" -uroot -p123456 --default-character-set=utf8mb4 < "springBootTest\sql\init.sql"
    echo [数据库] 初始化完成（含演示账号 demo / 123456）
) else (
    echo [数据库] shiguang_food 已就绪
)

rem ---- 4. 启动后端（首次会自动下载 Maven 与依赖，需联网，较慢） ----
echo [后端] 编译并启动 Spring Boot，端口 8081 ...
start "shiguang-backend-8081" /D "%~dp0springBootTest" cmd /k mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"

rem ---- 5. 等待 8081 就绪（最长 5 分钟，首次下载依赖会较久） ----
echo [等待] 后端启动中...
set /a n=0
:wait8081
set /a n+=1
if !n! gtr 100 (
    echo [警告] 等待超时，请查看标题为 shiguang-backend-8081 的窗口日志
    goto :frontend
)
netstat -ano | findstr /R /C:":8081  *.*LISTENING" >nul 2>&1
if errorlevel 1 (
    timeout /t 3 /nobreak >nul
    goto :wait8081
)
echo [后端] 已就绪: http://localhost:8081

:frontend
rem ---- 6. 前端依赖 + 启动 ----
if not exist "shiguang-food-login\node_modules" (
    echo [前端] 未发现 node_modules，正在安装依赖，约 1-2 分钟...
    pushd "shiguang-food-login"
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [错误] npm install 失败，请检查网络后重试
        popd
        pause & exit /b 1
    )
    popd
)
echo [前端] 启动 Vite，端口 5173 ...
start "shiguang-frontend-5173" /D "%~dp0shiguang-food-login" cmd /k npm run dev

echo.
echo ============================================================
echo   启动完成！
echo     前端页面 : http://localhost:5173/login
echo     后端接口 : http://localhost:8081
echo     数据库   : shiguang_food （root / 123456）
echo     测试账号 : demo / 123456
echo   停止全部服务请运行 stop-all.bat
echo ============================================================
pause
