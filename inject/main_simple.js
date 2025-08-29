// 简化版main.js，用于调试
console.log("[WX_DEBUG] 脚本开始执行");

// 立即用__wx_log输出调试信息
try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] 脚本开始执行" })
  });
} catch(e) {
  console.error("[WX_DEBUG] fetch失败:", e);
}

const defaultRandomAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function __wx_uid__() {
  return random_string(12);
}

function random_string(length) {
  return random_string_with_alphabet(length, defaultRandomAlphabet);
}

function random_string_with_alphabet(length, alphabet) {
  let b = new Array(length);
  let max = alphabet.length;
  for (let i = 0; i < b.length; i++) {
    let n = Math.floor(Math.random() * max);
    b[i] = alphabet[n];
  }
  return b.join("");
}

function sleep() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

function __wx_channels_copy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.cssText = "position: absolute; top: -999px; left: -999px;";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function __wx_channel_loading() {
  if (window.__wx_channels_tip__ && window.__wx_channels_tip__.loading) {
    return window.__wx_channels_tip__.loading("下载中");
  }
  return {
    hide() {},
  };
}

function __wx_log(msg) {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
}

// 提前定义全局存储对象
var __wx_channels_tip__ = {};
var __wx_channels_store__ = {
  profile: null,
  profiles: [],
  keys: {},
  buffers: [],
  autoMode: false,
};

__wx_log({ msg: "[FRONTEND] 基础对象定义完成" });

function __wx_auto_download(profile) {
  console.log("[WX_DEBUG] __wx_auto_download调用，autoMode:", __wx_channels_store__.autoMode);
  __wx_log({ msg: "[FRONTEND] __wx_auto_download函数开始执行" });
  
  if (!__wx_channels_store__.autoMode) {
    console.log("[WX_DEBUG] 自动模式未开启，跳过下载");
    return;
  }
  
  var filename = profile.title || profile.id || new Date().valueOf();
  
  var downloadData = {
    url: profile.url,
    filename: filename,
    key: profile.key || 0,
    type: profile.type,
    title: profile.title,
    coverUrl: profile.coverUrl,
    files: profile.files || [],
    videoId: profile.id,
    username: profile.username,
    nickname: profile.nickname,
    duration: profile.duration,
    interactionData: profile.interactionData || null
  };
  
  __wx_log({ msg: "[FRONTEND] 准备发送auto_download请求" });
  
  fetch("/__wx_channels_api/auto_download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(downloadData),
  }).then(response => {
    __wx_log({ msg: "[FRONTEND] auto_download响应收到" });
    return response.text();
  })
    .then(data => {
      __wx_log({ msg: "[FRONTEND] auto_download响应数据: " + data.substring(0, 100) });
      // 后端可能返回JavaScript代码来执行
      if (data.includes('window.close()') || data.includes('location.href')) {
        __wx_log({ msg: "[FRONTEND] 执行返回的JavaScript代码" });
        try {
          eval(data);
        } catch (e) {
          __wx_log({ msg: "[FRONTEND] eval执行错误: " + e.message });
        }
      } else {
        // 如果不是脚本，尝试解析为JSON
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success) {
            __wx_log({
              msg: `[自动下载] ${filename}`,
            });
          }
        } catch (e) {
          console.log("解析响应数据失败:", e);
        }
      }
    })
    .catch(err => {
      console.error("auto_download请求失败:", err);
      __wx_log({ msg: "[FRONTEND] auto_download请求失败: " + err.message });
    });
}

// 立即检查autoMode设置
try {
  __wx_log({ msg: "[FRONTEND] 开始检查autoMode设置" });
  // 检查window对象中是否已经设置了autoMode
  if (typeof window !== 'undefined' && window.__wx_auto_mode_enabled__) {
    __wx_channels_store__.autoMode = true;
    console.log("[WX_DEBUG] 检测到自动模式标记，已启用autoMode");
    __wx_log({ msg: "[FRONTEND] autoMode已启用" });
  } else {
    __wx_log({ msg: "[FRONTEND] 未检测到autoMode标记" });
  }
} catch (e) {
  console.log("[WX_DEBUG] 检查autoMode失败:", e);
  __wx_log({ msg: "[FRONTEND] 检查autoMode失败: " + e.message });
}

// 初始化调试日志
console.log("[WX_DEBUG] 微信视频号下载脚本已加载");
console.log("[WX_DEBUG] 开始执行后续代码...");
__wx_log({ msg: "[FRONTEND] 脚本主要部分开始加载" });

// 再次检查autoMode状态
if (typeof window !== 'undefined' && window.__wx_auto_mode_enabled__) {
  __wx_channels_store__.autoMode = true;
  console.log("[WX_DEBUG] 再次检测到autoMode标记，已启用");
  __wx_log({ msg: "[FRONTEND] autoMode状态再次确认: 已启用" });
} else {
  __wx_log({ msg: "[FRONTEND] autoMode状态再次确认: 未启用" });
}

// 检查store状态
console.log("[WX_DEBUG] store初始化完成:", __wx_channels_store__);

// 脚本执行完成标记
console.log("[WX_DEBUG] 微信视频号下载脚本执行完成");
__wx_log({ msg: "🚀 [调试] 微信视频号下载脚本已完全加载" });