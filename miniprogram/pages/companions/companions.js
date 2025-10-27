// pages/companions/companions.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    nickname: '',
    companions: [],
    loading: true
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 设置用户昵称
    if (app.globalData.userInfo) {
      this.setData({
        nickname: app.globalData.userInfo.nickname || '朋友'
      });
    }
  },

  onShow() {
    // 每次显示时刷新列表
    this.loadCompanions();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCompanions().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载陪伴角色列表
   */
  loadCompanions() {
    this.setData({ loading: true });

    return API.getCompanions()
      .then(companions => {
        // 处理数据，添加显示文本
        const processedCompanions = companions.map(companion => ({
          ...companion,
          relationshipText: util.getRelationshipText(companion.relationship),
          genderText: util.getGenderText(companion.gender)
        }));

        this.setData({
          companions: processedCompanions,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载角色列表失败:', err);
        util.showError(err.message || '加载失败');
        this.setData({ loading: false });
      });
  },

  /**
   * 跳转到聊天页
   */
  goToChat(e) {
    const companion = e.currentTarget.dataset.companion;

    // 保存当前选中的角色
    app.globalData.currentCompanion = companion;

    // 跳转到聊天页
    wx.navigateTo({
      url: `/pages/chat/chat?companionId=${companion.id}&companionName=${companion.name}`
    });
  },

  /**
   * 跳转到创建角色页
   */
  goToCreate() {
    wx.navigateTo({
      url: '/pages/create-companion/create-companion'
    });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    util.showConfirm('确定要退出登录吗？', '提示')
      .then(() => {
        // 清除登录状态
        app.clearLoginState();

        // 跳转到登录页
        wx.reLaunch({
          url: '/pages/login/login'
        });
      })
      .catch(() => {
        // 用户取消
      });
  }
});
