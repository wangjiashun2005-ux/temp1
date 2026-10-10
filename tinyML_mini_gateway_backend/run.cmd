@echo off
REM TinyML 网关模拟设备层启动脚本
REM 依赖已打包进 fat jar，直接以 java -jar 运行
cd /d %~dp0
"C:\Program Files\Java\latest\jdk-17\bin\java.exe" -jar target\tinyml-gateway-backend.jar
