# SVGA-AEConverter

After Effects CC plugin for converting animations to SVGA source file.

## Installation

Download the latest build for your platform (latest version: **v1.3.0**, 2026-11-27):

* Windows: [SVGA-AEConverter_Windows_v1.3.0_20261127.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.3.0/SVGA-AEConverter_Windows_v1.3.0_20261127.zip)
* macOS: [SVGA-AEConverter_Mac_v1.3.0_20261127.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.3.0/SVGA-AEConverter_Mac_v1.3.0_20261127.zip)

### windows

* Unzip the downloaded Windows package;
* Double-click **安装.bat** (installs into the user-level CEP extensions folder, no administrator required);
* Open After Effects, check **Edit > Preferences > General > Allow Scripts to Write Files and Access Network**, then restart After Effects;
* Select the **SVGA-AEConverter** extension on Window > Extensions > SVGAConverter_AE;
* Select 输出路径 > 开始转换 
* Wait a moment, SVGA source file Will be generated in the directory you choose;
* You can click 选择播放文件 to selete the local SVGA for preview;
* Use the Right Button to start / pause the preview.

### mac 
* Unzip the downloaded macOS package;
* If Gatekeeper blocks the script, right-click **安装.command** → Open (or run `xattr -cr <unzipped folder>` in Terminal), then double-click **安装.command** to install;
* Open After Effects, check **After Effects > Preferences > General > Allow Scripts to Write Files and Access Network**, then restart After Effects;
* Select the **SVGA-AEConverter** extension on Window > Extensions > SVGAConverter_AE;
* Select 输出路径 > 开始转换 
* Wait a moment, the SVGA source file Will be generated in the directory you choose;
* You can click 选择播放文件 to selete the local SVGA for preview;
* Use the Right Button to start / pause the preview.

### Allow Scripts to Write Files and Access Network

Go to Edit > Preferences > General > and check on "Allow Scripts to Write Files and Access Network"

## SVGA File Test

To test whether the SVGA source file is working properly：
1. Use the button 选择播放文件 to selete the local SVGA for preview;
2. Open http://svga.io/svga-preview.html, Drag a SVGA source file or select a file for preview。

## What's new (v1.3.0)

* **文件体积优化**: panel dropdown `PNG（兼容优先）` / `WebP 无损` / `WebP 有损 q80`; cwebp ships with the extension and falls back to PNG on failure. Entries keep the `.png` name with WebP bytes inside, so 1.x ZIP key lookup still works;
* **内存占用优化** switch turns the whole trim / prune / stronger-pngquant pass off for A/B comparison;
* **Runtime-replace layers keep their original size**: layers named with `avatar` / `nick` / `id` (case-insensitive, spaces optional) are never trimmed, and their texture key is the layer name itself (`nick 2` -> `nick2`);
* **Export progress**: per-stage text with an indeterminate bar, per-texture `n/N` during encoding, elapsed seconds, and total duration on completion;
* Panel player patched to decode WebP textures, so "选择播放文件" plays WebP `.svga` files too;
* UI: author credit and memory estimate moved to their own row aligned with the canvas; both export options carry hover tooltips.

## What's new (v1.2.0)

* Works with After Effects CC 2015 through 2024 and later (`[13.0,99.9]` host range);
* Fixed ghosting where two elements of consecutive frames showed up in the same frame;
* Fixed the "cannot find Temp.aep" alert that appeared on every export;
* The generated SVGA is previewed in the panel right after a successful export;
* Android texture memory estimate (ARGB_8888) shown at the bottom-right of the panel;
* Author credit at the bottom-left; click it to open the GitHub repository.

## Export optimization

Exports now trim transparent borders per texture (with `layout` / `matrix` compensation), drop fully transparent elements together with their images, and run pngquant in a stricter mode. Layers whose name contains `avatar`, `nick` or `id` (case-insensitive, spaces optional) are left untouched so runtime image replacement with same-size art keeps working; the legacy `#dynamic` / `#replace` markers still work, and sprites with masks are skipped.

### Image format (PNG / WebP)

The panel's "文件体积优化" dropdown offers `PNG（兼容优先）` (default, pngquant 256-color PNG), `WebP 无损` (usually 20%~35% smaller than PNG, lossless) and `WebP 有损 q80` (much smaller on gradients, slight ringing on text). WebP does not reduce texture memory. Compatibility depends on the player: Android decodes through `BitmapFactory`, while iOS needs iOS 14+ (iOS 13 and below cannot read WebP). Entries keep the `.png` suffix with WebP bytes inside, so 1.x ZIP key lookup still works; if cwebp fails the file silently stays PNG.

### Export optimization switch

The "内存占用优化" dropdown turns the whole optimization pass (trim / fully transparent removal / stronger pngquant) on or off, which is handy for A/B comparison.



```
---------------- 中英文分割线 ------------------
```


# SVGA-AEConverter

本工具适用于 After Effects CC 系列，使用本工具可以将 AEP 文件转换为 SVGA 文件。

> 当前分支已做版本兼容改造：`CSXS/manifest.xml` 的宿主版本区间放宽为 `[13.0,99.9]`，即 **AE CC 2015 至 2024 及后续版本**都可加载；面板/脚本层补充了不同 AE 版本的路径、渲染模板、序列帧命名差异处理。

## 本机安装（Windows，任意 AE 版本）

```
pwsh -File install.ps1          # 重建 jsx/svga.jsx + 用户级安装 + 开启 CEP 调试模式
pwsh -File install.ps1 -MachineWide   # 需要管理员：同时装到 Program Files 的 CEP 目录
```

安装后重启 After Effects，在 窗口 > 扩展 > SVGAConverter_AE 打开面板。

修改转换逻辑后，`source/app/svga.js`、`source/converter/converter.js`、`source/writer/writer.js` 属于编译产物，需要和同名 `.ts` 同步修改（或安装 TypeScript 后重新 `tsc source/app/svga.ts --target ES5`），再执行一次 `install.ps1` 即可生效。

## 用法

请按平台下载最新安装包（最新版本：**v1.3.0**，2026-11-27）：

* Windows：[SVGA-AEConverter_Windows_v1.3.0_20261127.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.3.0/SVGA-AEConverter_Windows_v1.3.0_20261127.zip)
* macOS：[SVGA-AEConverter_Mac_v1.3.0_20261127.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.3.0/SVGA-AEConverter_Mac_v1.3.0_20261127.zip)

### windows

* 解压下载的 Windows 包;
* 双击 **安装.bat**（安装到当前用户的 CEP 扩展目录，无需管理员权限）;
* 打开 After Effects，在 编辑 > 偏好设置 > 常规 勾选"允许脚本写入文件和访问网络"，然后重启 AE;
* 选择菜单 > 窗口 > 扩展 > SVGAConverter_AE;
* 选择 输出路径 > 开始转换 稍等片刻，SVGA 文件就会生成在您所输出的目录并自动播放（面板右下角同时显示该动画在安卓设备上的预估内存占用）;
* 您也可以直接点击 选择播放文件 直接播放本地的 *.svga文件;
* 使用鼠标右键可以 开始/暂停播放。

### mac 
* 解压下载的 macOS 包;
* 若提示"来自身份不明的开发者"，在 安装.command 上右键 → 打开（或终端执行 xattr -cr <解压目录>），再双击 安装.command 完成安装;
* 打开 After Effects，在 偏好设置 > 常规 勾选"允许脚本写入文件和访问网络"，然后重启 AE;
* 选择菜单 > 窗口 > 扩展 > SVGAConverter_AE;
* 选择 输出路径 > 开始转换 稍等片刻，SVGA 文件就会生成在您所输出的目录并自动播放（面板右下角同时显示该动画在安卓设备上的预估内存占用）;
* 您也可以直接点击 选择播放文件 直接播放本地的 *.svga文件;
* 使用鼠标右键可以 开始/暂停播放。

### 内存占用优化（透明边裁剪 / 全透明剔除）

面板上"内存占用优化"打开时（默认），导出会自动做三件事，控制台会打印 `svga optimize: ...` 统计：

1. **全透明元素剔除**：整段 alpha 都为 0 的元素及其贴图直接不写入，`images` 映射里只保留仍被引用的 key；
2. **透明边裁剪**：每张贴图裁到 alpha 包围盒，并把裁剪偏移换算进 `layout` 宽高与 `matrix` 的 `tx/ty`，播放位置、缩放、旋转都不变；
3. **PNG 压缩硬化**：pngquant 由 `--speed 2 --quality 0-100` 改为 `--speed 1 --quality 0-85`（稍慢，体积更小）。

> ⚠️ **要用同尺寸图片运行时替换的图层，必须保留原尺寸，因此要跳过裁剪。**
> SVGA 播放器只能把整张位图铺进 `layout` 矩形，裁剪之后运行时再用"原尺寸图片"替换，就会被打回裁剪框里造成拉伸/偏移。
> **命名规则**：图层名里包含 `avatar`、`nick`、`id` 的（大小写不敏感、空格可有可无）都会自动跳过裁剪与剔除，例如 `avatar1`、`nick 2`、`id3`。
> `id` 建议独立成词或带编号（`id`、`id2`、`xxx_id`），避免误伤 `video`、`grid` 这类单词。
> 被判定为替换用图的图层，贴图名 / `imageKey` 会直接使用图层名（去掉空格与非法字符），例如 `nick 2` → key `nick2`、`avatar 1` → key `avatar1`，运行时按这个 key 传图即可。
> 老写法 `#dynamic` / `#replace` 依然有效；纯装饰贴图不要带这些字样，才能省下更多内存。
> 带遮罩（mask/clipPath）的元素会自动跳过裁剪，避免遮罩与贴图错位。

### 文件体积优化（PNG / WebP）

面板上的"文件体积优化"下拉：

* `PNG（兼容优先）`：默认。pngquant 输出 256 色 PNG，所有 SVGA 播放器都能读；
* `WebP 无损`：cwebp 无损编码，通常比 PNG 再小 20%~35%，无画质损失；
* `WebP 有损 q80`：更小，渐变/光效类素材常见再降 40%~60%，文字与描边会有轻微振铃。

⚠️ 换格式**只减体积、不降内存**（解码后仍是 ARGB_8888）。WebP 的可播性取决于目标端播放器：Android 走 `BitmapFactory`（4.3+ 基本都支持），iOS 走 `UIImage`，**iOS 13 及以下不支持 WebP**。面板里的预览是 Chromium，能播不代表真机能播，务必真机验证后再改默认档位。
打包时文件名仍保持 `.png`（内容替换成 WebP 字节），保证 1.x ZIP 的 imageKey 查找逻辑不变；cwebp 失败会自动回退 PNG 并在控制台提示。

> 面板内播放器已打了补丁：识别到 `UklGR`（WebP）前缀时改用 `image/webp` 的 data URL 解码。所以 WebP 的 .svga 在面板里能直接播，包括用“选择播放文件”打开本地 WebP 文件。

### 内存占用优化开关

面板上的"内存占用优化"下拉选「关」可以整体关闭透明边裁剪 / 全透明元素剔除 / 强压缩，回到原始导出行为，便于 A/B 对比排查。关闭时控制台仍会打印产物大小，方便直接比较。

### 允许脚本读取和写入文件

启动 After Effects，选择菜单 编辑 > 偏好设置 > 常规 > 在 "允许脚本读取和写入文件" 一项打勾

## 测试

要测试生成文件是否可以正常使用：
1. 使用 菜单 > 窗口 > 扩展 > SVGAConverter_AE 直接播放本地 SVGA 文件;
2. 使用浏览器，打开 http://svga.io/svga-preview.html ，选择或拖入 SVGA 源文件，即可预览动画效果。

## 更新记录

### v1.3.0（2026-11-27）

* 新增"文件体积优化"下拉：PNG（兼容优先）/ WebP 无损 / WebP 有损 q80，cwebp 随扩展分发，失败自动回退 PNG；包内文件名仍为 `.png`（内容为 WebP），1.x ZIP 的 key 查找逻辑不变;
* 新增"内存占用优化"开关：可整体关闭透明边裁剪 / 全透明元素剔除 / 强压缩，便于 A/B 对比;
* 运行时替换用图改用命名规则：图层名包含 `avatar` / `nick` / `id`（大小写不敏感、空格可有可无）即跳过裁剪与剔除、保留原尺寸，贴图 key 直接用图层名（如 `nick 2` → `nick2`）；老写法 `#dynamic` / `#replace` 继续有效;
* 新增导出进度：分阶段文案（准备 / 渲染 / 优化 / 打包）+ 编码贴图逐张 `n/N` 百分比 + 已用秒数，完成后显示总耗时;
* 面板内置播放器打补丁，支持 WebP 贴图预览，"选择播放文件"也能直接播放 WebP 的 .svga;
* UI：署名与内存预估独立成行并与画布左右对齐；两个导出选项增加 `?` 悬浮说明（优化效果与弊端）。

### v1.2.0（2026-11-25）

* 兼容 After Effects CC 2015 ~ 2024 及后续版本（宿主版本区间放宽到 `[13.0,99.9]`）;
* 修复序列帧动画"同一帧出现前后两个元素"的重影问题：采样改为整帧对齐 + 半开区间 `[inPoint, outPoint)`，并消除浮点累加误差;
* 修复每次导出必弹"找不到工程文件 Temp.aep"的问题（改为先保存再校验）;
* 新增：导出成功后自动在面板内预览播放生成的 SVGA;
* 新增：面板右下角显示安卓预估内存占用（按 ARGB_8888 计算 `Σ(宽×高×4)`，单位 MB，保留两位小数）;
* 新增：面板左下角作者署名，点击跳转 GitHub 仓库;
* 面板显示版本号由 `package.json` 在构建时自动注入，不再手改。

### v1.1.0（2026-11-25）

* 首个双平台免签名分发包：zip + 安装脚本（`安装.bat` / `安装.command`），无需管理员权限、无需 ZXP Installer。


