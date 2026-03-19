// 录屏功能
let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let recordingStartTime = null;
let timerInterval = null;
let recordedBlob = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

// 事件监听
function setupEventListeners() {
  // 录制类型切换
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 开始录制
  document.getElementById('startBtn').addEventListener('click', startRecording);
  
  // 停止录制
  document.getElementById('stopBtn').addEventListener('click', stopRecording);
  
  // 分享
  document.getElementById('shareBtn').addEventListener('click', shareVideo);
}

// 开始录制
async function startRecording() {
  try {
    const type = document.querySelector('.type-btn.active').dataset.type;
    const quality = document.getElementById('quality').value;
    const audio = document.getElementById('audio').value;
    
    // 获取屏幕流
    const displayMediaOptions = {
      video: {
        displaySurface: type === 'screen' ? 'monitor' : type === 'window' ? 'window' : 'browser'
      },
      audio: audio !== 'none'
    };
    
    stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    
    // 添加麦克风音频
    if (audio === 'microphone' || audio === 'both') {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];
        stream.addTrack(audioTrack);
      } catch (e) {
        console.log('无法获取麦克风:', e);
      }
    }
    
    // 预览
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    preview.appendChild(video);
    
    // 录制
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';
    
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(recordedBlob);
      
      const preview = document.getElementById('preview');
      preview.innerHTML = '';
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.autoplay = true;
      preview.appendChild(video);
      
      document.getElementById('shareBtn').disabled = false;
    };
    
    mediaRecorder.start(1000);
    
    // 更新UI
    recordingStartTime = Date.now();
    updateRecordingUI(true);
    
    // 启动计时器
    timerInterval = setInterval(updateTimer, 1000);
    
    // 自动停止
    const maxDuration = parseInt(document.getElementById('maxDuration').value) * 60 * 1000;
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
      }
    }, maxDuration);
    
  } catch (error) {
    console.error('录制失败:', error);
    alert('无法开始录制: ' + error.message);
  }
}

// 停止录制
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  updateRecordingUI(false);
}

// 更新录制UI
function updateRecordingUI(isRecording) {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (isRecording) {
    startBtn.innerHTML = '⏺ 录制中...';
    startBtn.classList.add('recording');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDot.classList.add('recording');
    statusText.textContent = '正在录制...';
  } else {
    startBtn.innerHTML = '🔴 开始录制';
    startBtn.classList.remove('recording');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDot.classList.remove('recording');
    statusText.textContent = '录制完成';
  }
}

// 更新计时器
function updateTimer() {
  if (!recordingStartTime) return;
  
  const elapsed = Date.now() - recordingStartTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  document.getElementById('timer').textContent = 
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 分享视频
async function shareVideo() {
  if (!recordedBlob) {
    alert('没有录制的视频');
    return;
  }
  
  const shareOptions = [
    { id: 'download', name: '📥 下载到本地' },
    { id: 'clipboard', name: '📋 复制到剪贴板' }
  ];
  
  // 创建分享菜单
  const menu = document.createElement('div');
  menu.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  menu.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 20px; width: 280px;">
      <h3 style="margin-bottom: 16px;">分享方式</h3>
      <button id="downloadBtn" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #ddd;background:white;border-radius:8px;cursor:pointer;">
        📥 下载到本地
      </button>
      <button id="clipboardBtn" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #ddd;background:white;border-radius:8px;cursor:pointer;">
        📋 复制视频（可粘贴到微信）
      </button>
      <button id="cancelBtn" style="width:100%;padding:12px;border:none;background:#f0f0f0;border-radius:8px;cursor:pointer;">
        取消
      </button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // 下载
  document.getElementById('downloadBtn').onclick = () => {
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screen-recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    menu.remove();
  };
  
  // 复制到剪贴板
  document.getElementById('clipboardBtn').onclick = async () => {
    try {
      // 尝试使用 Clipboard API 复制视频
      const item = new ClipboardItem({ 'video/webm': recordedBlob });
      await navigator.clipboard.write([item]);
      alert('视频已复制到剪贴板！可粘贴到微信或QQ发送');
    } catch (e) {
      // 降级为复制下载链接
      const url = URL.createObjectURL(recordedBlob);
      await navigator.clipboard.writeText(url);
      alert('视频 blob 已复制（部分浏览器可能不支持）');
    }
    menu.remove();
  };
  
  // 取消
  document.getElementById('cancelBtn').onclick = () => menu.remove();
  menu.onclick = (e) => {
    if (e.target === menu) menu.remove();
  };
}
