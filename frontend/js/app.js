// 永伴 - 前端应用逻辑

// API配置
// 自动检测：如果访问的是外网地址，则使用同源API；否则使用localhost
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : `${window.location.protocol}//${window.location.hostname}/api/v1`;

// 全局状态
let currentUser = null;
let accessToken = null;
let currentCompanion = null;
let currentConversation = null;

// ==================== 工具函数 ====================

// 显示提示信息
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// 显示/隐藏加载动画
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// 切换页面
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// API请求封装
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== 用户认证 ====================

// 显示登录页
function showLogin() {
    showPage('login-page');
    document.getElementById('login-phone').value = '';
    document.getElementById('login-password').value = '';
}

// 显示注册页
function showRegister() {
    showPage('register-page');
    document.getElementById('register-phone').value = '';
    document.getElementById('register-nickname').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-password2').value = '';
}

// 登录
async function login() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;

    if (!phone || !password) {
        showToast('请输入手机号和密码');
        return;
    }

    showLoading(true);

    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password })
        });

        if (response.success) {
            currentUser = response.data.user;
            accessToken = response.data.tokens.access_token;

            // 保存到本地存储
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(currentUser));

            showToast('登录成功！');
            loadCompanions();
        }
    } catch (error) {
        showToast('登录失败：' + error.message);
    } finally {
        showLoading(false);
    }
}

// 注册
async function register() {
    const phone = document.getElementById('register-phone').value.trim();
    const nickname = document.getElementById('register-nickname').value.trim();
    const password = document.getElementById('register-password').value;
    const password2 = document.getElementById('register-password2').value;

    // 验证
    if (!phone || phone.length !== 11) {
        showToast('请输入正确的手机号');
        return;
    }

    if (!nickname) {
        showToast('请输入昵称');
        return;
    }

    if (!password || password.length < 6) {
        showToast('密码至少6位');
        return;
    }

    if (password !== password2) {
        showToast('两次密码不一致');
        return;
    }

    showLoading(true);

    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone, nickname, password })
        });

        if (response.success) {
            currentUser = response.data.user;
            accessToken = response.data.tokens.access_token;

            // 保存到本地存储
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(currentUser));

            showToast('注册成功！');
            loadCompanions();
        }
    } catch (error) {
        showToast('注册失败：' + error.message);
    } finally {
        showLoading(false);
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        currentUser = null;
        accessToken = null;
        currentCompanion = null;
        currentConversation = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        showToast('已退出登录');
        showLogin();
    }
}

// ==================== 角色管理 ====================

// 显示角色列表
function showCompanions() {
    showPage('companions-page');
    loadCompanions();
}

// 加载角色列表
async function loadCompanions() {
    showPage('companions-page');
    showLoading(true);

    try {
        // 显示用户昵称
        document.getElementById('user-nickname').textContent = currentUser.nickname;

        // 获取角色列表
        const response = await apiRequest('/companions');

        const companionsList = document.getElementById('companions-list');
        companionsList.innerHTML = '';

        if (response.data && response.data.length > 0) {
            response.data.forEach(companion => {
                const card = createCompanionCard(companion);
                companionsList.appendChild(card);
            });
        } else {
            companionsList.innerHTML = `
                <div class="empty-state">
                    <p>您还没有创建陪伴角色</p>
                    <p>点击下方按钮创建一个吧！</p>
                </div>
            `;
        }
    } catch (error) {
        showToast('加载失败：' + error.message);
    } finally {
        showLoading(false);
    }
}

// 创建角色卡片
function createCompanionCard(companion) {
    const card = document.createElement('div');
    card.className = 'companion-card';
    card.onclick = () => startChat(companion);

    const relationshipMap = {
        'parent': '父母',
        'spouse': '配偶',
        'friend': '朋友',
        'child': '子女',
        'grandparent': '祖父母',
        'sibling': '兄弟姐妹',
        'other': '其他'
    };

    card.innerHTML = `
        <div class="companion-info">
            <h3>${companion.name}</h3>
            <p>${relationshipMap[companion.relationship] || companion.relationship}</p>
        </div>
        <div class="companion-badge">进入对话</div>
    `;

    return card;
}

// 显示创建角色页面
function showCreateCompanion() {
    showPage('create-companion-page');
    document.getElementById('companion-name').value = '';
    document.getElementById('companion-relationship').value = 'parent';
    document.getElementById('companion-gender').value = 'female';
    document.getElementById('companion-story').value = '';
}

// 创建角色
async function createCompanion() {
    const name = document.getElementById('companion-name').value.trim();
    const relationship = document.getElementById('companion-relationship').value;
    const gender = document.getElementById('companion-gender').value;
    const story = document.getElementById('companion-story').value.trim();

    if (!name) {
        showToast('请输入角色名称');
        return;
    }

    if (!story) {
        showToast('请描述一下角色背景');
        return;
    }

    showLoading(true);

    try {
        const response = await apiRequest('/companions', {
            method: 'POST',
            body: JSON.stringify({
                name,
                relationship,
                gender,
                background_story: story,
                personality: {
                    traits: ['caring', 'patient', 'warm'],
                    tone: 'gentle'
                }
            })
        });

        if (response.success) {
            showToast('创建成功！');
            loadCompanions();
        }
    } catch (error) {
        showToast('创建失败：' + error.message);
    } finally {
        showLoading(false);
    }
}

// ==================== 对话功能 ====================

// 开始对话
async function startChat(companion) {
    currentCompanion = companion;
    currentConversation = null;

    showPage('chat-page');
    document.getElementById('chat-companion-name').textContent = companion.name;
    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('chat-input').value = '';

    // 添加欢迎消息
    addMessage('assistant', `您好！我是${companion.name}，很高兴能陪您聊天。`);
}

// 发送消息
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) {
        showToast('请输入消息');
        return;
    }

    if (!currentCompanion) {
        showToast('请选择一个角色');
        return;
    }

    // 显示用户消息
    addMessage('user', message);
    input.value = '';

    // 显示输入中提示（带动画效果）
    const thinkingMsg = addMessage('assistant', '<span class="typing-indicator">正在输入<span class="dots">...</span></span>');
    // showLoading(true);  // 移除全屏加载遮罩，保留"正在思考..."提示即可

    try {
        const response = await apiRequest('/conversations/chat', {
            method: 'POST',
            body: JSON.stringify({
                companion_id: currentCompanion.id,
                message: message,
                conversation_id: currentConversation,
                include_voice: false
            })
        });

        if (response.success) {
            // 保存对话ID
            if (!currentConversation) {
                currentConversation = response.data.conversation_id;
            }

            // 移除"正在思考"消息
            thinkingMsg.remove();

            // 显示AI回复
            const aiMessage = response.data.assistant_message.content;
            addMessage('assistant', aiMessage);
        }
    } catch (error) {
        thinkingMsg.remove();
        showToast('发送失败：' + error.message);
    } finally {
        // showLoading(false);  // 移除全屏加载遮罩
    }
}

// 添加消息到聊天界面
function addMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const headerText = role === 'user' ? '我' : currentCompanion.name;

    messageDiv.innerHTML = `
        <div class="message-header">${headerText}</div>
        <div class="message-bubble">${content}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;
}

// 监听回车发送
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// ==================== 初始化 ====================

// 页面加载时检查登录状态
window.addEventListener('load', () => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
        accessToken = savedToken;
        currentUser = JSON.parse(savedUser);
        loadCompanions();
    } else {
        showLogin();
    }
});
