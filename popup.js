// Popup 交互逻辑
document.getElementById('screenshotBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'screenshot' });
});

document.getElementById('noteBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openNote' });
});

document.getElementById('converterBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openConverter' });
});

document.getElementById('taskBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openTask' });
});

// 快捷键监听
chrome.commands.onCommand.addListener((command) => {
  if (command === 'screenshot') {
    chrome.runtime.sendMessage({ action: 'screenshot' });
  } else if (command === 'note') {
    chrome.runtime.sendMessage({ action: 'openNote' });
  }
});
