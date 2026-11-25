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