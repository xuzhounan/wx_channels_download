// 脚本开始执行
console.log("[WX_DEBUG] 脚本开始执行");

// 立即用__wx_log输出调试信息
try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[WX_DEBUG] === 脚本开始执行 ===" })
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
    body: JSON.stringify({ msg: "[WX_DEBUG] 常量定义完成" })
  });
} catch(e) {}

console.log("[WX_DEBUG] 定义__wx_uid__函数");
function __wx_uid__() {
  return random_string(12);
}
console.log("[WX_DEBUG] __wx_uid__函数定义完成");
/**
 * 返回一个指定长度的随机字符串
 * @param length
 * @returns
 */
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

// 提前定义全局存储对象
var __wx_channels_tip__ = {};
var __wx_channels_store__ = {
  profile: null,
  profiles: [],
  keys: {},
  buffers: [],
  autoMode: false,
};

// 将store暴露到window对象，以便其他脚本可以访问
window.__wx_channels_store__ = __wx_channels_store__;
window.__wx_channels_tip__ = __wx_channels_tip__;

__wx_log({ msg: "[FRONTEND] Store对象已暴露到window" });

// 移除自定义的profile提取函数，恢复原有机制

function __wx_auto_download(profile) {
  console.log("[WX_DEBUG] __wx_auto_download调用，autoMode:", __wx_channels_store__.autoMode);
  __wx_log({ msg: "[FRONTEND] __wx_auto_download函数开始执行" });
  
  if (!__wx_channels_store__.autoMode) {
    console.log("[WX_DEBUG] 自动模式未开启，跳过下载");
    return;
  }
  
  var filename = (() => {
    if (profile.title) {
      return profile.title;
    }
    if (profile.id) {
      return profile.id;
    }
    return new Date().valueOf();
  })();
  
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
          } else {
            __wx_log({
              msg: `[自动下载失败] ${filename}`,
            });
          }
        } catch (e) {
          __wx_log({
            msg: `[自动下载] 响应处理完成`,
          });
        }
      }
    })
    .catch(err => {
      __wx_log({
        msg: `[自动下载错误] ${err.message}`,
      });
    });
}
function __wx_channels_video_decrypt(t, e, p) {
  for (
    var r = new Uint8Array(t), n = 0;
    n < t.byteLength && e + n < p.decryptor_array.length;
    n++
  )
    r[n] ^= p.decryptor_array[n];
  return r;
}
window.VTS_WASM_URL =
  "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/decrypt-video-core/1.3.0/wasm_video_decode.wasm";
window.MAX_HEAP_SIZE = 33554432;
var decryptor_array;
let decryptor;
/** t 是要解码的视频内容长度    e 是 decryptor_array 的长度 */
function wasm_isaac_generate(t, e) {
  decryptor_array = new Uint8Array(e);
  var r = new Uint8Array(Module.HEAPU8.buffer, t, e);
  decryptor_array.set(r.reverse());
  if (decryptor) {
    decryptor.delete();
  }
}
let loaded = false;
/** 获取 decrypt_array */
async function __wx_channels_decrypt(seed) {
  if (!loaded) {
    await __wx_load_script(
      "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/decrypt-video-core/1.3.0/wasm_video_decode.js"
    );
    loaded = true;
  }
  await sleep();
  decryptor = new Module.WxIsaac64(seed);
  // 调用该方法时，会调用 wasm_isaac_generate 方法
  // 131072 是 decryptor_array 的长度
  decryptor.generate(131072);
  // decryptor.delete();
  // const r = Uint8ArrayToBase64(decryptor_array);
  // decryptor_array = undefined;
  return decryptor_array;
}
async function show_progress_or_loaded_size(response) {
  const content_length = response.headers.get("Content-Length");
  const chunks = [];
  const total_size = content_length ? parseInt(content_length, 10) : 0;
  if (total_size) {
    __wx_log({
      msg: `${total_size} Bytes`,
    });
  }
  let loaded_size = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    loaded_size += value.length;
    if (total_size) {
      const progress = (loaded_size / total_size) * 100;
      __wx_log({
        replace: 1,
        msg: `${progress.toFixed(2)}%`,
      });
    } else {
      __wx_log({
        replace: 1,
        msg: `${loaded_size} Bytes`,
      });
    }
  }
  __wx_log({
    end: 1,
    msg: "",
  });
  const blob = new Blob(chunks);
  return blob;
}
/** 用于下载已经播放的视频内容 */
async function __wx_channels_download(profile, filename) {
  console.log("__wx_channels_download");
  const data = profile.data;
  const blob = new Blob(data, { type: "video/mp4" });
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  saveAs(blob, filename + ".mp4");
}
/** 下载非加密视频 */
async function __wx_channels_download2(profile, filename) {
  console.log("__wx_channels_download2");
  const url = profile.url;
  //   __wx_log({
  //     msg: `${filename}
  // ${url}
  // ${profile.key}`,
  //   });
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  const ins = __wx_channel_loading();
  const response = await fetch(url);
  const blob = await show_progress_or_loaded_size(response);
  __wx_log({
    msg: "下载完成",
  });
  ins.hide();
  saveAs(blob, filename + ".mp4");
}
/** 下载图片视频 */
async function __wx_channels_download3(profile, filename) {
  console.log("__wx_channels_download3");
  const files = profile.files;
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/jszip.min.js"
  );
  const zip = new JSZip();
  zip.file("contact.txt", JSON.stringify(profile.contact, null, 2));
  const folder = zip.folder("images");
  // console.log("files", files);
  const fetchPromises = files
    .map((f) => f.url)
    .map(async (url, index) => {
      const response = await fetch(url);
      const blob = await response.blob();
      folder.file(index + 1 + ".png", blob);
    });
  const ins = __wx_channel_loading();
  try {
    await Promise.all(fetchPromises);
    const content = await zip.generateAsync({ type: "blob" });
    ins.hide();
    saveAs(content, filename + ".zip");
  } catch (err) {
    __wx_log({
      msg: "下载失败\n" + err.message,
    });
  }
}
/** 下载加密视频 */
async function __wx_channels_download4(profile, filename) {
  console.log("__wx_channels_download4");
  const url = profile.url;
  //   console.log("__wx_channels_download4", url);
  //   __wx_log({
  //     msg: `${filename}
  // ${url}`,
  //   });
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  const ins = __wx_channel_loading();
  const response = await fetch(url);
  const blob = await show_progress_or_loaded_size(response);
  __wx_log({
    msg: "下载完成，开始解密",
  });
  let array = new Uint8Array(await blob.arrayBuffer());
  if (profile.decryptor_array) {
    array = __wx_channels_video_decrypt(array, 0, profile);
  }
  ins.hide();
  const result = new Blob([array], { type: "video/mp4" });
  saveAs(result, filename + ".mp4");
}
function __wx_load_script(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
function __wx_channels_handle_copy__() {
  __wx_channels_copy(location.href);
  if (window.__wx_channels_tip__ && window.__wx_channels_tip__.toast) {
    window.__wx_channels_tip__.toast("复制成功", 1e3);
  }
}
async function __wx_channels_handle_log__() {
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  const content = document.body.innerHTML;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, "log.txt");
}
async function __wx_channels_handle_click_download__(spec) {
  __wx_log({ msg: "[FRONTEND] __wx_channels_handle_click_download__函数被调用" });
  console.log("[WX_DEBUG] __wx_channels_handle_click_download__函数被调用, spec:", spec);
  
  var profile = __wx_channels_store__.profile;
  console.log("[WX_DEBUG] 获取到的profile:", profile);
  
  // profile = __wx_channels_store__.profiles.find((p) => p.id === profile.id);
  if (!profile) {
    __wx_log({ msg: "[FRONTEND] 检测不到视频数据" });
    alert("检测不到视频，请将本工具更新到最新版");
    return;
  }
  
  __wx_log({ msg: "[FRONTEND] 视频数据正常，开始下载处理" });
  // console.log(__wx_channels_store__);
  var filename = (() => {
    if (profile.title) {
      return profile.title;
    }
    if (profile.id) {
      return profile.id;
    }
    return new Date().valueOf();
  })();
  const _profile = {
    ...profile,
  };
  if (spec) {
    _profile.url = profile.url + "&X-snsvideoflag=" + spec.fileFormat;
    filename = filename + "_" + spec.fileFormat;
  }
  // console.log("__wx_channels_handle_click_download__", url);
  __wx_log({
    msg: `${filename}
${location.href}

${_profile.url}
${_profile.key || "该视频未加密"}`,
  });
  if (_profile.type === "picture") {
    __wx_channels_download3(_profile, filename);
    return;
  }
  if (!_profile.key) {
    __wx_channels_download2(_profile, filename);
    return;
  }
  _profile.data = __wx_channels_store__.buffers;
  try {
    const r = await __wx_channels_decrypt(_profile.key);
    // console.log("[]after __wx_channels_decrypt", r);
    _profile.decryptor_array = r;
  } catch (err) {
    __wx_log({
      msg: `解密失败，停止下载`,
    });
    alert("解密失败，停止下载");
    return;
  }
  __wx_channels_download4(_profile, filename);
}
function __wx_channels_download_cur__() {
  var profile = __wx_channels_store__.profile;
  if (!profile) {
    alert("检测不到视频，请将本工具更新到最新版");
    return;
  }
  if (__wx_channels_store__.buffers.length === 0) {
    alert("没有可下载的内容");
    return;
  }
  var filename = (() => {
    if (profile.title) {
      return profile.title;
    }
    if (profile.id) {
      return profile.id;
    }
    return new Date().valueOf();
  })();
  profile.data = __wx_channels_store__.buffers;
  __wx_channels_download(profile, filename);
}
function __wx_channels_handle_print_download_command() {
  var profile = __wx_channels_store__.profile;
  // profile = __wx_channels_store__.profiles.find((p) => p.id === profile.id);
  if (!profile) {
    alert("检测不到视频，请将本工具更新到最新版");
    return;
  }
  // console.log(__wx_channels_store__);
  var filename = (() => {
    if (profile.title) {
      return profile.title;
    }
    if (profile.id) {
      return profile.id;
    }
    return new Date().valueOf();
  })();
  var _profile = {
    ...profile,
  };
  var spec = profile.spec[0];
  if (spec) {
    _profile.url = profile.url + "&X-snsvideoflag=" + spec.fileFormat;
    filename = filename + "_" + spec.fileFormat;
  }
  // console.log("__wx_channels_handle_click_download__", url);
  var command = `download --url "${_profile.url}"`;
  if (_profile.key) {
    command += ` --key ${_profile.key}`;
  }
  command += ` --filename "${filename}.mp4"`;
  __wx_log({
    msg: command,
  });
  if (window.__wx_channels_tip__ && window.__wx_channels_tip__.toast) {
    window.__wx_channels_tip__.toast("请在终端查看下载命令", 1e3);
  }
}
async function __wx_channels_handle_download_cover() {
  var profile = __wx_channels_store__.profile;
  // profile = __wx_channels_store__.profiles.find((p) => p.id === profile.id);
  if (!profile) {
    alert("检测不到视频，请将本工具更新到最新版");
    return;
  }
  // console.log(__wx_channels_store__);
  var filename = (() => {
    if (profile.title) {
      return profile.title;
    }
    if (profile.id) {
      return profile.id;
    }
    return new Date().valueOf();
  })();
  const _profile = {
    ...profile,
  };
  await __wx_load_script(
    "https://res.wx.qq.com/t/wx_fed/cdn_libs/res/FileSaver.min.js"
  );
  __wx_log({
    msg: `下载封面\n${_profile.coverUrl}`,
  });
  const ins = __wx_channel_loading();
  try {
    const url = _profile.coverUrl.replace(/^http/, "https");
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, filename + ".jpg");
  } catch (err) {
    alert(err.message);
  }
  ins.hide();
}

// 立即检查URL中是否包含自动模式标记（从后端注入）
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

// 移除自定义的profile提取调用，让原有机制正常工作

// 延迟发送日志，避免阻塞脚本执行
setTimeout(() => {
  try {
    console.log("[WX_DEBUG] 准备调用__wx_log");
    __wx_log({
      msg: "🚀 [调试] 微信视频号下载脚本已初始化"
    });
    console.log("[WX_DEBUG] __wx_log调用成功");
  } catch (logError) {
    console.log("[WX_DEBUG] __wx_log调用失败:", logError);
  }
}, 100);

// 在setTimeout之后立即添加调试
try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[WX_DEBUG] setTimeout之后继续执行" })
  });
} catch(e) {}

// 添加错误捕获
try {
  console.log("[WX_DEBUG] 检查函数和变量定义...");
  
  // 立即发送这个信息
  try {
    fetch("/__wx_channels_api/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: "[WX_DEBUG] 开始函数定义阶段" })
    });
  } catch(e) {}

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
  
  // 带"m"或"M"的数字：1.3m -> 1300000
  const mMatch = cleanText.match(/^(\d+(?:\.\d+)?)\s*[mM]$/);
  if (mMatch) {
    return Math.round(parseFloat(mMatch[1]) * 1000000);
  }
  
  return null;
}

  console.log("[WX_DEBUG] __wx_parse_number_with_unit函数定义完成");
  
  console.log("[WX_DEBUG] 定义__wx_extract_interaction_data函数");

// 修复的互动数据提取
function __wx_extract_interaction_data() {
  const data = { likes: null, shares: null, favorites: null, comments: null };
  
  // 查找页面底部的互动数字（支持单位）
  const foundNumbers = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        // 匹配纯数字或带单位的数字
        return (text.match(/^\d+$/) || text.match(/^\d+(?:\.\d+)?\s*[万kmKM]$/)) ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    const value = __wx_parse_number_with_unit(text);
    const parent = node.parentElement;
    
    if (value !== null && parent && parent.offsetHeight > 0 && parent.offsetWidth > 0) {
      const position = parent.getBoundingClientRect();
      
      // 放宽数值范围，包括0和小数值
      if (position.top > window.innerHeight * 0.3 && 
          value >= 0 && value < 100000000 && 
          position.width < 300 && 
          position.height < 150) {
        foundNumbers.push({
          value: value,
          element: parent,
          position: position,
          text: text,
          originalText: text
        });
      }
    }
  }
  
  if (foundNumbers.length >= 4) {
    // 按Y坐标分组，找到同一行的数字
    const rows = {};
    foundNumbers.forEach(num => {
      const rowKey = Math.round(num.position.top / 30) * 30; // 增大容差到30px
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(num);
    });
    
    // 找到包含4个或更多数字的行
    const validRows = Object.values(rows).filter(row => row.length >= 4);
    
    if (validRows.length > 0) {
      // 选择最底部的行（互动数据通常在底部）
      const bottomRow = validRows.reduce((max, current) => 
        current[0].position.top > max[0].position.top ? current : max
      );
      
      // 按从左到右排序
      bottomRow.sort((a, b) => a.position.left - b.position.left);
      
      if (bottomRow.length >= 4) {
        data.likes = bottomRow[0].value;
        data.shares = bottomRow[1].value;
        data.favorites = bottomRow[2].value;  
        data.comments = bottomRow[3].value;
      }
    }
  }
  
  // 备用策略：如果主策略失败，尝试更宽松的匹配
  const validData = Object.keys(data).filter(key => data[key] !== null && data[key] >= 0);
  if (validData.length < 3 && foundNumbers.length >= 3) {
    // 按Y坐标分组，但降低要求
    const rows = {};
    foundNumbers.forEach(num => {
      const rowKey = Math.round(num.position.top / 50) * 50; // 更大容差
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(num);
    });
    
    const validRows = Object.values(rows).filter(row => row.length >= 3); // 降低要求到3个数字
    
    if (validRows.length > 0) {
      const bottomRow = validRows.reduce((max, current) => 
        current[0].position.top > max[0].position.top ? current : max
      );
      
      bottomRow.sort((a, b) => a.position.left - b.position.left);
      
      // 根据实际数量分配
      if (bottomRow.length >= 3) {
        data.likes = bottomRow[0].value;
        data.shares = bottomRow[1].value;
        data.comments = bottomRow[2].value;
        if (bottomRow.length >= 4) {
          data.favorites = bottomRow[2].value;
          data.comments = bottomRow[3].value;
        }
      }
    }
  }
  
  return data;
}

  console.log("[WX_DEBUG] __wx_extract_interaction_data函数定义完成");

function __wx_manual_extract_interaction() {
  const data = __wx_extract_interaction_data();
  
  const validData = Object.keys(data).filter(key => data[key] !== null && data[key] >= 0);
  if (validData.length > 0) {
    // 根据图片显示的图标，调整输出格式
    const icons = { likes: '👍', shares: '🔄', favorites: '⭐', comments: '💬' };
    const summary = validData.map(key => `${icons[key]}${data[key]}`).join(' ');
    __wx_log({
      msg: `📊 ${summary}`
    });
  } else {
    __wx_log({
      msg: `📊 未找到互动数据`
    });
  }
  
  if (__wx_channels_store__.profile) {
    __wx_channels_store__.profile.interactionData = data;
    
    // 发送更新的profile数据到后端
    fetch("/__wx_channels_api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...__wx_channels_store__.profile,
        interactionData: data
      })
    });
  }
  
  return data;
}

// 自动提取互动数据的集成功能
function __wx_auto_extract_interaction() {
  // 延迟更长时间确保互动数据已经加载到DOM中
  setTimeout(() => {
    if (__wx_channels_store__.profile && !__wx_channels_store__.profile.interactionData) {
      const interactionData = __wx_extract_interaction_data();
      const validData = Object.keys(interactionData).filter(key => interactionData[key] !== null && interactionData[key] >= 0);
      
      if (validData.length >= 2) {
        __wx_channels_store__.profile.interactionData = interactionData;
        
        // 简洁的输出
        const icons = { likes: '👍', shares: '🔄', favorites: '⭐', comments: '💬' };
        const summary = validData.map(key => `${icons[key]}${interactionData[key]}`).join(' ');
        __wx_log({
          msg: `📊 ${summary}`
        });
        
        // 发送到后端
        fetch("/__wx_channels_api/profile", {
          method: "POST", 
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...__wx_channels_store__.profile,
            interactionData: interactionData
          })
        });
      } else {
        // 如果还是没有足够的互动数据，再尝试一次
        setTimeout(() => {
          const retryData = __wx_extract_interaction_data();
          const retryValid = Object.keys(retryData).filter(key => retryData[key] !== null && retryData[key] >= 0);
          
          if (retryValid.length >= 2) {
            __wx_channels_store__.profile.interactionData = retryData;
            
            const icons = { likes: '👍', shares: '🔄', favorites: '⭐', comments: '💬' };
            const summary = retryValid.map(key => `${icons[key]}${retryData[key]}`).join(' ');
            __wx_log({
              msg: `📊 ${summary}`
            });
            
            // 发送到后端
            fetch("/__wx_channels_api/profile", {
              method: "POST", 
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                ...__wx_channels_store__.profile,
                interactionData: retryData
              })
            });
          }
        }, 2000);
      }
    }
  }, 1500);
}

// 监听profile变化，自动提取互动数据
let lastVideoId = null;
let autoCloseTimer = null;
let profileProcessing = false; // 防止重复处理

// 页面卸载事件监听器
window.addEventListener('beforeunload', function() {
  __wx_log({
    msg: "🧹 [系统] 页面卸载，清理定时器"
  });
  
  // 清理定时器
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
});

  console.log("[WX_DEBUG] 所有函数定义完成，准备启动监听器");
  
  // 检查auto模式状态
  console.log("[WX_DEBUG] 当前autoMode状态:", __wx_channels_store__.autoMode);
  
  // 添加调试日志到后端
  try {
    fetch("/__wx_channels_api/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: "[WX_DEBUG] 准备启动Profile监听定时器" })
    });
  } catch(e) {}
  
  console.log("[WX_DEBUG] 启动Profile监听定时器 - 修复版本 v2.0");

  // Profile监听器 - 使用更合理的检查频率
  let profileCheckCount = 0;
  try {
    setInterval(() => {
      profileCheckCount++;
      
      // 只在特殊情况下输出调试信息
      const shouldLog = (profileCheckCount % 50 === 0); // 每50次检查输出一次
      
      // DOM提取逻辑 - 仅在没有profile时尝试一次
      if (!__wx_channels_store__.profile && profileCheckCount <= 5) {
        try {
          const videoElements = [
            document.querySelector('video'),
            document.querySelector('[data-objectid]'),
            document.querySelector('.video-container'),
            document.querySelector('[data-src*="video"]')
          ].filter(Boolean);
          
          if (videoElements.length > 0) {
            const currentUrl = window.location.href;
            const urlMatch = currentUrl.match(/\/([a-zA-Z0-9_-]+)$/);
            if (urlMatch) {
              const extractedProfile = {
                id: urlMatch[1] || 'dom_extracted_' + Date.now(),
                title: document.title || '未知标题',
                url: currentUrl,
                source: 'dom_extraction'
              };
              console.log("[WX_DEBUG] DOM提取Profile成功:", extractedProfile);
              __wx_log({ msg: "[FRONTEND] ✅ DOM提取成功: " + extractedProfile.id });
              __wx_channels_store__.profile = extractedProfile;
            }
          }
        } catch (e) {
          console.log("[WX_DEBUG] DOM提取失败:", e.message);
        }
      }
    
    if (__wx_channels_store__.profile) {
      console.log("[WX_DEBUG] Profile详情:", {
        id: __wx_channels_store__.profile.id,
        title: __wx_channels_store__.profile.title,
        url: __wx_channels_store__.profile.url,
        source: __wx_channels_store__.profile.source || 'original'
      });
    }
    
    if (__wx_channels_store__.profile && !profileProcessing) {
      const currentVideoId = __wx_channels_store__.profile.id || __wx_channels_store__.profile.title;
      console.log("[WX_DEBUG] 检查Profile:", currentVideoId);
      
      if (currentVideoId && currentVideoId !== lastVideoId) {
        profileProcessing = true; // 设置处理标志
        lastVideoId = currentVideoId;
        
        console.log("[自动提取] 检测到新视频:", currentVideoId);
        __wx_auto_extract_interaction();
        
        // 在auto模式下，延迟关闭页面
        if (__wx_channels_store__.autoMode) {
          // 清除之前的定时器
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
          }
          
          console.log("[自动模式] 设置页面关闭定时器...");
          
          // 延长等待时间，确保所有数据处理完成
          autoCloseTimer = setTimeout(() => {
            console.log("[自动模式] 准备关闭页面，检查处理状态...");
            
            // 再次确认处理完成
            setTimeout(() => {
              console.log("[自动模式] 任务完成，正在关闭页面...");
              __wx_log({
                msg: "[自动模式] 任务完成，正在关闭页面..."
              });
              
              setTimeout(() => {
                try {
                  // 方法1: 直接关闭窗口
                  window.close();
                  
                  // 如果无法关闭，尝试其他方法
                  setTimeout(() => {
                    // 方法2: 设置opener并关闭
                    window.opener = window;
                    window.close();
                    
                    // 方法3: 如果还是无法关闭，使用history.back()
                    setTimeout(() => {
                      if (history.length > 1) {
                        history.back();
                      } else {
                        // 最后手段：显示完成页面而不是空白页
                        document.body.innerHTML = `
                          <div style="
                            display: flex; 
                            flex-direction: column; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            text-align: center;
                          ">
                            <h1 style="font-size: 48px; margin-bottom: 20px;">✅</h1>
                            <h2 style="font-size: 24px; margin-bottom: 10px;">任务完成</h2>
                            <p style="font-size: 16px; margin-bottom: 30px;">视频下载已完成，可以关闭此标签页</p>
                            <button onclick="window.close()" style="
                              padding: 12px 24px;
                              font-size: 16px;
                              background: rgba(255,255,255,0.2);
                              border: 2px solid white;
                              border-radius: 25px;
                              color: white;
                              cursor: pointer;
                              transition: all 0.3s;
                            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                              关闭标签页
                            </button>
                          </div>
                        `;
                        document.title = "✅ 任务完成";
                      }
                    }, 100);
                  }, 100);
                } catch (e) {
                  console.log("关闭页面失败:", e);
                  window.location.href = "about:blank";
                }
              }, 1000);
            }, 2000); // 额外等待2秒确保数据处理完成
          }, 8000); // 增加到8秒，给数据处理更多时间
        }
        
        // 延迟重置处理标志，防止过快重复处理
        setTimeout(() => {
          profileProcessing = false;
        }, 3000);
      }
    }
  }, 2000);
    
  } catch (intervalError) {
        console.error("[WX_DEBUG] Profile监听器执行出错:", intervalError);
        try {
          fetch("/__wx_channels_api/tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: "[WX_DEBUG] Profile监听器错误: " + intervalError.message })
          });
        } catch(e) {}
      }
    
    // 成功启动监听器的确认
    console.log("[WX_DEBUG] Profile监听器已成功启动");
    try {
      fetch("/__wx_channels_api/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: "[WX_DEBUG] Profile监听器已成功启动" })
      });
    } catch(e) {}
} catch (error) {
  console.error("[WX_DEBUG] 脚本执行出错:", error);
  try {
    fetch("/__wx_channels_api/tip", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: "❌ [调试] 脚本执行错误: " + error.message })
    });
  } catch(e) {}
}

// 添加下载按钮创建的调试日志
console.log("[WX_DEBUG] 开始创建下载按钮");
try {
  fetch("/__wx_channels_api/tip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg: "[WX_DEBUG] 开始创建下载按钮" })
  });
} catch(e) {}

try {
  var $icon = document.createElement("div");
  $icon.innerHTML =
    '<div data-v-6548f11a data-v-132dee25 class="click-box op-item item-gap-combine" role="button" aria-label="下载" style="padding: 4px 4px 4px 4px; --border-radius: 4px; --left: 0; --top: 0; --right: 0; --bottom: 0;"><svg data-v-132dee25 class="svg-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="28" height="28"><path d="M213.333333 853.333333h597.333334v-85.333333H213.333333m597.333334-384h-170.666667V128H384v256H213.333333l298.666667 298.666667 298.666667-298.666667z"></path></svg></div>';
  var __wx_channels_video_download_btn__ = $icon.firstChild;
  __wx_channels_video_download_btn__.onclick = () => {
    __wx_log({ msg: "[FRONTEND] 下载按钮被点击" });
    console.log("[WX_DEBUG] 下载按钮被点击");
    
    if (!window.__wx_channels_store__.profile) {
      __wx_log({ msg: "[FRONTEND] profile数据不存在，无法下载" });
      console.log("[WX_DEBUG] profile数据不存在:", window.__wx_channels_store__);
      return;
    }
    
    __wx_log({ msg: "[FRONTEND] profile数据存在，开始下载" });
    console.log("[WX_DEBUG] profile数据:", window.__wx_channels_store__.profile);
    
    __wx_channels_handle_click_download__(
      window.__wx_channels_store__.profile.spec[0]
    );
  };
  console.log("[WX_DEBUG] 下载按钮创建成功");
  
} catch (buttonError) {
  console.error("[WX_DEBUG] 创建下载按钮失败:", buttonError);
  try {
    fetch("/__wx_channels_api/tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: "[WX_DEBUG] 创建下载按钮失败: " + buttonError.message })
    });
  } catch(e) {}
}

console.log("[WX_DEBUG] 开始寻找下载按钮插入位置");

var count = 0;
var __timer = setInterval(() => {
  count += 1;
  console.log("[WX_DEBUG] 搜索下载按钮容器，尝试次数:", count);
  const $wrap3 = document.getElementsByClassName("full-opr-wrp layout-row")[0];
  const $wrap4 = document.getElementsByClassName("full-opr-wrp layout-col")[0];
  if (!$wrap3 && !$wrap4) {
    if (count >= 5) {
      console.log("[WX_DEBUG] 未找到下载按钮容器，停止搜索");
      clearInterval(__timer);
      __timer = null;
    }
    return;
  }
  console.log("[WX_DEBUG] 找到下载按钮容器");
  clearInterval(__timer);
  __timer = null;
  if ($wrap3) {
    const relative_node = $wrap3.children[$wrap3.children.length - 1];
    if (!relative_node) {
      $wrap3.appendChild(__wx_channels_video_download_btn__);
      return;
    }
    $wrap3.insertBefore(__wx_channels_video_download_btn__, relative_node);
  }
  if ($wrap4) {
    $icon.innerHTML =
      '<div data-v-132dee25 class="context-menu__wrp item-gap-combine op-more-btn"><div class="context-menu__target"><div data-v-6548f11a data-v-132dee25 class="click-box op-item" role="button" aria-label="下载" style="padding: 4px 4px 4px 4px; --border-radius: 4px; --left: 0; --top: 0; --right: 0; --bottom: 0;"><svg data-v-132dee25 class="svg-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="28" height="28"><path d="M213.333333 853.333333h597.333334v-85.333333H213.333333m597.333334-384h-170.666667V128H384v256H213.333333l298.666667 298.666667 298.666667-298.666667z"></path></svg></div></div></div>';
    __wx_channels_video_download_btn__ = $icon.firstChild;
    __wx_channels_video_download_btn__.onclick = () => {
      __wx_log({ msg: "[FRONTEND] 下载按钮被点击(第二个)" });
      console.log("[WX_DEBUG] 下载按钮被点击(第二个)");
      
      if (!window.__wx_channels_store__.profile) {
        __wx_log({ msg: "[FRONTEND] profile数据不存在，无法下载(第二个)" });
        console.log("[WX_DEBUG] profile数据不存在(第二个):", window.__wx_channels_store__);
        return;
      }
      
      __wx_log({ msg: "[FRONTEND] profile数据存在，开始下载(第二个)" });
      console.log("[WX_DEBUG] profile数据(第二个):", window.__wx_channels_store__.profile);
      
      __wx_channels_handle_click_download__(
        window.__wx_channels_store__.profile.spec[0]
      );
    };
    const relative_node = $wrap4.children[$wrap4.children.length - 1];
    if (!relative_node) {
      $wrap4.appendChild(__wx_channels_video_download_btn__);
      return;
    }
    $wrap4.insertBefore(__wx_channels_video_download_btn__, relative_node);
  }
}, 1000);

// 脚本执行完成标记
console.log("[WX_DEBUG] 微信视频号下载脚本执行完成");
__wx_log({ msg: "🚀 [调试] 微信视频号下载脚本已完全加载" });
