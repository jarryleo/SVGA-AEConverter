# SVGA-AEConverter

After Effects CC plugin for converting animations to SVGA source file.

## Installation

Download the latest build for your platform:

* Windows: [SVGA-AEConverter_Windows_v1.1.0_20261125.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.1.0/SVGA-AEConverter_Windows_v1.1.0_20261125.zip)
* macOS: [SVGA-AEConverter_Mac_v1.1.0_20261125.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.1.0/SVGA-AEConverter_Mac_v1.1.0_20261125.zip)

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

请按平台下载最新安装包：

* Windows：[SVGA-AEConverter_Windows_v1.1.0_20261125.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.1.0/SVGA-AEConverter_Windows_v1.1.0_20261125.zip)
* macOS：[SVGA-AEConverter_Mac_v1.1.0_20261125.zip](https://github.com/jarryleo/SVGA-AEConverter/releases/download/1.1.0/SVGA-AEConverter_Mac_v1.1.0_20261125.zip)

### windows

* 解压下载的 Windows 包;
* 双击 **安装.bat**（安装到当前用户的 CEP 扩展目录，无需管理员权限）;
* 打开 After Effects，在 编辑 > 偏好设置 > 常规 勾选"允许脚本写入文件和访问网络"，然后重启 AE;
* 选择菜单 > 窗口 > 扩展 > SVGAConverter_AE;
* 选择 输出路径 > 开始转换 稍等片刻，SVGA 文件就会生成在您所输出的目录并开始播放;
* 您也可以直接点击 选择播放文件 直接播放本地的 *.svga文件;
* 使用鼠标右键可以 开始/暂停播放。

### mac 
* 解压下载的 macOS 包;
* 若提示"来自身份不明的开发者"，在 安装.command 上右键 → 打开（或终端执行 xattr -cr <解压目录>），再双击 安装.command 完成安装;
* 打开 After Effects，在 偏好设置 > 常规 勾选"允许脚本写入文件和访问网络"，然后重启 AE;
* 选择菜单 > 窗口 > 扩展 > SVGAConverter_AE;
* 选择 输出路径 > 开始转换 稍等片刻，SVGA 文件就会生成在您所输出的目录并开始播放;
* 您也可以直接点击 选择播放文件 直接播放本地的 *.svga文件;
* 使用鼠标右键可以 开始/暂停播放。

### 允许脚本读取和写入文件

启动 After Effects，选择菜单 编辑 > 偏好设置 > 常规 > 在 "允许脚本读取和写入文件" 一项打勾

## 测试

要测试生成文件是否可以正常使用：
1. 使用 菜单 > 窗口 > 扩展 > SVGAConverter_AE 直接播放本地 SVGA 文件;
2. 使用浏览器，打开 http://svga.io/svga-preview.html ，选择或拖入 SVGA 源文件，即可预览动画效果。


