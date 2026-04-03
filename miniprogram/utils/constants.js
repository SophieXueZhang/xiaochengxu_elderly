// utils/constants.js
// 全局常量配置

/**
 * API配置
 */
export const API_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 1
};

/**
 * 消息配置
 */
export const MESSAGE_CONFIG = {
  MAX_LENGTH: 500,
  PAGE_SIZE: 20
};

/**
 * 验证规则
 */
export const VALIDATION = {
  PHONE_PATTERN: /^1[3-9]\d{9}$/,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 20,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 20
};

/**
 * Toast持续时间
 */
export const TOAST_DURATION = {
  SHORT: 1500,
  NORMAL: 2000,
  LONG: 3000
};

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TIMEOUT_ERROR: '请求超时，请重试',
  AUTH_ERROR: '登录已过期，请重新登录',
  UNKNOWN_ERROR: '操作失败，请重试'
};

/**
 * 页面路径
 */
export const PAGES = {
  LOGIN: '/pages/login/login',
  REGISTER: '/pages/register/register',
  COMPANIONS: '/pages/companions/companions',
  CREATE_COMPANION: '/pages/create-companion/create-companion',
  CHAT: '/pages/chat/chat'
};
