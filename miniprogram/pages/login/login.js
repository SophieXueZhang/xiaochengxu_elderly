// pages/login/login.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  onLoad(options) {
    // 如果已经登录，跳转到角色列表页
    if (app.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/companions/companions'
      });
    }
  },

  /**
   * 手机号输入
   */
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 登录
   */
  handleLogin() {
    const { phone, password } = this.data;

    // 验证输入
    if (!phone) {
      util.showToast('请输入手机号');
      return;
    }

    if (!util.validatePhone(phone)) {
      util.showToast('手机号格式不正确');
      return;
    }

    if (!password) {
      util.showToast('请输入密码');
      return;
    }

    if (!util.validatePassword(password)) {
      util.showToast('密码至少6位');
      return;
    }

    // 开始登录
    this.setData({ loading: true });
    util.showLoading('登录中...');

    API.login(phone, password)
      .then(data => {
        // 保存登录状态
        app.saveLoginState(data.tokens, data.user);

        util.hideLoading();
        util.showSuccess('登录成功');

        // 跳转到角色列表页
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/companions/companions'
          });
        }, 1500);
      })
      .catch(err => {
        console.error('登录失败:', err);
        util.hideLoading();
        util.showError(err.message || '登录失败');
        this.setData({ loading: false });
      });
  },

  /**
   * 跳转到注册页
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
});
