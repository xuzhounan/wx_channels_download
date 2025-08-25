#!/bin/bash

# 微信视频号下载器 - 代理清理工具
# 用于修复 SunnyNet 代理设置问题

echo "🛠️  微信视频号下载器 - 系统代理清理工具"
echo "======================================"

# 检测操作系统
OS_TYPE=$(uname -s)

case "$OS_TYPE" in
    "Darwin")
        echo "🍎 检测到 macOS 系统"
        echo ""
        
        # 获取所有网络接口
        INTERFACES=$(networksetup -listallnetworkservices | grep -v "An asterisk" | grep -v "disabled")
        
        echo "🔍 检查当前代理设置..."
        FOUND_PROXY=false
        
        while IFS= read -r interface; do
            if [ ! -z "$interface" ]; then
                WEB_PROXY=$(networksetup -getwebproxy "$interface" 2>/dev/null)
                SECURE_PROXY=$(networksetup -getsecurewebproxy "$interface" 2>/dev/null)
                
                if echo "$WEB_PROXY" | grep -q "Enabled: Yes"; then
                    echo "⚠️  发现 HTTP 代理在接口: $interface"
                    FOUND_PROXY=true
                fi
                
                if echo "$SECURE_PROXY" | grep -q "Enabled: Yes"; then
                    echo "⚠️  发现 HTTPS 代理在接口: $interface"
                    FOUND_PROXY=true
                fi
            fi
        done <<< "$INTERFACES"
        
        if [ "$FOUND_PROXY" = true ]; then
            echo ""
            echo "🔧 开始清理系统代理设置..."
            
            while IFS= read -r interface; do
                if [ ! -z "$interface" ]; then
                    networksetup -setwebproxystate "$interface" off 2>/dev/null
                    networksetup -setsecurewebproxystate "$interface" off 2>/dev/null
                    networksetup -setftpproxystate "$interface" off 2>/dev/null
                    networksetup -setsocksfirewallproxystate "$interface" off 2>/dev/null
                    echo "✅ 已清理接口: $interface"
                fi
            done <<< "$INTERFACES"
            
            echo ""
            echo "✅ 系统代理清理完成！"
            echo "🌐 网络连接已恢复正常"
        else
            echo "✅ 未发现活动的系统代理设置"
        fi
        ;;
    
    "Linux")
        echo "🐧 检测到 Linux 系统"
        echo ""
        
        # 检查环境变量
        if [ ! -z "$http_proxy" ] || [ ! -z "$https_proxy" ] || [ ! -z "$HTTP_PROXY" ] || [ ! -z "$HTTPS_PROXY" ]; then
            echo "⚠️  发现代理环境变量"
            echo "🔧 清理代理环境变量..."
            
            unset http_proxy
            unset https_proxy
            unset HTTP_PROXY
            unset HTTPS_PROXY
            unset ftp_proxy
            unset FTP_PROXY
            unset all_proxy
            unset ALL_PROXY
            
            echo "✅ 环境变量已清理"
        else
            echo "✅ 未发现代理环境变量"
        fi
        
        # 检查系统代理设置文件
        if command -v gsettings >/dev/null 2>&1; then
            echo "🔧 检查 GNOME 代理设置..."
            gsettings set org.gnome.system.proxy mode 'none' 2>/dev/null || true
            echo "✅ GNOME 代理设置已重置"
        fi
        ;;
        
    *)
        echo "❓ 未知操作系统: $OS_TYPE"
        echo "请手动清理系统代理设置"
        ;;
esac

echo ""
echo "🎉 代理清理完成！"
echo ""
echo "💡 温馨提示："
echo "   1. 如果网络仍有问题，请重启浏览器"
echo "   2. 建议重启网络连接或重新连接 Wi-Fi"
echo "   3. 下次使用程序时，请正常按 Ctrl+C 退出"
echo ""

# 验证网络连接
echo "🔍 验证网络连接..."
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ 网络连接正常"
else
    echo "❌ 网络连接异常，建议重启网络接口"
fi

echo ""
echo "如果问题持续存在，请访问:"
echo "https://github.com/ltaoo/wx_channels_download/issues"