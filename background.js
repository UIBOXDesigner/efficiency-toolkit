// Background Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'screenshot') {
    takeScreenshot();
  } else if (request.action === 'openNote') {
    openNote();
  } else if (request.action === 'openConverter') {
    openConverter();
  }
});

// 截图功能
async function takeScreenshot() {
  try {
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    const stream = await chrome.desktopCapture.chooseDesktopMedia(['screen'], (streamId) => {
      if (streamId) {
        chrome.tabs.sendMessage(tab[0].id, { action: 'captureStream', streamId: streamId });
      }
    });
  } catch (error) {
    console.error('Screenshot failed:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Screenshot',
      message: '截图功能需要授权屏幕录制'
    });
  }
}

// 打开笔记
function openNote() {
  chrome.tabs.create({ url: 'note.html' });
}

// 打开格式转换器
function openConverter() {
  chrome.tabs.create({ url: 'converter.html' });
}

// 安装时显示欢迎
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Efficiency Toolkit 已安装!',
      message: '点击插件图标开始使用，或使用快捷键 Ctrl+Shift+S 截图'
    });
  }
});
