const defaultRandomAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function __wx_uid__() {
  return random_string(12);
}
/**
 * 返回一个指定长度的随机字符串
 * @param length
 * @returns
 */
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

function __wx_auto_download(profile) {
  if (!__wx_channels_store__.autoMode) {
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
  
  fetch("/__wx_channels_api/auto_download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(downloadData),
  }).then(response => response.json())
    .then(data => {
      if (data.success) {
        __wx_log({
          msg: `[自动下载] ${filename}`,
        });
      } else {
        __wx_log({
          msg: `[自动下载失败] ${filename}`,
        });
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
var __wx_channels_tip__ = {};
var __wx_channels_store__ = {
  profile: null,
  profiles: [],
  keys: {},
  buffers: [],
  autoMode: false,
};

// 页面结构分析和互动数据提取功能
function __wx_analyze_page_structure() {
  // 静默分析页面结构
  
  // 分析可能包含互动数据的元素
  const possibleSelectors = [
    '[class*="like"]',
    '[class*="share"]', 
    '[class*="comment"]',
    '[class*="praise"]',
    '[class*="forward"]',
    '[class*="favorite"]',
    '[class*="interaction"]',
    '[class*="operate"]',
    '[class*="action"]',
    '[class*="count"]',
    '[class*="num"]'
  ];
  
  let results = [];
  possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach((el, index) => {
        const text = el.textContent.trim();
        const className = el.className;
        if (text && (text.match(/^\d+$/) || text.match(/\d+/))) {
          results.push({
            selector: selector,
            index: index,
            className: className,
            text: text,
            element: el
          });
        }
      });
    }
  });
  
  // 找到互动数据元素，静默返回
  
  return results;
}

// 超快速提取函数 - 使用最优化的选择器
function __wx_extract_super_fast() {
  if (!window.__wx_fast_selectors__) return null;
  
  const data = {};
  
  Object.keys(window.__wx_fast_selectors__).forEach(key => {
    const selector = window.__wx_fast_selectors__[key];
    try {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        const match = text.match(/^\d+$/);
        if (match && parseInt(match) > 0) {
          data[key] = parseInt(match);
        } else {
          data[key] = null;
        }
      } else {
        data[key] = null;
      }
    } catch (e) {
      data[key] = null;
    }
  });
  
  const validCount = Object.keys(data).filter(key => data[key] !== null && data[key] > 0).length;
  
  if (validCount >= 3) {
    return data;
  }
  
  return null;
}

function __wx_extract_interaction_data() {
  // 策略0A：超快速选择器（最优化）
  const superFastResult = __wx_extract_super_fast();
  if (superFastResult) {
    const validCount = Object.keys(superFastResult).filter(key => superFastResult[key] !== null && superFastResult[key] > 0).length;
    if (validCount >= 3) {
      return superFastResult;
    }
  }
  
  // 策略0B：学习选择器（备用优雅方案）
  if (window.__wx_interaction_selectors__) {
    const learnedResult = __wx_extract_by_learned_selectors();
    const validCount = Object.keys(learnedResult).filter(key => learnedResult[key] !== null && learnedResult[key] > 0).length;
    
    if (validCount >= 3) {
      return learnedResult;
    }
  }
  
  /*
   * 互动数据提取策略说明：
   * 
   * 策略1：基于互动区域的精准提取 【失败原因：微信class命名不规范】
   * 思路：查找包含关键词的容器（interaction, operate, action, bottom, tool等）
   * 优点：目标明确，减少误判
   * 缺点：依赖class命名规范，微信不使用标准关键词
   * 适用场景：标准化的社交平台（如Bootstrap风格的网站）
   * 
   * 策略2：全页面数字分析 【失败原因：过滤条件过严】
   * 思路：遍历整页，过滤年份/小数字/页码，关注页面下半部分
   * 优点：覆盖面广，不依赖特定class
   * 缺点：过滤规则复杂，可能遗漏有效数字
   * 适用场景：数字干扰较多的复杂页面
   * 
   * 策略3：视觉启发式方法 【部分成功：精准度不足】
   * 思路：查找页面底部包含≥4个数字的容器
   * 优点：实现简单，不过度过滤
   * 缺点：精准度较低，容易找到无关数字
   * 适用场景：简单页面结构，数字干扰较少
   * 
   * 策略4：智能行排列检测 【最佳策略：模拟人眼识别】
   * 思路：
   *   1. 找到页面下方所有合理数字（10-1000000范围）
   *   2. 按Y坐标分组（20px容差），识别"行"
   *   3. 找到包含≥4个数字的行
   *   4. 选择最底部的行（互动数据通常在最下方）
   *   5. 按X坐标排序（从左到右：点赞、转发、收藏、评论）
   * 优点：最智能，适应性强，模拟人眼识别过程
   * 缺点：计算复杂度稍高
   * 适用场景：各种复杂的社交平台布局
   */
  
  const strategies = [
    // 策略1：基于互动区域的精准提取 [已注释 - 微信class不规范]
    /*
    () => {
      const data = {};
      const interactionAreas = document.querySelectorAll('[class*="interaction"], [class*="operate"], [class*="action"], [class*="bottom"], [class*="tool"]');
      
      for (let area of interactionAreas) {
        const numbers = [];
        const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            const text = node.textContent.trim();
            const match = text.match(/^(\d+)$/);
            return (match && parseInt(match[1]) > 0 && parseInt(match[1]) < 10000000) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        });
        
        let node;
        while (node = walker.nextNode()) {
          const value = parseInt(node.textContent.trim());
          const parent = node.parentElement;
          numbers.push({ value, element: parent, position: parent.getBoundingClientRect() });
        }
        
        numbers.sort((a, b) => a.position.left - b.position.left);
        if (numbers.length >= 4) {
          data.likes = numbers[0].value;
          data.shares = numbers[1].value;
          data.favorites = numbers[2].value;
          data.comments = numbers[3].value;
          break;
        }
      }
      return data;
    },
    */
    
    // 策略2：全页面数字分析 [已注释 - 过滤过严]
    /*
    () => {
      const numbers = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
          const text = node.textContent.trim();
          const match = text.match(/^(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && num < 10000000 && 
                !text.match(/^\d{4}$/) && !text.match(/^\d{1,2}$/) &&
                num !== 1 && num !== 2 && num !== 3 && num !== 4 && num !== 5) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_REJECT;
        }
      });
      
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        if (parent && parent.offsetHeight > 0 && parent.offsetWidth > 0) {
          const position = parent.getBoundingClientRect();
          if (position.top > window.innerHeight * 0.3) {
            numbers.push({ value: parseInt(node.textContent.trim()), position });
          }
        }
      }
      
      numbers.sort((a, b) => {
        const yDiff = a.position.top - b.position.top;
        return Math.abs(yDiff) < 50 ? a.position.left - b.position.left : yDiff;
      });
      
      const data = {};
      if (numbers.length > 0) {
        const bottomY = Math.max(...numbers.map(n => n.position.top));
        const bottomNumbers = numbers.filter(n => Math.abs(n.position.top - bottomY) < 20)
                                   .sort((a, b) => a.position.left - b.position.left);
        if (bottomNumbers.length >= 4) {
          data.likes = bottomNumbers[0].value;
          data.shares = bottomNumbers[1].value;
          data.favorites = bottomNumbers[2].value;
          data.comments = bottomNumbers[3].value;
        }
      }
      return data;
    },
    */
    
    // 策略3：视觉启发式方法 [已注释 - 精准度不足]
    /*
    () => {
      const data = {};
      const containers = document.querySelectorAll('div, span, section');
      
      for (let container of containers) {
        const rect = container.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5) continue;
        
        const text = container.textContent.trim();
        const numbers = text.match(/\d+/g);
        
        if (numbers && numbers.length >= 4) {
          const validNumbers = numbers.map(n => parseInt(n))
                                    .filter(n => n > 0 && n < 10000000 && n > 10);
          if (validNumbers.length >= 4) {
            data.likes = validNumbers[0];
            data.shares = validNumbers[1];
            data.favorites = validNumbers[2];
            data.comments = validNumbers[3];
            break;
          }
        }
      }
      return data;
    },
    */
    
    // 策略4：智能行排列检测 ⭐ 【当前最佳策略】
    () => {
      const data = {};
      const foundNumbers = [];
      
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            const text = node.textContent.trim();
            return text.match(/^\d+$/) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        const value = parseInt(node.textContent.trim());
        const parent = node.parentElement;
        
        if (parent && parent.offsetHeight > 0 && parent.offsetWidth > 0) {
          const position = parent.getBoundingClientRect();
          
          // 重点关注页面下方的数字，且数值合理
          if (position.top > window.innerHeight * 0.4 && 
              value >= 10 && value < 1000000 && 
              position.width < 200 && // 排除太宽的元素
              position.height < 100) { // 排除太高的元素
            foundNumbers.push({
              value: value,
              element: parent,
              position: position,
              text: node.textContent.trim()
            });
          }
        }
      }
      
      if (foundNumbers.length >= 4) {
        // 按Y坐标分组，找到同一行的数字
        const rows = {};
        foundNumbers.forEach(num => {
          const rowKey = Math.round(num.position.top / 20) * 20; // 20px容差
          if (!rows[rowKey]) rows[rowKey] = [];
          rows[rowKey].push(num);
        });
        
        // 找到包含4个或更多数字的行
        const validRows = Object.values(rows).filter(row => row.length >= 4);
        
        if (validRows.length > 0) {
          // 选择最底部的行
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
      
      return data;
    }
  ];
  
  let bestResult = null;
  let maxCount = 0;
  
  strategies.forEach((strategy, index) => {
    try {
      const result = strategy();
      const count = Object.keys(result).filter(key => result[key] !== null && result[key] > 0).length;
      
      // 优先选择数据完整且数值合理的结果
      const isValid = count >= 3 && 
                     Object.values(result).every(v => v === null || (v > 0 && v < 100000000));
      
      if (isValid && (count > maxCount || 
          (count === maxCount && Object.values(result).reduce((sum, v) => sum + (v || 0), 0) > 
           Object.values(bestResult || {}).reduce((sum, v) => sum + (v || 0), 0)))) {
        maxCount = count;
        bestResult = result;
        
        // 如果策略4（智能行排列检测）成功且还没有学习选择器，自动运行反向工程
        if (index === 3 && count === 4 && !window.__wx_interaction_selectors__) {
          setTimeout(() => {
            __wx_reverse_engineer_selectors();
          }, 500);
        }
      }
    } catch (e) {
      // 静默处理错误
    }
  });
  
  return bestResult || {};
}

function __wx_debug_page_structure() {
  // 静默调试页面结构
  
  // 1. 分析页面整体结构
  const bodyChildren = Array.from(document.body.children);
  
  // 2. 查找所有包含数字的元素
  const elementsWithNumbers = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        const hasNumber = text.match(/\d+/);
        const isVisible = node.offsetHeight > 0 && node.offsetWidth > 0;
        return hasNumber && isVisible ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    const numbers = text.match(/\d+/g);
    if (numbers) {
      elementsWithNumbers.push({
        tagName: node.tagName,
        className: node.className,
        text: text,
        numbers: numbers,
        position: node.getBoundingClientRect()
      });
    }
  }
  
  // 按位置排序（从下到上）
  elementsWithNumbers.sort((a, b) => b.position.bottom - a.position.bottom);
  
  return elementsWithNumbers;
}

// 反向工程：从已找到的元素推导CSS选择器
function __wx_reverse_engineer_selectors() {
  // 静默运行反向工程分析
  
  // 使用策略4找到准确的互动数据元素
  const foundNumbers = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        return text.match(/^\d+$/) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    const value = parseInt(node.textContent.trim());
    const parent = node.parentElement;
    
    if (parent && parent.offsetHeight > 0 && parent.offsetWidth > 0) {
      const position = parent.getBoundingClientRect();
      
      if (position.top > window.innerHeight * 0.4 && 
          value >= 10 && value < 1000000 && 
          position.width < 200 && 
          position.height < 100) {
        foundNumbers.push({
          value: value,
          element: parent,
          textNode: node,
          position: position
        });
      }
    }
  }
  
  if (foundNumbers.length >= 4) {
    // 按Y坐标分组找到同一行
    const rows = {};
    foundNumbers.forEach(num => {
      const rowKey = Math.round(num.position.top / 20) * 20;
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(num);
    });
    
    const validRows = Object.values(rows).filter(row => row.length >= 4);
    
    if (validRows.length > 0) {
      const bottomRow = validRows.reduce((max, current) => 
        current[0].position.top > max[0].position.top ? current : max
      );
      
      bottomRow.sort((a, b) => a.position.left - b.position.left);
      
      if (bottomRow.length >= 4) {
        const interactionElements = {
          likes: bottomRow[0],
          shares: bottomRow[1], 
          favorites: bottomRow[2],
          comments: bottomRow[3]
        };
        
        const selectors = {};
        
        Object.keys(interactionElements).forEach(key => {
          const elem = interactionElements[key];
          const analysis = __wx_analyze_element_selectors(elem.element, elem.textNode, key, elem.value);
          selectors[key] = analysis;
        });
        
        // 存储选择器映射，并创建优化的快速选择器
        window.__wx_interaction_selectors__ = selectors;
        
        // 创建基于aria-label的快速选择器映射（基于实际分析结果）
        const actualSelectors = {};
        Object.keys(interactionElements).forEach(key => {
          const elem = interactionElements[key];
          const hierarchyInfo = selectors[key].hierarchy[1];
          if (hierarchyInfo && hierarchyInfo.ariaLabel) {
            const ariaLabel = hierarchyInfo.ariaLabel;
            // 提取aria-label中的关键词
            if (ariaLabel.includes('喜欢')) {
              actualSelectors[key] = `[aria-label*="喜欢"] .text`;
            } else if (ariaLabel.includes('点赞')) {
              actualSelectors[key] = `[aria-label*="点赞"] .text`;
            } else if (ariaLabel.includes('分享')) {
              actualSelectors[key] = `[aria-label*="分享"] .text`;
            } else if (ariaLabel.includes('转发')) {
              actualSelectors[key] = `[aria-label*="转发"] .text`;
            } else if (ariaLabel.includes('收藏')) {
              actualSelectors[key] = `[aria-label*="收藏"] .text`;
            } else if (ariaLabel.includes('评论')) {
              actualSelectors[key] = `[aria-label*="评论"] .text`;
            } else {
              // fallback：直接使用完整的aria-label
              actualSelectors[key] = `[aria-label="${ariaLabel}"] .text`;
            }
          }
        });
        
        window.__wx_fast_selectors__ = actualSelectors;
        
        return selectors;
      }
    }
  }
  
  // 未能找到足够的互动数据元素进行分析
  return null;
}

// 分析单个元素的选择器特征
function __wx_analyze_element_selectors(element, textNode, type, value) {
  const analysis = {
    value: value,
    type: type,
    tagName: element.tagName,
    className: element.className,
    id: element.id,
    selectors: {
      byClass: null,
      byAttribute: null,
      byPosition: null,
      byParent: null
    },
    hierarchy: [],
    attributes: {}
  };
  
  // 1. 分析class选择器
  if (element.className) {
    const classes = element.className.split(/\s+/).filter(c => c);
    analysis.selectors.byClass = classes.map(c => `.${c}`);
  }
  
  // 2. 分析所有属性
  Array.from(element.attributes).forEach(attr => {
    analysis.attributes[attr.name] = attr.value;
    
    // 生成属性选择器
    if (attr.name !== 'class' && attr.name !== 'id') {
      if (!analysis.selectors.byAttribute) analysis.selectors.byAttribute = [];
      analysis.selectors.byAttribute.push(`[${attr.name}="${attr.value}"]`);
    }
  });
  
  // 3. 分析层级结构（向上追溯3层）
  let current = element;
  let level = 0;
  while (current && level < 3) {
    analysis.hierarchy.push({
      level: level,
      tagName: current.tagName,
      className: current.className,
      id: current.id,
      role: current.getAttribute('role'),
      ariaLabel: current.getAttribute('aria-label')
    });
    current = current.parentElement;
    level++;
  }
  
  // 4. 分析父容器选择器
  const parent = element.parentElement;
  if (parent) {
    const parentClasses = parent.className.split(/\s+/).filter(c => c);
    if (parentClasses.length > 0) {
      analysis.selectors.byParent = parentClasses.map(c => `.${c} .${element.className.split(/\s+/)[0]}`);
    }
  }
  
  // 5. 生成组合选择器建议
  analysis.recommendedSelectors = [];
  
  if (element.className) {
    const mainClass = element.className.split(/\s+/)[0];
    analysis.recommendedSelectors.push(`.${mainClass}`);
  }
  
  if (element.getAttribute('role')) {
    analysis.recommendedSelectors.push(`[role="${element.getAttribute('role')}"]`);
  }
  
  if (element.getAttribute('aria-label')) {
    analysis.recommendedSelectors.push(`[aria-label*="${element.getAttribute('aria-label')}"]`);
  }
  
  return analysis;
}

// 基于反向工程的选择器创建精确提取函数
function __wx_extract_by_learned_selectors() {
  if (!window.__wx_interaction_selectors__) {
    __wx_log({
      msg: "未找到学习到的选择器，请先运行反向工程分析"
    });
    return {};
  }
  
  const data = {};
  
  // 策略A：使用aria-label精确匹配（最可靠）
  const ariaStrategies = {
    likes: ['[aria-label*="喜欢"]', '[aria-label*="点赞"]', '[aria-label*="like"]'],
    shares: ['[aria-label*="分享"]', '[aria-label*="转发"]', '[aria-label*="share"]'],
    favorites: ['[aria-label*="收藏"]', '[aria-label*="favorite"]', '[aria-label*="star"]'],
    comments: ['[aria-label*="评论"]', '[aria-label*="comment"]', '[aria-label*="reply"]']
  };
  
  Object.keys(ariaStrategies).forEach(key => {
    let value = null;
    
    for (let ariaSelector of ariaStrategies[key]) {
      try {
        const containers = document.querySelectorAll(ariaSelector);
        for (let container of containers) {
          // 在容器内查找.text元素
          const textEl = container.querySelector('.text');
          if (textEl) {
            const text = textEl.textContent.trim();
            const match = text.match(/^\d+$/);
            if (match && parseInt(match) > 0) {
              value = parseInt(match);
              break;
            }
          }
          
          // 也检查容器本身是否包含数字
          const containerText = container.textContent.trim();
          const containerMatch = containerText.match(/(\d+)/);
          if (containerMatch && parseInt(containerMatch[1]) > 0 && parseInt(containerMatch[1]) < 1000000) {
            value = parseInt(containerMatch[1]);
            break;
          }
        }
        if (value) break;
      } catch (e) {
        continue;
      }
    }
    
    data[key] = value;
  });
  
  // 策略B：如果aria-label策略失败，使用学习到的选择器
  const selectors = window.__wx_interaction_selectors__;
  
  Object.keys(data).forEach(key => {
    if (data[key] !== null) return; // 已经找到数据，跳过
    
    const selectorInfo = selectors[key];
    if (!selectorInfo) return;
    
    let value = null;
    
    // 基于层级结构的精确匹配
    const hierarchyInfo = selectorInfo.hierarchy[1]; // 父容器信息
    if (hierarchyInfo && hierarchyInfo.ariaLabel) {
      const ariaPattern = hierarchyInfo.ariaLabel;
      try {
        const containers = document.querySelectorAll(`[aria-label="${ariaPattern}"]`);
        for (let container of containers) {
          const textEl = container.querySelector('.text');
          if (textEl) {
            const text = textEl.textContent.trim();
            const match = text.match(/^\d+$/);
            if (match && parseInt(match) > 0) {
              value = parseInt(match);
              break;
            }
          }
        }
      } catch (e) {}
    }
    
    // fallback到原始策略
    if (value === null) {
      const strategies = [
        () => selectorInfo.selectors.byParent,
        () => selectorInfo.selectors.byClass,
        () => selectorInfo.selectors.byAttribute,
        () => selectorInfo.recommendedSelectors
      ];
      
      for (let getSelectors of strategies) {
        const selectorList = getSelectors();
        if (!selectorList) continue;
        
        for (let selector of selectorList) {
          try {
            const elements = document.querySelectorAll(selector);
            for (let el of elements) {
              const text = el.textContent.trim();
              const match = text.match(/^\d+$/);
              if (match && parseInt(match) > 0 && parseInt(match) < 1000000) {
                value = parseInt(match);
                break;
              }
            }
            if (value) break;
          } catch (e) {
            continue;
          }
        }
        if (value) break;
      }
    }
    
    data[key] = value;
  });
  
  // 静默返回结果
  
  return data;
}

function __wx_manual_extract_interaction() {
  const data = __wx_extract_interaction_data();
  
  // 简洁的手动提取输出
  const validData = Object.keys(data).filter(key => data[key] !== null && data[key] > 0);
  if (validData.length > 0) {
    const summary = validData.map(key => `${key}:${data[key]}`).join(', ');
    __wx_log({
      msg: `📊 ${summary}`
    });
  } else {
    __wx_log({
      msg: `📊 未找到互动数据`
    });
  }
  
  // 如果当前有profile，将互动数据添加进去
  if (__wx_channels_store__.profile) {
    __wx_channels_store__.profile.interactionData = data;
    
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

// 集成互动数据提取到自动下载流程中
function __wx_integrate_interaction_data() {
  // 监听profile变化，自动提取互动数据
  let lastVideoId = null;
  let extractedVideos = new Set(); // 记录已提取过互动数据的视频
  
  setInterval(() => {
    if (__wx_channels_store__.profile) {
      const currentVideoId = __wx_channels_store__.profile.id || __wx_channels_store__.profile.nonce_id || __wx_channels_store__.profile.title;
      
      // 检查是否是新视频且未提取过互动数据
      if (currentVideoId && 
          currentVideoId !== lastVideoId && 
          !extractedVideos.has(currentVideoId) &&
          !__wx_channels_store__.profile.interactionData) {
        
        lastVideoId = currentVideoId;
        
        // 延迟一点时间让页面完全加载
        setTimeout(() => {
          const interactionData = __wx_extract_interaction_data();
          const validData = Object.keys(interactionData).filter(key => interactionData[key] !== null && interactionData[key] > 0);
          
          if (validData.length >= 3) {
            // 标记此视频已提取过互动数据
            extractedVideos.add(currentVideoId);
            
            // 控制Set大小，避免内存泄漏
            if (extractedVideos.size > 100) {
              const first = extractedVideos.values().next().value;
              extractedVideos.delete(first);
            }
            
            __wx_channels_store__.profile.interactionData = interactionData;
            
            // 简洁的互动数据输出
            const summary = validData.map(key => `${key}:${interactionData[key]}`).join(', ');
            __wx_log({
              msg: `📊 ${summary}`
            });
            
            // 发送更新的profile数据到后端
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
          }
        }, 2000);
      }
    }
  }, 1000);
}

// 静默初始化完成

// 启动互动数据集成
__wx_integrate_interaction_data();
var $icon = document.createElement("div");
$icon.innerHTML =
  '<div data-v-6548f11a data-v-132dee25 class="click-box op-item item-gap-combine" role="button" aria-label="下载" style="padding: 4px 4px 4px 4px; --border-radius: 4px; --left: 0; --top: 0; --right: 0; --bottom: 0;"><svg data-v-132dee25 class="svg-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="28" height="28"><path d="M213.333333 853.333333h597.333334v-85.333333H213.333333m597.333334-384h-170.666667V128H384v256H213.333333l298.666667 298.666667 298.666667-298.666667z"></path></svg></div>';
var __wx_channels_video_download_btn__ = $icon.firstChild;
__wx_channels_video_download_btn__.onclick = () => {
  if (!window.__wx_channels_store__.profile) {
    return;
  }
  __wx_channels_handle_click_download__(
    window.__wx_channels_store__.profile.spec[0]
  );
};
var count = 0;
// 静默等待注入下载按钮
var __timer = setInterval(() => {
  count += 1;
  // const $wrap1 = document.getElementsByClassName("feed-card-wrap")[0];
  // const $wrap2 = document.getElementsByClassName(
  //   "operate-row transition-show"
  // )[0];
  const $wrap3 = document.getElementsByClassName("full-opr-wrp layout-row")[0];
  const $wrap4 = document.getElementsByClassName("full-opr-wrp layout-col")[0];
  if (!$wrap3 && !$wrap4) {
    if (count >= 5) {
      clearInterval(__timer);
      __timer = null;
      fetch("/__wx_channels_api/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msg: "💡 请在「更多」菜单中下载",
        }),
      });
    }
    return;
  }
  clearInterval(__timer);
  __timer = null;
  if ($wrap3) {
    const relative_node = $wrap3.children[$wrap3.children.length - 1];
    if (!relative_node) {
      // 下载按钮注入成功（静默）
      $wrap3.appendChild(__wx_channels_video_download_btn__);
      return;
    }
    // 下载按钮注入成功（静默）
    $wrap3.insertBefore(__wx_channels_video_download_btn__, relative_node);
  }
  if ($wrap4) {
    $icon.innerHTML =
      '<div data-v-132dee25 class="context-menu__wrp item-gap-combine op-more-btn"><div class="context-menu__target"><div data-v-6548f11a data-v-132dee25 class="click-box op-item" role="button" aria-label="下载" style="padding: 4px 4px 4px 4px; --border-radius: 4px; --left: 0; --top: 0; --right: 0; --bottom: 0;"><svg data-v-132dee25 class="svg-icon icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="28" height="28"><path d="M213.333333 853.333333h597.333334v-85.333333H213.333333m597.333334-384h-170.666667V128H384v256H213.333333l298.666667 298.666667 298.666667-298.666667z"></path></svg></div></div></div>';
    __wx_channels_video_download_btn__ = $icon.firstChild;
    __wx_channels_video_download_btn__.onclick = () => {
      if (!window.__wx_channels_store__.profile) {
        return;
      }
      __wx_channels_handle_click_download__(
        window.__wx_channels_store__.profile.spec[0]
      );
    };
    const relative_node = $wrap4.children[$wrap4.children.length - 1];
    if (!relative_node) {
      // 下载按钮注入成功（静默）
      $wrap4.appendChild(__wx_channels_video_download_btn__);
      return;
    }
    // 下载按钮注入成功（静默）
    $wrap4.insertBefore(__wx_channels_video_download_btn__, relative_node);
  }
}, 1000);
