# SVGA-AEConverter 通用安装脚本（适配 AE CC 2015 ~ 2024+ 任意版本）
# 用法：pwsh -File install.ps1            # 重建 jsx 并按用户级安装（免管理员）
#       pwsh -File install.ps1 -SkipBuild # 跳过 jsx 重建，只安装
#       pwsh -File install.ps1 -MachineWide # 额外复制到 Program Files（需要管理员）

param(
    [switch]$SkipBuild,
    [switch]$MachineWide
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "source"
$jsxOut = Join-Path $source "jsx\svga.jsx"
$stage = Join-Path $root "build\com.errnull.SVGAConverter_AE"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 版本号唯一来源：package.json
$pkg = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $pkg.version

function Write-Step($text) { Write-Host "[SVGA] $text" -ForegroundColor Cyan }

# 把面板左下角署名里的 <span id="authorVersion"> 注入为 package.json 的版本号
function Set-PanelVersion($htmlPath) {
    if (-not (Test-Path -LiteralPath $htmlPath)) { return }
    $html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
    $pattern = '(<span id="authorVersion">)([^<]*)(</span>)'
    if ([regex]::IsMatch($html, $pattern)) {
        $injected = [regex]::Replace($html, $pattern, '${1}v' + $version + '${3}')
        [System.IO.File]::WriteAllText($htmlPath, $injected, $utf8NoBom)
        Write-Step "面板版本号注入：v$version"
    } else {
        Write-Step "面板版本号注入：未找到占位标签，跳过（v$version）"
    }
}

# 1. 重建 jsx/svga.jsx：等价于 gulpfile.js 里的 concat 任务
if (-not $SkipBuild) {
    Write-Step "重建 jsx/svga.jsx ..."
    $parts = @(
        (Join-Path $root "es5-shim.js"),
        (Join-Path $root "es5-sham.js"),
        (Join-Path $root "transformation-matrix.js"),
        (Join-Path $root "json2.js"),
        (Join-Path $root "bezier.js"),
        (Join-Path $source "converter\converter.js"),
        (Join-Path $source "writer\writer.js"),
        (Join-Path $source "app\svga.js")
    )
    $sb = New-Object System.Text.StringBuilder
    foreach ($p in $parts) {
        if (-not (Test-Path -LiteralPath $p)) { throw "缺少构建文件：$p" }
        [void]$sb.Append([System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8))
        [void]$sb.Append("`n")
    }
    [System.IO.File]::WriteAllText($jsxOut, $sb.ToString(), $utf8NoBom)
    Write-Step ("jsx/svga.jsx 已生成，大小 " + (Get-Item $jsxOut).Length + " 字节")
}

# 2. 组装扩展目录
Write-Step "组装扩展目录 ..."
if (Test-Path $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

foreach ($dir in @("CSXS", "jsx", "src", "pngquant", "node_modules")) {
    Copy-Item -LiteralPath (Join-Path $source $dir) -Destination $stage -Recurse
}
Copy-Item -LiteralPath (Join-Path $source "index.html") -Destination $stage
Copy-Item -LiteralPath (Join-Path $root "updateInfo") -Destination $stage

# 面板左下角署名版本号：由 package.json 注入
Set-PanelVersion (Join-Path $stage "index.html")

# 去掉 macOS 打包残留的 .DS_Store，避免 CEP 误读
Get-ChildItem -Path $stage -Recurse -Filter ".DS_Store" -Force -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

# 3. 打开 CEP 调试模式（未签名扩展必须开启才能被 AE 加载）
Write-Step "开启 CEP PlayerDebugMode ..."
foreach ($v in 6..12) {
    $key = "HKCU:\Software\Adobe\CSXS.$v"
    if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
    New-ItemProperty -Path $key -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $key -Name "LogLevel" -Value "6" -PropertyType String -Force | Out-Null
}

# 4. 安装到 CEP 扩展目录
$targets = @((Join-Path $env:APPDATA "Adobe\CEP\extensions"))
if ($MachineWide) {
    $targets += "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions"
    $targets += "C:\Program Files\Common Files\Adobe\CEP\extensions"
}

foreach ($target in $targets) {
    if (-not (Test-Path $target)) {
        try { New-Item -ItemType Directory -Path $target -Force | Out-Null } catch { continue }
    }
    $dest = Join-Path $target "com.errnull.SVGAConverter_AE"
    try {
        if (Test-Path $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
        Copy-Item -LiteralPath $stage -Destination $dest -Recurse
        Write-Step "已安装：$dest"
    } catch {
        Write-Host "[SVGA] 跳过 $dest （无写入权限，可加 -MachineWide 以管理员运行）" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "安装完成。请在 After Effects 中操作：" -ForegroundColor Green
Write-Host "  1. 编辑 > 偏好设置 > 常规 > 勾选“允许脚本写入文件和访问网络”"
Write-Host "  2. 重新启动 After Effects"
Write-Host "  3. 窗口 > 扩展 > SVGAConverter_AE"
Write-Host "提示：若扩展未出现，重启一次 AE 或运行 regedit 确认 PlayerDebugMode=1"
