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