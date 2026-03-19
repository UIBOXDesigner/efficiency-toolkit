// 任务管理功能
const TASKS_KEY = 'efficiency_toolkit_tasks';
let tasks = [];
let currentTab = 'all';

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  renderTasks();
  setupEventListeners();
});

// 加载任务
async function loadTasks() {
  const result = await chrome.storage.local.get(TASKS_KEY);
  tasks = result[TASKS_KEY] || [];
  updateStats();
}

// 保存任务
async function saveTasks() {
  await chrome.storage.local.set({ [TASKS_KEY]: tasks });
  updateStats();
}

// 更新统计
function updateStats() {
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('doneCount').textContent = done;
}

// 渲染任务
function renderTasks() {
  const container = document.getElementById('taskList');
  
  let filteredTasks = tasks;
  if (currentTab === 'pending') {
    filteredTasks = tasks.filter(t => !t.done);
  } else if (currentTab === 'done') {
    filteredTasks = tasks.filter(t => t.done);
  }
  
  // 按优先级和截止日期排序
  filteredTasks.sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });
  
  if (filteredTasks.length === 0) {
    container.innerHTML = '<div class="empty">暂无任务</div>';
    return;
  }
  
  container.innerHTML = filteredTasks.map(task => `
    <div class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="priority-${task.priority}">${getPriorityText(task.priority)}</span>
          ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
          ${task.autoScheduled ? '<span>🤖 自动安排</span>' : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn delete-btn" data-action="delete">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // 绑定事件
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = parseInt(e.target.closest('.task-item').dataset.id);
      toggleTask(id);
    });
  });
  
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.closest('.task-item').dataset.id);
      deleteTask(id);
    });
  });
}

// 事件监听
function setupEventListeners() {
  // 添加任务
  document.getElementById('addBtn').addEventListener('click', addTask);
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  // Tab 切换
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderTasks();
    });
  });
  
  // 智能安排
  document.getElementById('autoScheduleBtn').addEventListener('click', autoSchedule);
}

// 添加任务
async function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('prioritySelect').value;
  const dueDate = document.getElementById('dateInput').value;
  
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  
  const task = {
    id: Date.now(),
    title: title,
    priority: priority,
    dueDate: dueDate || null,
    done: false,
    autoScheduled: false,
    createdAt: new Date().toISOString()
  };
  
  tasks.unshift(task);
  await saveTasks();
  renderTasks();
  
  input.value = '';
  document.getElementById('dateInput').value = '';
}

// 切换任务状态
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    await saveTasks();
    renderTasks();
  }
}

// 删除任务
async function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  await saveTasks();
  renderTasks();
}

// 智能安排任务
async function autoSchedule() {
  const pendingTasks = tasks.filter(t => !t.done);
  
  if (pendingTasks.length === 0) {
    document.getElementById('scheduleInfo').textContent = '没有待安排的任务';
    return;
  }
  
  // 智能安排算法
  const today = new Date();
  let currentDate = new Date(today);
  
  // 按优先级分配
  const priorityOrder = ['high', 'medium', 'low'];
  
  for (const priority of priorityOrder) {
    const priorityTasks = pendingTasks.filter(t => t.priority === priority && !t.dueDate);
    
    for (const task of priorityTasks) {
      // 高优先级今天完成，中优先级明天，低优先级后天
      let daysToAdd = priorityOrder.indexOf(priority);
      
      // 如果是周末，往后推
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        daysToAdd++;
      }
      
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      task.dueDate = dueDate.toISOString().split('T')[0];
      task.autoScheduled = true;
    }
  }
  
  await saveTasks();
  renderTasks();
  
  document.getElementById('scheduleInfo').textContent = 
    `已自动安排 ${pendingTasks.length} 个任务，高优先级今天完成，中优先级明天，低优先级后天`;
}

// 工具函数
function getPriorityText(priority) {
  const map = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' };
  return map[priority] || '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
