// utils/api.js
// API请求工具类

const app = getApp();

/**
 * 请求拦截器配置
 */
const requestConfig = {
  retryTimes: 0, // 当前重试次数
  maxRetries: 1, // 最大重试次数
  timeout: 30000 // 请求超时时间
};

/**
 * 统一的HTTP请求方法
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',
      data = {},
      needAuth = true,
      header = {},
      showLoading = false
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

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    // 发送请求
    const requestTask = wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout: requestConfig.timeout,
      success(res) {
        if (showLoading) wx.hideLoading();

        // 统一响应处理
        handleResponse(res, resolve, reject, url, options);
      },
      fail(err) {
        if (showLoading) wx.hideLoading();

        console.error('请求失败:', err);

        // 网络错误处理
        const errorMsg = getNetworkErrorMessage(err);
        reject(new Error(errorMsg));
      }
    });

    // 请求超时处理（仅作为备份，wx.request已有timeout）
    const timeoutId = setTimeout(() => {
      if (requestTask) {
        requestTask.abort();
        if (showLoading) wx.hideLoading();
        reject(new Error('请求超时，请检查网络'));
      }
    }, requestConfig.timeout + 1000);

    // 清理定时器
    const originalThen = requestTask.then;
    requestTask.then = function(...args) {
      clearTimeout(timeoutId);
      return originalThen.apply(this, args);
    };
  });
}

/**
 * 统一响应处理
 */
function handleResponse(res, resolve, reject, url, options) {
  const statusCode = res.statusCode;

  // 成功响应
  if (statusCode === 200) {
    if (res.data.success) {
      resolve(res.data.data);
    } else {
      reject(new Error(res.data.message || '请求失败'));
    }
    return;
  }

  // 未授权 - token过期
  if (statusCode === 401) {
    handleUnauthorized(url, options, resolve, reject);
    return;
  }

  // 其他错误
  const errorMsg = getHttpErrorMessage(statusCode, res.data);
  reject(new Error(errorMsg));
}

/**
 * 处理未授权错误
 */
function handleUnauthorized(url, options, resolve, reject) {
  // 避免刷新token接口死循环
  if (url.includes('/auth/refresh')) {
    app.clearLoginState();
    wx.reLaunch({ url: '/pages/login/login' });
    reject(new Error('登录已过期'));
    return;
  }

  // 尝试刷新token
  refreshToken()
    .then(() => request(url, options))
    .then(resolve)
    .catch(() => {
      app.clearLoginState();
      wx.reLaunch({ url: '/pages/login/login' });
      reject(new Error('登录已过期，请重新登录'));
    });
}

/**
 * 获取HTTP错误消息
 */
function getHttpErrorMessage(statusCode, data) {
  const errorMessages = {
    400: '请求参数错误',
    403: '没有权限',
    404: '请求的资源不存在',
    500: '服务器错误',
    502: '网关错误',
    503: '服务暂时不可用'
  };

  return data?.message || errorMessages[statusCode] || `请求失败(${statusCode})`;
}

/**
 * 获取网络错误消息
 */
function getNetworkErrorMessage(err) {
  if (err.errMsg) {
    if (err.errMsg.includes('timeout')) return '请求超时，请检查网络';
    if (err.errMsg.includes('fail')) return '网络连接失败，请检查网络';
  }
  return '网络请求失败，请检查网络连接';
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
