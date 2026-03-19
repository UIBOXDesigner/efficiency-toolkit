// 格式转换功能
let currentType = 'json';

// 类型切换
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    document.getElementById('input').value = '';
    document.getElementById('result').textContent = '结果将显示在这里';
  });
});

// 转换
document.getElementById('convertBtn').addEventListener('click', () => {
  const input = document.getElementById('input').value;
  let result = '';
  
  try {
    switch (currentType) {
      case 'json':
        const json = JSON.parse(input);
        result = JSON.stringify(json, null, 2);
        break;
        
      case 'base64':
        // 自动判断编码还是解码
        try {
          result = atob(input);
        } catch {
          result = btoa(unescape(encodeURIComponent(input)));
        }
        break;
        
      case 'timestamp':
        const ts = parseInt(input);
        if (isNaN(ts)) {
          // 尝试解析日期
          const date = new Date(input);
          if (!isNaN(date.getTime())) {
            result = `秒: ${Math.floor(date.getTime() / 1000)}\n毫秒: ${date.getTime()}\n\n秒→日期: ${new Date(ts * 1000).toLocaleString('zh-CN')}\n毫秒→日期: ${new Date(ts).toLocaleString('zh-CN')}`;
          } else {
            result = '请输入有效的时间戳或日期';
          }
        } else {
          // 判断是秒还是毫秒
          const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
          result = `秒: ${ts}\n毫秒: ${ts * 1000}\n日期: ${date.toLocaleString('zh-CN')}\nISO: ${date.toISOString()}`;
        }
        break;
        
      case 'url':
        try {
          result = decodeURIComponent(input);
        } catch {
          result = encodeURIComponent(input);
        }
        break;
        
      case 'md5':
        result = 'MD5 加密需要引入 crypto-js 库';
        break;
    }
  } catch (e) {
    result = '转换错误: ' + e.message;
  }
  
  document.getElementById('result').textContent = result;
});

// 复制结果
document.getElementById('copyBtn').addEventListener('click', () => {
  const result = document.getElementById('result').textContent;
  navigator.clipboard.writeText(result);
  const btn = document.getElementById('copyBtn');
  btn.textContent = '已复制 ✓';
  setTimeout(() => btn.textContent = '复制结果', 1500);
});

// 清空
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('input').value = '';
  document.getElementById('result').textContent = '结果将显示在这里';
});
