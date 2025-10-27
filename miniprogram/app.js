// app.js
App({
  globalData: {
    // API基础地址 - 请根据实际部署修改
    apiBaseUrl: 'http://localhost:8000/api/v1',
    // 用户信息
    userInfo: null,
    // token信息
    accessToken: null,
    refreshToken: null,
    // 当前选中的陪伴角色
    currentCompanion: null
  },

  onLaunch() {
    // 小程序启动时执行
    console.log('永伴小程序启动');

    // 尝试从本地存储恢复登录状态
    this.restoreLoginState();
  },

  /**
   * 恢复登录状态
   */
  restoreLoginState() {
    try {
      const accessToken = wx.getStorageSync('access_token');
      const refreshToken = wx.getStorageSync('refresh_token');
      const userInfo = wx.getStorageSync('user_info');

      if (accessToken && userInfo) {
        this.globalData.accessToken = accessToken;
        this.globalData.refreshToken = refreshToken;
        this.globalData.userInfo = userInfo;
        console.log('登录状态已恢复');
      }
    } catch (e) {
      console.error('恢复登录状态失败:', e);
    }
  },

  /**
   * 保存登录状态
   */
  saveLoginState(tokens, userInfo) {
    try {
      wx.setStorageSync('access_token', tokens.access_token);
      wx.setStorageSync('refresh_token', tokens.refresh_token);
      wx.setStorageSync('user_info', userInfo);

      this.globalData.accessToken = tokens.access_token;
      this.globalData.refreshToken = tokens.refresh_token;
      this.globalData.userInfo = userInfo;
    } catch (e) {
      console.error('保存登录状态失败:', e);
    }
  },

  /**
   * 清除登录状态
   */
  clearLoginState() {
    try {
      wx.removeStorageSync('access_token');
      wx.removeStorageSync('refresh_token');
      wx.removeStorageSync('user_info');

      this.globalData.accessToken = null;
      this.globalData.refreshToken = null;
      this.globalData.userInfo = null;
      this.globalData.currentCompanion = null;
    } catch (e) {
      console.error('清除登录状态失败:', e);
    }
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return !!this.globalData.accessToken;
  }
});
