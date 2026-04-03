// pages/login/login.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');
const { validate } = require('../../utils/validator');

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

    // 使用验证器验证
    const result = validate.loginForm(phone, password);
    if (!result.valid) {
      util.showToast(result.error);
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
