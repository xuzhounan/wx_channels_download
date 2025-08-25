#!/bin/bash

echo "=== 微信视频号自动下载功能测试 ==="
echo ""

echo "1. 基本启动（无自动下载）："
echo "   ./wx_video_download_with_auto"
echo ""

echo "2. 启用自动下载（使用默认目录）："
echo "   ./wx_video_download_with_auto --auto"
echo ""

echo "3. 启用自动下载并指定目录："
echo "   ./wx_video_download_with_auto --auto --download-dir=\"/Users/xzn/Desktop/视频号下载\""
echo ""

echo "4. 完整参数示例："
echo "   ./wx_video_download_with_auto --auto --download-dir=\"/Users/xzn/Desktop/视频号下载\" --port=2024 --dev=Wi-Fi"
echo ""

echo "自动下载功能特性："
echo "- ✅ 自动检测视频打开事件"
echo "- ✅ 自动下载视频到指定目录"
echo "- ✅ 支持加密视频自动解密"
echo "- ✅ 支持图片内容自动下载"
echo "- ✅ 文件名自动清理和去重"
echo "- ✅ 自动创建下载目录"
echo ""

echo "使用说明："
echo "1. 启动程序时添加 --auto 参数开启自动下载"
echo "2. 使用 --download-dir 指定下载目录（可选）"
echo "3. 打开微信视频号，浏览视频时会自动下载"
echo "4. 在终端可以看到下载进度和结果"
echo ""