const API = 'http://localhost:8000';

const courseSelect = document.getElementById('courseSelect');
const messages    = document.getElementById('messages');
const chatInput   = document.getElementById('chatInput');
const sendBtn     = document.getElementById('sendBtn');
const statusDot   = document.getElementById('statusDot');
const topbarCourse= document.getElementById('topbarCourse');
const fileInput   = document.getElementById('fileInput');
const uploadStatus= document.getElementById('uploadStatus');
const filesList   = document.getElementById('filesList');

// ── Backend health check ──
async function checkBackend() {
  try {
    const res = await fetch(`${API}/`);
    if (res.ok) {
      statusDot.classList.add('online');
      statusDot.classList.remove('offline');
      statusDot.title = 'Backend online';
    }
  } catch {
    statusDot.classList.add('offline');
    statusDot.classList.remove('online');
    statusDot.title = 'Backend offline';
  }
}
checkBackend();
setInterval(checkBackend, 10000);

// ── Course change ──
courseSelect.addEventListener('change', () => {
  topbarCourse.textContent = 'Course: ' + courseSelect.options[courseSelect.selectedIndex].text;
  loadFiles();
});

// ── Load indexed files ──
async function loadFiles() {
  const course = courseSelect.value;
  try {
    const res = await fetch(`${API}/chapters/${course}`);
    const data = await res.json();
    filesList.innerHTML = '';
    if (!data.chapters || data.chapters.length === 0) {
      filesList.innerHTML = '<p class="no-files">No files indexed</p>';
      return;
    }
    data.chapters.forEach(f => {
      const ext = f.split('.').pop();
      const icons = { pdf: 'ti-file-type-pdf', docx: 'ti-file-type-doc', pptx: 'ti-presentation', txt: 'ti-file-text' };
      const icon = icons[ext] || 'ti-file';
      filesList.innerHTML += `
        <div class="file-item">
          <i class="ti ${icon}"></i>
          <span title="${f}">${f}</span>
        </div>`;
    });
  } catch {
    filesList.innerHTML = '<p class="no-files">Could not load files</p>';
  }
}
loadFiles();

// ── Upload file ──
document.getElementById('uploadZone').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  uploadStatus.textContent = '⏳ Uploading & indexing...';
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API}/upload/${courseSelect.value}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    uploadStatus.textContent = '✅ ' + (data.message || 'Done!');
    loadFiles();
  } catch {
    uploadStatus.textContent = '❌ Upload failed';
  }
  fileInput.value = '';
  setTimeout(() => uploadStatus.textContent = '', 4000);
});

// ── AI Tool buttons ──
const toolPrompts = {
  summary:   'Generate a summary of the course with bullet points.',
  quiz:      'Generate 3 quiz questions on this course.',
  level:     'Ask me 3 short questions to detect my level on this course.',
  recommend: 'Give me personalized study recommendations based on this course.'
};

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => sendMessage(toolPrompts[btn.dataset.action]));
});

// ── Quick buttons ──
document.querySelectorAll('.qbtn').forEach(btn => {
  btn.addEventListener('click', () => sendMessage(btn.dataset.q));
});

// ── Add message to UI ──
function addMessage(text, role, sources = []) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'bot' ? 'AI' : 'Me';

  const inner = document.createElement('div');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:#f0f0f5;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>');

  inner.appendChild(bubble);

  if (sources.length) {
    const srcRow = document.createElement('div');
    srcRow.className = 'sources';
    sources.forEach(s => {
      const pill = document.createElement('span');
      pill.className = 'source-pill';
      pill.textContent = s;
      srcRow.appendChild(pill);
    });
    inner.appendChild(srcRow);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(inner);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}

// ── Typing indicator ──
function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.id = 'typing';
  wrap.innerHTML = `<div class="avatar">AI</div><div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div></div>`;
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}
function hideTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── Send message ──
async function sendMessage(text) {
  const q = text || chatInput.value.trim();
  if (!q) return;
  chatInput.value = '';
  chatInput.style.height = '44px';
  addMessage(q, 'user');
  showTyping();
  sendBtn.disabled = true;

  try {
    const res = await fetch(`${API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, course: courseSelect.value })
    });
    hideTyping();
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    addMessage(data.answer, 'bot', data.sources || []);
  } catch {
    hideTyping();
    addMessage('⚠️ Could not reach the backend. Make sure your FastAPI server is running:\n`uvicorn main:app --reload`', 'bot');
  }

  sendBtn.disabled = false;
}

// ── Enter to send ──
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Auto resize textarea ──
chatInput.addEventListener('input', function () {
  this.style.height = '44px';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ── Send button ──
sendBtn.addEventListener('click', () => sendMessage());