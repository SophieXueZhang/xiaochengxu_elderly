// utils/api.js
// API请求工具类

const app = getApp();

/**
 * 统一的HTTP请求方法
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',
      data = {},
      needAuth = true,
      header = {}
    } = options;

    // 构建完整URL
    const fullUrl = `${app.globalData.apiBaseUrl}${url}`;

    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };

    // 如果需要认证，添加token
    if (needAuth && app.globalData.accessToken) {
      requestHeader['Authorization'] = `Bearer ${app.globalData.accessToken}`;
    }

    // 发送请求
    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      success(res) {
        // 处理响应
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        } else if (res.statusCode === 401) {
          // token过期，尝试刷新
          refreshToken().then(() => {
            // 重新发起请求
            request(url, options).then(resolve).catch(reject);
          }).catch(() => {
            // 刷新失败，跳转到登录页
            app.clearLoginState();
            wx.reLaunch({
              url: '/pages/login/login'
            });
            reject(new Error('登录已过期，请重新登录'));
          });
        } else {
          reject(new Error(res.data.message || `请求失败(${res.statusCode})`));
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        reject(new Error('网络请求失败，请检查网络连接'));
      }
    });
  });
}

/**
 * 刷新token
 */
function refreshToken() {
  return new Promise((resolve, reject) => {
    if (!app.globalData.refreshToken) {
      reject(new Error('没有refresh token'));
      return;
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/auth/refresh`,
      method: 'POST',
      data: {
        refresh_token: app.globalData.refreshToken
      },
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200 && res.data.success) {
          const tokens = res.data.data;
          app.globalData.accessToken = tokens.access_token;
          app.globalData.refreshToken = tokens.refresh_token;

          // 更新本地存储
          wx.setStorageSync('access_token', tokens.access_token);
          wx.setStorageSync('refresh_token', tokens.refresh_token);

          resolve();
        } else {
          reject(new Error('刷新token失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * API接口定义
 */
const API = {
  // ========== 认证相关 ==========

  /**
   * 用户登录
   */
  login(phone, password) {
    return request('/auth/login', {
      method: 'POST',
      data: { phone, password },
      needAuth: false
    });
  },

  /**
   * 用户注册
   */
  register(phone, password, nickname) {
    return request('/auth/register', {
      method: 'POST',
      data: { phone, password, nickname },
      needAuth: false
    });
  },

  /**
   * 退出登录
   */
  logout() {
    return request('/auth/logout', {
      method: 'POST'
    });
  },

  // ========== 用户相关 ==========

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return request('/users/me', {
      method: 'GET'
    });
  },

  /**
   * 更新用户信息
   */
  updateUser(data) {
    return request('/users/me', {
      method: 'PUT',
      data
    });
  },

  // ========== 陪伴角色相关 ==========

  /**
   * 获取陪伴角色列表
   */
  getCompanions() {
    return request('/companions', {
      method: 'GET'
    });
  },

  /**
   * 获取单个陪伴角色详情
   */
  getCompanion(id) {
    return request(`/companions/${id}`, {
      method: 'GET'
    });
  },

  /**
   * 创建陪伴角色
   */
  createCompanion(data) {
    return request('/companions', {
      method: 'POST',
      data
    });
  },

  /**
   * 更新陪伴角色
   */
  updateCompanion(id, data) {
    return request(`/companions/${id}`, {
      method: 'PUT',
      data
    });
  },

  /**
   * 删除陪伴角色
   */
  deleteCompanion(id) {
    return request(`/companions/${id}`, {
      method: 'DELETE'
    });
  },

  // ========== 对话相关 ==========

  /**
   * 发送消息
   */
  sendMessage(message, companionId, includeVoice = false) {
    return request('/conversations/chat', {
      method: 'POST',
      data: {
        message,
        companion_id: companionId,
        include_voice: includeVoice
      }
    });
  },

  /**
   * 获取对话历史
   */
  getConversation(conversationId) {
    return request(`/conversations/${conversationId}`, {
      method: 'GET'
    });
  },

  /**
   * 获取对话列表
   */
  getConversations(companionId, page = 1, pageSize = 20) {
    return request('/conversations', {
      method: 'GET',
      data: {
        companion_id: companionId,
        page,
        page_size: pageSize
      }
    });
  },

  /**
   * 删除对话
   */
  deleteConversation(conversationId) {
    return request(`/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },

  // ========== 记忆相关 ==========

  /**
   * 获取记忆列表
   */
  getMemories(companionId) {
    return request('/memories', {
      method: 'GET',
      data: { companion_id: companionId }
    });
  },

  // ========== 关怀计划相关 ==========

  /**
   * 获取关怀计划
   */
  getCareSchedules(companionId) {
    return request('/care-schedules', {
      method: 'GET',
      data: { companion_id: companionId }
    });
  }
};

module.exports = API;
