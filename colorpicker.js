// 取色器功能
let isPicking = false;
let eyeDropper = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initPalette();
  setupEventListeners();
  checkEyeDropperSupport();
});

// 检查 EyeDropper API 支持
function checkEyeDropperSupport() {
  if (!window.EyeDropper) {
    document.getElementById('pickBtn').textContent = '⚠️ 浏览器不支持取色器';
    document.getElementById('pickBtn').disabled = true;
  }
}

// 初始化常用颜色调色板
function initPalette() {
  const colors = [
    // 基础色
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
    // 红色系
    '#FF6B6B', '#EE5A24', '#D63031', '#C0392B', '#E74C3C', '#FF7675',
    // 橙色系
    '#FDCB6E', '#F39C12', '#E67E22', '#FF9F43', '#E17055',
    // 黄色系
    '#FFEAA7', '#F1C40F', '#F9CA24', '#FFFF00',
    // 绿色系
    '#55EFC4', '#00B894', '#27AE60', '#2ECC71', '#7BED9F', '#A3CB38',
    // 蓝色系
    '#74B9FF', '#0984E3', '#3498DB', '#5DADE2', '#00CEC9',
    // 紫色系
    '#A29BFE', '#6C5CE7', '#8E44AD', '#9B59B6', '#D980FA',
    // 粉色系
    '#FD79A8', '#E84393', '#F368E0', '#FF85A2',
    // 棕色系
    '#B2BEC3', '#636E72', '#2D3436', '#353B48', '#7f8c8d',
    // 渐变常用
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'
  ];
  
  const container = document.getElementById('paletteColors');
  container.innerHTML = colors.map(color => 
    `<div class="palette-item" style="background: ${color};" data-color="${color}" title="${color}"></div>`
  ).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('click', () => {
      const color = item.dataset.color;
      setColor(color);
    });
  });
}

// 事件监听
function setupEventListeners() {
  // 取色按钮
  document.getElementById('pickBtn').addEventListener('click', startPicking);
  
  // 复制按钮
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      copyToClipboard(input.value);
      
      const originalText = btn.textContent;
      btn.textContent = '已复制 ✓';
      setTimeout(() => btn.textContent = originalText, 1500);
    });
  });
  
  // 预览图点击取色
  document.getElementById('colorPreview').addEventListener('click', startPicking);
}

// 开始取色
async function startPicking() {
  if (!window.EyeDropper) {
    alert('您的浏览器不支持取色功能，请使用 Chrome/Edge 等浏览器');
    return;
  }
  
  isPicking = true;
  const btn = document.getElementById('pickBtn');
  const preview = document.getElementById('colorPreview');
  const icon = document.getElementById('previewIcon');
  
  btn.textContent = '🎯 点击页面取色中...';
  btn.classList.add('picking');
  icon.textContent = '👆';
  
  try {
    const result = await eyeDropper.open();
    setColor(result.sRGBHex);
  } catch (e) {
    console.log('取色取消:', e);
  } finally {
    isPicking = false;
    btn.textContent = '🎯 开始取色';
    btn.classList.remove('picking');
    icon.textContent = '🎯';
  }
}

// 设置颜色
function setColor(hex) {
  // 转换颜色
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  
  // 更新预览
  const preview = document.getElementById('colorPreview');
  preview.style.background = hex;
  
  // 更新输入框
  document.getElementById('hexValue').value = hex.toUpperCase();
  document.getElementById('rgbValue').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById('hslValue').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  document.getElementById('hsbValue').value = `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`;
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// 颜色转换函数
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function rgbToHsb(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100)
  };
}

// 初始化 EyeDropper
if (window.EyeDropper) {
  eyeDropper = new EyeDropper();
}
