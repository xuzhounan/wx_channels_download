// 简化的脚本开始
console.log("[WX_DEBUG] === 脚本开始执行 ===");
const defaultRandomAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// 基础函数定义
function __wx_uid__() { return random_string(12); }
function random_string(length) { return random_string_with_alphabet(length, defaultRandomAlphabet); }
function random_string_with_alphabet(length, alphabet) {
  let b = new Array(length);
  let max = alphabet.length;
  for (let i = 0; i < b.length; i++) {
    let n = Math.floor(Math.random() * max);
    b[i] = alphabet[n];
  }
  return b.join("");
}
function sleep() { return new Promise((resolve) => { setTimeout(() => { resolve(); }, 1000); }); }

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
  return { hide() {} };
}

function __wx_log(msg) {
  fetch("/__wx_channels_api/tip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msg) });
}

// 先定义全局对象
var __wx_channels_tip__ = {};
var __wx_channels_store__ = {
  profile: null, profiles: [], keys: {}, buffers: [], autoMode: false
};

__wx_log({ msg: "[DEBUG] 基础设置完成" });

// 简化的__wx_auto_download函数
function __wx_auto_download(profile) {
  var filename = profile.title || profile.id || new Date().valueOf();
  var downloadData = {
    url: profile.url, filename: filename, key: profile.key || 0, type: profile.type,
    title: profile.title, coverUrl: profile.coverUrl, files: profile.files || [],
    videoId: profile.id, username: profile.username, nickname: profile.nickname,
    duration: profile.duration, interactionData: profile.interactionData || null
  };
  fetch("/__wx_channels_api/auto_download", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(downloadData)
  }).then(response => response.text()).then(data => {
    if (data.includes('window.close()') || data.includes('location.href')) {
      try { eval(data); } catch (e) { console.error("eval error:", e); }
    }
  }).catch(err => { console.error("fetch error:", err); });
}

// 其他函数
function __wx_channels_video_decrypt(t, e, p) {
  for (var r = new Uint8Array(t), n = 0; n < t.byteLength && e + n < p.decryptor_array.length; n++)
    r[n] ^= p.decryptor_array[n];
  return r;
}

window.VTS_WASM_URL = "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/decrypt-video-core/1.3.0/wasm_video_decode.wasm";
window.MAX_HEAP_SIZE = 33554432;
var decryptor_array;
let decryptor;

// autoMode检查
try {
  if (typeof window !== 'undefined' && window.__wx_auto_mode_enabled__) {
    __wx_channels_store__.autoMode = true;
    console.log("[WX_DEBUG] 检测到自动模式标记，已启用autoMode");
  }
} catch (e) { console.log("[WX_DEBUG] 检查autoMode失败:", e); }

// 初始化
console.log("[WX_DEBUG] 微信视频号下载脚本已加载");
console.log("[WX_DEBUG] store初始化完成:", __wx_channels_store__);

setTimeout(() => {
  try {
    __wx_log({ msg: "🚀 [调试] 微信视频号下载脚本已初始化" });
  } catch (e) { console.log("__wx_log调用失败:", e); }
}, 100);

try {
  fetch("/__wx_channels_api/tip", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[WX_DEBUG] setTimeout之后继续执行" })
  });
} catch(e) {}

__wx_log({ msg: "[DEBUG] 基础部分完成" });

// 添加错误捕获
try {
  console.log("[WX_DEBUG] 检查函数和变量定义...");
  
  __wx_log({ msg: "[DEBUG] 开始复杂函数定义" });

  console.log("[WX_DEBUG] 定义__wx_parse_number_with_unit函数");
  
// 数字单位转换函数
function __wx_parse_number_with_unit(text) {
  if (!text) return null;
  
  const cleanText = text.trim();
  
  // 纯数字
  if (cleanText.match(/^\d+$/)) {
    return parseInt(cleanText);
  }
  
  // 带"万"的数字：1.3万 -> 13000
  const wanMatch = cleanText.match(/^(\d+(?:\.\d+)?)\s*万$/);
  if (wanMatch) {
    return Math.round(parseFloat(wanMatch[1]) * 10000);
  }
  
  // 带"k"或"K"的数字：1.3k -> 1300
  const kMatch = cleanText.match(/^(\d+(?:\.\d+)?)\s*[kK]$/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }
  
  return null;
}

  __wx_log({ msg: "[DEBUG] __wx_parse_number_with_unit定义完成" });
  
  console.log("[WX_DEBUG] 定义__wx_extract_interaction_data函数");
  
  __wx_log({ msg: "[DEBUG] 开始定义关键函数" });

// 简化测试版本的互动数据提取函数
function __wx_extract_interaction_data() {
  __wx_log({ msg: "[DEBUG] 进入__wx_extract_interaction_data函数" });
  
  const data = { likes: null, shares: null, favorites: null, comments: null };
  
  __wx_log({ msg: "[DEBUG] data对象初始化完成" });
  
  try {
    __wx_log({ msg: "[DEBUG] 开始测试TreeWalker创建" });
    
    // 测试基本的TreeWalker创建
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    
    __wx_log({ msg: "[DEBUG] 基本TreeWalker创建成功" });
    
    // 测试带过滤器的TreeWalker创建
    const walkerWithFilter = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    __wx_log({ msg: "[DEBUG] 带过滤器的TreeWalker创建成功" });
    
    // 测试DOM属性访问
    __wx_log({ msg: "[DEBUG] 开始DOM属性测试" });
    
    let node;
    let count = 0;
    while ((node = walker.nextNode()) && count < 3) {
      count++;
      __wx_log({ msg: "[DEBUG] 处理节点 " + count });
      
      try {
        // 逐步测试每个属性
        __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试textContent" });
        const text = node.textContent;
        __wx_log({ msg: "[DEBUG] 节点" + count + " - textContent成功: '" + (text ? text.substring(0, 20) : 'null') + "'" });
        
        __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试parentElement" });
        const parent = node.parentElement;
        __wx_log({ msg: "[DEBUG] 节点" + count + " - parentElement成功: " + (parent ? 'found' : 'null') });
        
        if (parent) {
          __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试offsetHeight" });
          const height = parent.offsetHeight;
          __wx_log({ msg: "[DEBUG] 节点" + count + " - offsetHeight成功: " + height });
          
          __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试offsetWidth" });
          const width = parent.offsetWidth;
          __wx_log({ msg: "[DEBUG] 节点" + count + " - offsetWidth成功: " + width });
          
          __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试getBoundingClientRect" });
          const rect = parent.getBoundingClientRect();
          __wx_log({ msg: "[DEBUG] 节点" + count + " - getBoundingClientRect成功: top=" + rect.top });
          
          __wx_log({ msg: "[DEBUG] 节点" + count + " - 开始测试window.innerHeight" });
          const winHeight = window.innerHeight;
          __wx_log({ msg: "[DEBUG] 节点" + count + " - window.innerHeight成功: " + winHeight });
        }
        
        __wx_log({ msg: "[DEBUG] 节点" + count + " - 所有测试完成" });
        
      } catch (e) {
        __wx_log({ msg: "[DEBUG] 节点" + count + " - 出现错误: " + e.message });
        break; // 出错就退出循环
      }
    }
    
    __wx_log({ msg: "[DEBUG] DOM属性测试完成，处理了 " + count + " 个节点" });
    
  } catch (e) {
    __wx_log({ msg: "[DEBUG] TreeWalker测试出错: " + e.message });
  }
  
  __wx_log({ msg: "[DEBUG] 函数即将返回" });
  return data;
}

  __wx_log({ msg: "[DEBUG] __wx_extract_interaction_data定义完成" });

} catch (error) {
  __wx_log({ msg: "[DEBUG] 复杂函数定义出错: " + error.message });
}

__wx_log({ msg: "[DEBUG] 测试阶段完成" });

// 主动调用__wx_extract_interaction_data进行测试
setTimeout(function() {
  __wx_log({ msg: "[DEBUG] 开始测试__wx_extract_interaction_data函数调用" });
  
  try {
    const result = __wx_extract_interaction_data();
    __wx_log({ msg: "[DEBUG] 函数调用成功，返回结果: " + JSON.stringify(result) });
  } catch (e) {
    __wx_log({ msg: "[DEBUG] 函数调用失败: " + e.message });
  }
}, 2000); // 等待2秒让页面加载完成