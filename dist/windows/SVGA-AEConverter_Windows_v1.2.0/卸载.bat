@echo off
chcp 65001 >nul
setlocal
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.errnull.SVGAConverter_AE"
if exist "%DEST%" (
    rd /s /q "%DEST%"
    echo 已卸载：%DEST%
) else (
    echo 未找到已安装的扩展。
)
echo （CEP 调试模式注册表项保持原样，不影响其他插件）
pause