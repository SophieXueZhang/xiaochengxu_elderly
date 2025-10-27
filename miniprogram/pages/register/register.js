// pages/register/register.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    phone: '',
    nickname: '',
    password: '',
    password2: '',
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
   * 昵称输入
   */
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
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
   * 确认密码输入
   */
  onPassword2Input(e) {
    this.setData({
      password2: e.detail.value
    });
  },

  /**
   * 注册
   */
  handleRegister() {
    const { phone, nickname, password, password2 } = this.data;

    // 验证输入
    if (!phone) {
      util.showToast('请输入手机号');
      return;
    }

    if (!util.validatePhone(phone)) {
      util.showToast('手机号格式不正确');
      return;
    }

    if (!nickname) {
      util.showToast('请输入昵称');
      return;
    }

    if (nickname.length < 2) {
      util.showToast('昵称至少2个字符');
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

    if (password !== password2) {
      util.showToast('两次密码输入不一致');
      return;
    }

    // 开始注册
    this.setData({ loading: true });
    util.showLoading('注册中...');

    API.register(phone, password, nickname)
      .then(data => {
        // 保存登录状态
        app.saveLoginState(data.tokens, data.user);

        util.hideLoading();
        util.showSuccess('注册成功');

        // 跳转到角色列表页
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/companions/companions'
          });
        }, 1500);
      })
      .catch(err => {
        console.error('注册失败:', err);
        util.hideLoading();
        util.showError(err.message || '注册失败');
        this.setData({ loading: false });
      });
  },

  /**
   * 返回登录页
   */
  goToLogin() {
    wx.navigateBack();
  }
});
