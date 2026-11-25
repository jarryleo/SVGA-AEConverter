# 打包脚本：生成 Windows / Mac 免签安装包（无需 ZXP 签名）
# 用法：pwsh -File tools/package.ps1

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$source = Join-Path $root "source"
$pkg = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $pkg.version
$stamp = Get-Date -Format "yyyyMMdd"
$outRoot = Join-Path $root "dist"
$extName = "com.errnull.SVGAConverter_AE"

function Write-Step($t) { Write-Host "[package] $t" -ForegroundColor Cyan }

function New-Stage($dest) {
    if (Test-Path $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
    New-Item -ItemType Directory -Path $dest | Out-Null
    $ext = Join-Path $dest $extName
    New-Item -ItemType Directory -Path $ext | Out-Null
    foreach ($d in @("CSXS", "jsx", "src", "pngquant", "node_modules")) {
        Copy-Item -LiteralPath (Join-Path $source $d) -Destination $ext -Recurse
    }
    Copy-Item -LiteralPath (Join-Path $source "index.html") -Destination $ext
    Copy-Item -LiteralPath (Join-Path $root "updateInfo") -Destination $ext
    Get-ChildItem -Path $ext -Recurse -Filter ".DS_Store" -Force -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
    return $ext
}

function WriteUtf8Crlf($path, $text) {
    $text = $text -replace "`r`n", "`n"
    $text = $text -replace "`n", "`r`n"
    [IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

function WriteUtf8Lf($path, $text) {
    $text = $text -replace "`r`n", "`n"
    [IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

# ---------------- Windows ----------------
Write-Step "构建 Windows 包 ..."
$winDir = Join-Path $outRoot "windows\SVGA-AEConverter_Windows_v${version}"
$ext = New-Stage $winDir

$installBat = @'
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
'@
$uninstallBat = @'
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
'@
WriteUtf8Crlf (Join-Path $winDir "安装.bat") $installBat
WriteUtf8Crlf (Join-Path $winDir "卸载.bat") $uninstallBat

$winReadme = @'
SVGA-AEConverter —— After Effects 转 SVGA 插件（Windows 版）
=========================================================

版本：v{version}
支持宿主：After Effects CC 2015 ~ 2024 及更高版本（CEP 扩展）

一、安装
---------------------------------------------------------
1. 关闭 After Effects；
2. 解压本压缩包到任意目录（建议路径不含空格）；
3. 双击“安装.bat”；
4. 打开 After Effects，进入 编辑 > 偏好设置 > 常规，
   勾选“允许脚本写入文件和访问网络”，然后重启 After Effects；
5. 菜单 窗口 > 扩展 > SVGAConverter_AE 即可打开插件面板。

安装位置：%APPDATA%\Adobe\CEP\extensions\com.errnull.SVGAConverter_AE
（用户级安装，无需管理员权限）

二、使用
---------------------------------------------------------
1. 打开并保存要转换的 .aep 工程，双击激活目标合成；
2. 面板中点击“选择输出路径”，选一个 .svga 保存位置；
3. 点击“开始转换”，稍等片刻生成 .svga 文件并自动预览；
4. 也可点“选择播放文件”直接预览本地 .svga；
   鼠标右键可开始/暂停播放。

三、常见问题
---------------------------------------------------------
* 菜单里看不到 SVGAConverter_AE：
  - 确认已重启 After Effects；
  - 重新双击“安装.bat”，它会写入 PlayerDebugMode 注册表；
  - 检查杀毒软件是否拦截了对 %APPDATA%\Adobe\CEP 的写入。
* 提示“转换脚本执行失败”：先确认工程已保存、并激活了一个合成（Comp），
  而不是素材或文件夹。
* 导出后元素有重影：请把每个元素的时间对齐到整帧
  （图层的入点/出点落在整帧边界），或在面板里确认工程帧率是
  1/2/3/4/5/6/10/12/15/20/30/60 这类能整除 60 的帧率。
* 图片压缩（pngquant）失败不影响导出，只是文件体积会略大。

四、卸载
---------------------------------------------------------
双击“卸载.bat”后重启 After Effects 即可。
'@
$winReadme = $winReadme.Replace("{version}", $version)
WriteUtf8Crlf (Join-Path $winDir "使用说明.txt") $winReadme

$winZip = Join-Path $outRoot "SVGA-AEConverter_Windows_v${version}_${stamp}.zip"
if (Test-Path $winZip) { Remove-Item $winZip -Force }
Compress-Archive -Path (Join-Path $winDir "*") -DestinationPath $winZip -CompressionLevel Optimal

# ---------------- macOS ----------------
Write-Step "构建 macOS 包 ..."
$macDir = Join-Path $outRoot "mac\SVGA-AEConverter_Mac_v${version}"
$ext = New-Stage $macDir

$installCmd = @'
#!/bin/bash
cd "$(dirname "$0")" || exit 1
SRC="$(pwd)/com.errnull.SVGAConverter_AE"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.errnull.SVGAConverter_AE"

echo "=========================================="
echo "  SVGA-AEConverter 安装程序 (macOS)"
echo "=========================================="
echo

if [ ! -d "$SRC" ]; then
  echo "[错误] 找不到扩展目录，请确认压缩包已完整解压。"
  read -r -p "按回车退出..." _
  exit 1
fi

echo "请先退出 After Effects，然后按回车继续安装..."
read -r _

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST" || { echo "[错误] 复制失败"; read -r -p "按回车退出..." _; exit 1; }

# 恢复可执行权限（zip 传输可能丢失）
chmod -R 755 "$DEST/pngquant/OSX/pngquant" 2>/dev/null

echo "正在开启 CEP 调试模式（未签名扩展必需）..."
for v in 6 7 8 9 10 11 12; do
  defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1
  defaults write "com.adobe.CSXS.$v" LogLevel 6
done

echo
echo "安装完成：$DEST"
echo
echo "接下来请在 After Effects 中操作："
echo "  1. 编辑 > 偏好设置 > 常规 > 勾选“允许脚本写入文件和访问网络”"
echo "  2. 重新启动 After Effects"
echo "  3. 窗口 > 扩展 > SVGAConverter_AE"
echo
read -r -p "按回车退出..." _
'@
$uninstallCmd = @'
#!/bin/bash
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.errnull.SVGAConverter_AE"
if [ -d "$DEST" ]; then
  rm -rf "$DEST"
  echo "已卸载：$DEST"
else
  echo "未找到已安装的扩展。"
fi
echo "（CEP 调试模式设置保持原样，不影响其他插件）"
read -r -p "按回车退出..." _
'@
WriteUtf8Lf (Join-Path $macDir "安装.command") $installCmd
WriteUtf8Lf (Join-Path $macDir "卸载.command") $uninstallCmd

$macReadme = @'
SVGA-AEConverter —— After Effects 转 SVGA 插件（macOS 版）
=========================================================

版本：v{version}
支持宿主：After Effects CC 2015 ~ 2024 及更高版本（CEP 扩展）

一、安装（推荐：脚本安装）
---------------------------------------------------------
1. 退出 After Effects；
2. 解压压缩包；
3. 首次运行若提示“无法打开，因为来自身份不明的开发者”：
   - 在“安装.command”上右键 → 打开 → 仍要打开；或
   - 打开终端执行：xattr -cr <解压后的目录>
4. 双击“安装.command”，按提示回车完成安装；
   若双击没有任何反应（zip 解压后可能丢失执行权限），在终端执行：
   cd <解压后的目录>
   chmod +x 安装.command && ./安装.command
5. 打开 After Effects，进入 After Effects > 偏好设置（Settings）> 常规，
   勾选“允许脚本写入文件和访问网络”，然后重启 After Effects；
6. 菜单 窗口 > 扩展 > SVGAConverter_AE 即可打开插件面板。

安装位置：~/Library/Application Support/Adobe/CEP/extensions/com.errnull.SVGAConverter_AE

二、安装（手动方式，脚本跑不通时用）
---------------------------------------------------------
1. 打开 Finder，按 Shift+Cmd+G，输入：
   ~/Library/Application Support/Adobe/CEP/extensions
   （若没有 extensions 目录就新建一个）
2. 把压缩包里的 com.errnull.SVGAConverter_AE 整个文件夹拷进去；
3. 打开终端执行（逐行）：
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   chmod +x "~/Library/Application Support/Adobe/CEP/extensions/com.errnull.SVGAConverter_AE/pngquant/OSX/pngquant"
4. 重启 After Effects。

三、使用
---------------------------------------------------------
1. 打开并保存要转换的 .aep 工程，双击激活目标合成；
2. 面板中点击“选择输出路径”，选一个 .svga 保存位置；
3. 点击“开始转换”，稍等片刻生成 .svga 并自动预览；
4. 也可点“选择播放文件”直接预览本地 .svga；
   鼠标右键可开始/暂停播放。

四、常见问题
---------------------------------------------------------
* 菜单里看不到 SVGAConverter_AE：
  - 确认已重启 After Effects；
  - 重新执行安装脚本（会写入 PlayerDebugMode）；
  - Apple 芯片机型若插件面板能开但导出报错，多半是缺少 Rosetta，
    可在终端执行：softwareupdate --install-rosetta
* 图片压缩（pngquant）失败不影响导出，只是文件体积会略大；
  自带的 pngquant 是 Intel(x86_64) 版。
* 导出后元素有重影：请把每个元素的入点/出点对齐到整帧边界。
* 若提示“不支持的文件格式”，请确认工程已保存且激活的是合成（Comp）。

五、卸载
---------------------------------------------------------
双击“卸载.command”，或手动删除上述安装位置下的
com.errnull.SVGAConverter_AE 文件夹，然后重启 After Effects。
'@
$macReadme = $macReadme.Replace("{version}", $version)
WriteUtf8Lf (Join-Path $macDir "使用说明.txt") $macReadme

$macZip = Join-Path $outRoot "SVGA-AEConverter_Mac_v${version}_${stamp}.zip"
if (Test-Path $macZip) { Remove-Item $macZip -Force }
Compress-Archive -Path (Join-Path $macDir "*") -DestinationPath $macZip -CompressionLevel Optimal

Write-Step ("Windows 包：" + $winZip)
Write-Step ("macOS 包：" + $macZip)
