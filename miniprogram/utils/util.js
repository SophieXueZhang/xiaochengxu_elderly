// utils/util.js
// 通用工具函数

/**
 * 显示Toast提示
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示成功提示
 */
function showSuccess(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  });
}

/**
 * 显示错误提示
 */
function showError(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration
  });
}

/**
 * 显示加载中
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载中
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示确认对话框
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      confirmText: '确定',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          resolve();
        } else {
          reject();
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 格式化时间
 */
function formatTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
}

/**
 * 格式化日期
 */
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${padZero(month)}-${padZero(day)}`;
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(date);
  }
}

/**
 * 补零
 */
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

/**
 * 验证手机号
 */
function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

/**
 * 验证密码（至少6位）
 */
function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * 节流函数 - 优化版
 */
function throttle(fn, delay = 500) {
  let timer = null;
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastTime < delay) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        lastTime = now;
        fn.apply(this, args);
      }, delay - (now - lastTime));
      return;
    }

    lastTime = now;
    fn.apply(this, args);
  };
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 500) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloneObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key]);
    }
  }
  return cloneObj;
}

/**
 * 获取关系类型文本
 */
function getRelationshipText(relationship) {
  const map = {
    'parent': '父母',
    'spouse': '配偶',
    'friend': '朋友',
    'child': '子女',
    'grandparent': '祖父母',
    'sibling': '兄弟姐妹',
    'other': '其他'
  };
  return map[relationship] || relationship;
}

/**
 * 获取性别文本
 */
function getGenderText(gender) {
  const map = {
    'male': '男性',
    'female': '女性',
    'other': '其他'
  };
  return map[gender] || gender;
}

module.exports = {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm,
  formatTime,
  formatDate,
  formatRelativeTime,
  validatePhone,
  validatePassword,
  throttle,
  debounce,
  deepClone,
  getRelationshipText,
  getGenderText
};
