@echo off
chcp 65001 >nul
setlocal
echo ==========================================
echo   SVGA-AEConverter 安装程序 (Windows)
echo ==========================================
echo.

set "SRC=%~dp0com.errnull.SVGAConverter_AE"
if not exist "%SRC%" (
    echo [错误] 找不到扩展目录，请确认压缩包已完整解压。
    pause
    exit /b 1
)

echo 请先退出 After Effects，然后按任意键继续安装...
pause >nul

set "DEST=%APPDATA%\Adobe\CEP\extensions\com.errnull.SVGAConverter_AE"
if exist "%DEST%" (
    echo 检测到已安装版本，正在覆盖...
    rd /s /q "%DEST%"
)
if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"

xcopy "%SRC%" "%DEST%\" /E /I /Q /Y >nul
if errorlevel 1 (
    echo [错误] 复制失败，请检查文件权限或关闭占用该目录的程序。
    pause
    exit /b 1
)

echo 正在开启 CEP 调试模式（未签名扩展必需）...
for %%v in (6 7 8 9 10 11 12) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v LogLevel /t REG_SZ /d 6 /f >nul 2>&1
)

echo.
echo 安装完成：%DEST%
echo.
echo 接下来请在 After Effects 中操作：
echo   1. 编辑 ^> 偏好设置 ^> 常规 ^> 勾选“允许脚本写入文件和访问网络”
echo   2. 重新启动 After Effects
echo   3. 窗口 ^> 扩展 ^> SVGAConverter_AE
echo.
pause