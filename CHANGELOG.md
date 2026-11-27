# Changelog

## v1.3.0 — 2026-11-27

### 新增

* **文件体积优化**：面板新增图片格式下拉，可选 `PNG（兼容优先）` / `WebP 无损` / `WebP 有损 q80`。cwebp（Windows/macOS 双平台二进制）随扩展分发，转码失败自动回退 PNG；包内文件名仍保留 `.png` 扩展（内容为 WebP），1.x ZIP 的 imageKey 查找逻辑不变；面板预览已打补丁支持 WebP 贴图。
* **内存占用优化开关**：可整体关闭透明边裁剪 / 全透明元素剔除 / 强压缩，回到原始导出行为，便于 A/B 对比。
* **导出进度提示**：分阶段文案（准备临时工程 → AE 渲染序列帧 → 优化贴图 → 打包贴图 → 写入文件），编码阶段按贴图张数显示 `n/N` 百分比，全程显示已用秒数，完成显示总耗时。
* 面板选项增加 `?` 悬浮说明，注明优化效果与弊端；两个选项更名为「文件体积优化」「内存占用优化」。

### 变更

* **运行时替换用图改为命名规则**：图层名包含 `avatar` / `nick` / `id`（大小写不敏感、空格可有可无，`id` 需独立成词或带编号）即视为替换用图，跳过透明边裁剪与全透明剔除、保留原尺寸；贴图名 / `imageKey` 直接使用图层名（去空格与非法字符），如 `nick 2` → `nick2`。老写法 `#dynamic` / `#replace` 继续有效。
* 面板播放器 `svga.min.js` 打补丁：识别 `UklGR`（WebP）前缀并按 `image/webp` 解码，因此"选择播放文件"可直接播放 WebP 的 .svga；移除导出时临时拼 PNG 预览包的逻辑，减少一次全量 PNG 复制。

### 修复

* 导出完成后按钮未恢复可用，二次导出无响应；
* 打包 / 读贴图阶段异常此前静默失败，现会弹出「导出失败：具体原因」；`optimizeSvgaWorks` 回调置于 try 内导致可能的重复打包；
* 面板署名与内存预估使用 `position: fixed` 压在预览画布上，改为独立成行并与画布左右对齐。

## v1.2.0 — 2026-11-25

### 兼容性

* `CSXS/manifest.xml` 宿主版本区间放宽为 `[13.0,99.9]`，可加载于 After Effects CC 2015 ~ 2024 及后续版本（本机验证：AE 24.6.8）；
* 统一路径分隔符处理、输出目录与 PNG 模板匹配按名称匹配、序列帧文件改名健壮化，避免不同 AE 版本下渲染产物命名差异；
* `compsManager.jsx` 修正合成 FPS 取值（原实现用下标与帧率比较），并补充状态码与错误回传；
* `ae.declare.ts` 补充 `CompItem` / `Project` / `appVersion` 声明。

### 修复

* **重影问题**：序列帧动画在同一帧出现前后两个元素。原采样按 `cTime += 1/fps` 浮点累加且用 `cTime > outPoint` 判断可见性，边界帧两个元素同时 alpha=1。现改为按帧号对齐采样（`frameNum / frameRate`），可见区间使用半开区间 `[inPoint, outPoint)`，并对 alpha 浮点噪声做吸附（<0.001 → 0，>0.999 → 1）；`concatValues` 的预合成起点改为 `Math.round(startTime * frameRate)`，消除整段偏移一帧。
* **导出必弹"找不到工程文件 Temp.aep"**：`correctMessage` 中 `file.exists` 校验被放在 `app.project.save()` 之前，而 Temp.aep 正是保存时才生成、且临时目录每次转换前会被删除重建。现改为先保存再校验，失败时返回 `ERROR:` 前缀并由面板提示、恢复按钮状态。

### 新增

* **导出后即时预览**：转换成功后自动在面板画布播放生成的 SVGA；播放前先停止上一条动画，并对 `SVGA.Parser` / `Svga.Player` 增加兜底初始化。
* **安卓内存预估**：面板右下角显示 `预估内存：x.xx MB`，按 ARGB_8888 计算 `Σ(width × height × 4) / 1024²`，直接读取 PNG（IHDR）与 JPEG（SOF）文件头获取尺寸，不解码图片；只统计贴图，不含帧数据、矢量路径与画布缓冲。
* **作者署名**：面板左下角 `Jarry Leo · v1.2.0`，悬停高亮，点击调用 `csInterface.openURLInDefaultBrowser()` 打开 GitHub 仓库。
* 面板版本号由 `package.json` 在构建时自动注入（`install.ps1` 与 `tools/package.ps1` 均会替换 `<span id="authorVersion">`）。

### 工程与发布

* 新增 `install.ps1`：本地重建 `jsx/svga.jsx`（等价 gulp concat）+ 组装扩展 + 写入 `CSXS.6~12` 的 `PlayerDebugMode=1` + 用户级安装；
* 新增 `tools/package.ps1`：生成 Windows / macOS 免签名 zip 安装包（含 `安装.bat` / `安装.command` 与 `使用说明.txt`）；
* README 下载地址、安装步骤、`package.json` 的 repository / homepage / bugs 同步迁移到 `jarryleo/SVGA-AEConverter`；
* 面板自动更新检查改为"比较版本号 → 打开 Releases 页面"，不再下载并覆盖 AE 程序目录。

## v1.1.0 — 2026-11-25

* 首个双平台免签名分发包（zip + 安装脚本），无需管理员权限、无需 ZXP Installer。
