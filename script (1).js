/* =========================================
   THE QUILL — Blog Platform Script
   ========================================= */

const API = "http://localhost:5000";

let posts = [];
let activeFilter = 'all';

/* ── WORD COUNT ── */
function updateWordCount() {
  const text = document.getElementById('contentInput').value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = count + ' word' + (count !== 1 ? 's' : '');
}

/* ── ADD POST ── */
async function addPost() {
  const title = document.getElementById('titleInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();
  const tag = document.getElementById('tagInput').value.trim() || 'General';

  if (!title || !content) {
    shake(document.querySelector('.compose-card'));
    return;
  }

  const post = {
    id: Date.now(),
    title,
    content,
    tag,
    date: new Date().toISOString()
  };

  /* Try to save to backend; fall back to local if unavailable */
  try {
    await fetch(`${API}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    await loadPostsFromAPI();
  } catch (e) {
    posts.unshift(post);
    renderPosts();
    updateStats();
  }

  document.getElementById('titleInput').value = '';
  document.getElementById('contentInput').value = '';
  document.getElementById('tagInput').value = '';
  document.getElementById('wordCount').textContent = '0 words';
  showToast('Story published');
}

/* ── LOAD FROM API ── */
async function loadPostsFromAPI() {
  try {
    const response = await fetch(`${API}/posts`);
    const data = await response.json();
    posts = data.map(p => ({
      ...p,
      date: p.date || new Date().toISOString()
    }));
    renderPosts();
    updateStats();
  } catch (e) {
    /* Backend not running — use local array */
    renderPosts();
    updateStats();
  }
}

/* ── DELETE POST ── */
async function deletePost(id) {
  try {
    await fetch(`${API}/posts/${id}`, { method: "DELETE" });
    await loadPostsFromAPI();
  } catch (e) {
    posts = posts.filter(p => p.id !== id);
    renderPosts();
    updateStats();
  }
}

/* ── FILTER ── */
function filterTag(btn, tag) {
  document.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = tag;
  renderPosts();
}

/* ── FORMAT DATE ── */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── WORD COUNT HELPER ── */
function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/* ── RENDER POSTS ── */
function renderPosts() {
  const container = document.getElementById('posts');
  const label = document.getElementById('postsLabel');
  const filtered = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.tag.toLowerCase() === activeFilter.toLowerCase());

  if (filtered.length === 0) {
    label.textContent = posts.length ? 'No stories in this category' : 'Latest Stories';
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-big">"</span>
        <p>No stories yet. Your first post awaits.</p>
      </div>
    `;
    return;
  }

  const catName = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
  label.textContent = activeFilter === 'all'
    ? 'Latest Stories'
    : `${filtered.length} stor${filtered.length !== 1 ? 'ies' : 'y'} in ${catName}`;

  container.innerHTML = filtered.map((p, i) => `
    <div class="post-card" style="animation-delay:${i * 0.06}s">
      <div class="post-meta">
        <span class="post-date">${formatDate(p.date)}</span>
        <span class="post-tag">${p.tag}</span>
      </div>
      <div class="post-title">${escapeHTML(p.title)}</div>
      <div class="post-excerpt">${escapeHTML(p.content.length > 180 ? p.content.slice(0, 180) + '…' : p.content)}</div>
      <div class="post-actions">
        <span class="read-link">Read story</span>
        <button class="del-btn" onclick="deletePost(${p.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

/* ── UPDATE STATS ── */
function updateStats() {
  const total = posts.length;
  const totalWords = posts.reduce((s, p) => s + countWords(p.content), 0);
  document.getElementById('statCount').textContent = total;
  document.getElementById('statWords').textContent = totalWords.toLocaleString();
  document.getElementById('statAvg').textContent = total ? Math.round(totalWords / total) + ' words' : '—';
}

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '✓ ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── SHAKE ANIMATION ── */
function shake(el) {
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => el.style.animation = '', { once: true });
}

/* ── XSS PROTECTION ── */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ── INIT ── */
loadPostsFromAPI();
