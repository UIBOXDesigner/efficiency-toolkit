// 笔记功能
const NOTES_KEY = 'efficiency_toolkit_notes';

// 保存笔记
document.getElementById('saveBtn').addEventListener('click', async () => {
  const content = document.getElementById('noteContent').value.trim();
  if (!content) {
    alert('请输入笔记内容');
    return;
  }
  
  const notes = await getNotes();
  const note = {
    id: Date.now(),
    content: content,
    time: new Date().toLocaleString('zh-CN')
  };
  
  notes.unshift(note);
  await chrome.storage.local.set({ [NOTES_KEY]: notes });
  
  document.getElementById('noteContent').value = '';
  renderNotes();
  
  // 显示保存成功
  const btn = document.getElementById('saveBtn');
  btn.textContent = '已保存 ✓';
  setTimeout(() => btn.textContent = '保存笔记', 1500);
});

// 清空
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('noteContent').value = '';
});

// 获取笔记列表
async function getNotes() {
  const result = await chrome.storage.local.get(NOTES_KEY);
  return result[NOTES_KEY] || [];
}

// 渲染笔记列表
async function renderNotes() {
  const notes = await getNotes();
  const container = document.getElementById('notesContainer');
  
  if (notes.length === 0) {
    container.innerHTML = '<p style="color:#999;font-size:12px;">暂无笔记</p>';
    return;
  }
  
  container.innerHTML = notes.map(note => `
    <div class="note-item" data-id="${note.id}">
      <div class="time">${note.time}</div>
      <div class="content">${escapeHtml(note.content)}</div>
    </div>
  `).join('');
  
  // 点击加载笔记
  container.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const note = notes.find(n => n.id === id);
      if (note) {
        document.getElementById('noteContent').value = note.content;
      }
    });
  });
}

// 转义 HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初始化
renderNotes();
