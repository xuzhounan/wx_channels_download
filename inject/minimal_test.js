// 添加main.js的前几行内容
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

console.log("[WX_DEBUG] === 脚本开始执行 ===");

const defaultRandomAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

console.log("[WX_DEBUG] 常量定义完成");
try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] 常量定义完成" })
  });
} catch(e) {}

console.log("[WX_DEBUG] 定义__wx_uid__函数");
function __wx_uid__() {
  return random_string(12);
}
console.log("[WX_DEBUG] __wx_uid__函数定义完成");

console.log("[WX_DEBUG] 定义random_string函数");
function random_string(length) {
  return random_string_with_alphabet(length, defaultRandomAlphabet);
}
console.log("[WX_DEBUG] random_string函数定义完成");

console.log("[WX_DEBUG] 定义random_string_with_alphabet函数");
function random_string_with_alphabet(length, alphabet) {
  let b = new Array(length);
  let max = alphabet.length;
  for (let i = 0; i < b.length; i++) {
    let n = Math.floor(Math.random() * max);
    b[i] = alphabet[n];
  }
  return b.join("");
}
console.log("[WX_DEBUG] random_string_with_alphabet函数定义完成");

try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] 基础函数定义完成" })
  });
} catch(e) {}

console.log("[WX_DEBUG] 定义sleep函数");
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

try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] 工具函数定义完成" })
  });
} catch(e) {}

// 提前定义全局存储对象
var __wx_channels_tip__ = {};
var __wx_channels_store__ = {
  profile: null,
  profiles: [],
  keys: {},
  buffers: [],
  autoMode: false,
};

try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] 全局对象定义完成" })
  });
} catch(e) {}

function __wx_auto_download(profile) {
  console.log("[WX_DEBUG] __wx_auto_download调用，autoMode:", __wx_channels_store__.autoMode);
  
  try {
    fetch("/__wx_channels_api/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: "[FRONTEND] __wx_auto_download函数被调用" })
    });
  } catch(e) {}
  
  // 暂时只返回，不执行复杂逻辑
  return;
}

try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[FRONTEND] __wx_auto_download函数定义完成" })
  });
} catch(e) {}

alert("第二批函数定义测试完成");