// Mock Data Store
const DB_KEY = 'polester_db_v1';
let db = {
    submissions: [
        { id: 1, submitter: "使用者 A", description: "春季大促銷，服裝折扣高達50%！", time: "2024-05-15 to 2024-05-22", poles: 10, status: "pending", imageUrl: "/mock_ad_1.png" },
        { id: 2, submitter: "使用者 B", description: "新鮮水果直送到家，品質保證。", time: "2024-06-01 to 2024-06-30", poles: 5, status: "approved", imageUrl: "/mock_ad_2.png" },
    ],
    // currentDisplayId stores the submission id that should be shown on 廣告呈現頁, null means none selected
    currentDisplayId: null
};

// Load DB from localStorage if exists
function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                db = parsed;
            }
        }
    } catch (e) {
        console.warn('無法載入本地 DB，使用預設資料。', e);
    }
}

// Save DB to localStorage
function saveDB() {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.warn('無法儲存 DB。', e);
    }
}

// Initialize by loading DB
loadDB();

let currentView = 'placement';
const appContainer = document.getElementById('app-container');

// --- Utility Functions ---

/**
 * Renders the Ad Placement View
 */
function renderPlacementView() {
    appContainer.innerHTML = `
        <h2>廣告投放頁</h2>
        <form id="placement-form">
            <div class="form-group">
                <label for="image-input">上傳圖片 (可選):</label>
                <input type="file" id="image-input" accept="image/*">
            </div>
            <p style="text-align: center;">--- OR ---</p>
            <div class="form-group">
                <label for="prompt-input">AI 產圖 Prompt (可選):</label>
                <input type="text" id="prompt-input" placeholder="輸入描述，例如：一隻可愛的貓在草地上玩耍">
                <button type="button" id="generate-image-btn">AI 智能產圖</button>
            </div>
            
            <div class="ad-preview">
                <img id="ad-image-preview" src="" alt="廣告圖片預覽" style="display:none;">
                <p id="preview-placeholder">圖片/AI產圖將顯示在此處</p>
            </div>

            <div class="form-group">
                <label for="description">廣告敘述:</label>
                <textarea id="description" required rows="4"></textarea>
            </div>

            <div class="form-group">
                <label>投放時段:</label>
                <div style="display:flex;gap:8px;">
                    <select id="time-start" required></select>
                    <select id="time-end" required></select>
                </div>
                <small>請選擇開始與結束時間（以半小時為單位）</small>
            </div>

            <div class="form-group">
                <label for="pole-count">投放桿數量:</label>
                <input type="number" id="pole-count" min="1" value="1" required>
            </div>

            <button type="submit">提交投放申請</button>
            <p id="submission-message" style="margin-top: 10px; color: var(--primary-color); display: none;"></p>
        </form>
    `;

    setupPlacementListeners();
}

/* 新增：產生半小時選項（從今天起的 7 天內）並插入到 select 中 */
function generateHalfHourOptions(days = 7) {
    const options = [];
    const now = new Date();
    // 從今天 00:00 開始
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const totalSlots = days * 24 * 2; // 半小時為一格
    for (let i = 0; i < totalSlots; i++) {
        const slot = new Date(start.getTime() + i * 30 * 60 * 1000);
        // 使用 ISO 格式但去掉秒與毫秒，方便比較
        const iso = slot.toISOString().slice(0,16);
        // 顯示文字：YYYY-MM-DD HH:mm
        const label = iso.replace('T', ' ');
        options.push({ value: iso, label });
    }
    return options;
}

function setupPlacementListeners() {
    const form = document.getElementById('placement-form');
    const imageInput = document.getElementById('image-input');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-image-btn');
    const previewImg = document.getElementById('ad-image-preview');
    const previewPlaceholder = document.getElementById('preview-placeholder');
    const submissionMessage = document.getElementById('submission-message');

    // 填入半小時選項到 select
    const startSelect = document.getElementById('time-start');
    const endSelect = document.getElementById('time-end');
    const timeOptions = generateHalfHourOptions(7);
    startSelect.innerHTML = timeOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    endSelect.innerHTML = timeOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    // 預設選擇現在最近未來的半小時格（若超過最後一個則選最後）
    const nowIso = new Date();
    const rounded = new Date(Math.ceil(nowIso.getTime() / (30*60*1000)) * (30*60*1000));
    const roundedIso = rounded.toISOString().slice(0,16);
    const startIndex = timeOptions.findIndex(o => o.value >= roundedIso);
    if (startIndex !== -1) {
        startSelect.selectedIndex = startIndex;
        // 預設結束時間為開始後一格（半小時）
        endSelect.selectedIndex = Math.min(startIndex + 1, timeOptions.length - 1);
    }

    // 1. Image Upload Preview
    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(r) {
                previewImg.src = r.target.result;
                previewImg.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(e.target.files[0]);
            promptInput.value = ''; // Clear prompt input if file is uploaded
        }
    });

    // 2. Simulate AI Generation
    generateBtn.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        if (prompt) {
            // Disable button 並顯示生成中狀態與 spinner
            generateBtn.disabled = true;
            const originalText = generateBtn.textContent;
            generateBtn.textContent = '生成中...';
            previewPlaceholder.innerHTML = '<span class="preview-spinner"></span>AI 正在生成中，請稍候...';
            previewPlaceholder.style.display = 'block';
            previewImg.style.display = 'none';
            imageInput.value = ''; // Clear file input if AI is used

            // 等待 3 秒 模擬生成，然後顯示指定遠端圖片
            setTimeout(() => {
                previewImg.src = 'https://media.discordapp.net/attachments/1211936801778958424/1437766392651972740/ad.png?ex=69146fcc&is=69131e4c&hm=bcb84d74eb719d8dffd99eee5bdb2b4bc9c06300ed0dbc418ea1fe44d3fba17a&=&format=webp&quality=lossless&width=982&height=1746';
                previewImg.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                // 恢復按鈕
                generateBtn.disabled = false;
                generateBtn.textContent = originalText;
                // alert(`AI 已生成圖片，並已顯示在預覽區。`);
            }, 3000);
        } else {
            alert('請輸入 AI 產圖描述。');
        }
    });

    // 3. Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const description = document.getElementById('description').value;
        const timeStart = document.getElementById('time-start').value;
        const timeEnd = document.getElementById('time-end').value;
        const poleCount = parseInt(document.getElementById('pole-count').value);
        
        if (!timeStart || !timeEnd) {
            alert('請選擇開始與結束時間。');
            return;
        }
        if (new Date(timeStart) >= new Date(timeEnd)) {
            alert('結束時間必須晚於開始時間。');
            return;
        }
        
        const imageUrl = previewImg.style.display === 'block' ? previewImg.src : null;

        if (!imageUrl) {
            alert('請上傳圖片或使用 AI 產圖。');
            return;
        }

        const newSubmission = {
            id: db.submissions.length > 0 ? Math.max(...db.submissions.map(s => s.id)) + 1 : 1,
            submitter: "當前使用者 (模擬)",
            description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
            time: `${timeStart} to ${timeEnd}`,
            poles: poleCount,
            status: "pending",
            imageUrl: imageUrl
        };

        db.submissions.push(newSubmission);
        saveDB();
        
        // Reset UI
        form.reset();
        previewImg.style.display = 'none';
        previewImg.src = '';
        previewPlaceholder.style.display = 'block';

        submissionMessage.textContent = '投放申請已成功提交，等待後台審核。';
        submissionMessage.style.display = 'block';
        setTimeout(() => submissionMessage.style.display = 'none', 5000);
    });
}

/**
 * Renders the Admin View (updated to allow setting current display)
 */
function renderAdminView() {
    // Sort submissions to show pending items first
    const sortedSubmissions = [...db.submissions].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return a.id - b.id;
    });

    const rows = sortedSubmissions.map(sub => `
        <tr>
            <td>${sub.id}</td>
            <td>${sub.submitter}</td>
            <td>${sub.description}</td>
            <td>${sub.time}</td>
            <td>${sub.poles}</td>
            <td id="status-${sub.id}" class="status-${sub.status}">
                ${sub.status === 'approved' ? '✅ 已通過' : '⏳ 待審核'}
            </td>
            <td>
                <button class="action-button approve-btn" data-id="${sub.id}" ${sub.status === 'approved' ? 'disabled' : ''}>
                    ${sub.status === 'approved' ? '已通過' : '批准'}
                </button>
                <button class="action-button delete-btn" data-id="${sub.id}" style="margin-left:8px; background:#c0392b;">移除</button>
                <button class="action-button set-display-btn" data-id="${sub.id}" style="margin-left:8px; background:#2c3e50; color:#fff;">
                    ${db.currentDisplayId === sub.id ? '目前展示中' : '設為展示'}
                </button>
            </td>
        </tr>
    `).join('');

    appContainer.innerHTML = `
        <h2>後台審核頁</h2>
        ${db.submissions.length === 0 ? '<p>暫無投稿記錄。</p>' : `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>投稿人</th>
                        <th>敘述摘錄</th>
                        <th>投放時段</th>
                        <th>數量 (桿)</th>
                        <th>審核狀態</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `}
    `;

    setupAdminListeners();
}

function setupAdminListeners() {
    document.querySelectorAll('.approve-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const submission = db.submissions.find(s => s.id === id);
            
            if (submission && submission.status !== 'approved') {
                submission.status = 'approved';
                saveDB();
                
                // Update button text and status column immediately
                e.target.textContent = '已通過';
                e.target.disabled = true;

                const statusCell = document.getElementById(`status-${id}`);
                statusCell.innerHTML = '✅ 已通過';
                statusCell.className = 'status-approved';
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const idx = db.submissions.findIndex(s => s.id === id);
            if (idx !== -1) {
                if (!confirm(`確定要移除 ID ${id} 的投稿嗎？此操作無法復原。`)) return;
                db.submissions.splice(idx, 1);
                // If deleted item was current display, clear selection
                if (db.currentDisplayId === id) db.currentDisplayId = null;
                saveDB();
                renderAdminView();
            }
        });
    });

    // 設為展示按鈕
    document.querySelectorAll('.set-display-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (db.currentDisplayId === id) {
                // 如果已經是展示中，則取消
                db.currentDisplayId = null;
            } else {
                db.currentDisplayId = id;
            }
            saveDB();
            renderAdminView();
        });
    });
}

/**
 * Renders the 廣告呈現頁 (顯示目前被選為展示的廣告)
 */
function renderDisplayView() {
    const current = db.submissions.find(s => s.id === db.currentDisplayId) || null;
    appContainer.innerHTML = `
        <h2>廣告呈現頁</h2>
        <div class="ad-preview" style="min-height:240px;">
            ${ current ? `
                <img src="${current.imageUrl}" alt="展示廣告" style="max-height:360px; max-width:100%; border-radius:6px;">
                <p style="margin-top:8px;">ID ${current.id} · ${current.description}</p>
            ` : `
                <p>目前沒有指定的展示廣告，請至後台選擇一張圖片作為展示。</p>
            `}
        </div>
    `;
}

/**
 * Navigation Logic
 */
function switchView(viewName) {
    currentView = viewName;
    if (viewName === 'placement') {
        renderPlacementView();
    } else if (viewName === 'admin') {
        renderAdminView();
    } else if (viewName === 'display') {
        renderDisplayView();
    }
}

function initNavigation() {
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const menu = document.getElementById('menu-items');
    const navLinks = document.querySelectorAll('.nav-menu a');

    hamburgerBtn.addEventListener('click', () => {
        const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true' || false;
        hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle 'visible' class for CSS transition effect
        menu.classList.toggle('visible');
        
        // Also manage 'hidden' class for initial state/mobile toggle cleanup
        if (menu.classList.contains('visible')) {
             menu.classList.remove('hidden');
        } else if (window.innerWidth < 768) {
             menu.classList.add('hidden');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            switchView(view);
            
            // Hide menu after selection on mobile
            if (window.innerWidth < 768) {
                menu.classList.remove('visible');
                menu.classList.add('hidden');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    // Default view
    switchView(currentView);
});