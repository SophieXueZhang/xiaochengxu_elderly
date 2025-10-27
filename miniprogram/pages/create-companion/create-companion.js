// pages/create-companion/create-companion.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    name: '',
    relationshipIndex: 0,
    relationshipOptions: [
      { value: 'parent', label: '父母' },
      { value: 'spouse', label: '配偶' },
      { value: 'friend', label: '朋友' },
      { value: 'child', label: '子女' },
      { value: 'grandparent', label: '祖父母' },
      { value: 'sibling', label: '兄弟姐妹' },
      { value: 'other', label: '其他' }
    ],
    genderIndex: 0,
    genderOptions: [
      { value: 'female', label: '女性' },
      { value: 'male', label: '男性' },
      { value: 'other', label: '其他' }
    ],
    backgroundStory: '',
    loading: false
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  },

  /**
   * 名称输入
   */
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  /**
   * 关系选择
   */
  onRelationshipChange(e) {
    this.setData({
      relationshipIndex: parseInt(e.detail.value)
    });
  },

  /**
   * 性别选择
   */
  onGenderChange(e) {
    this.setData({
      genderIndex: parseInt(e.detail.value)
    });
  },

  /**
   * 背景故事输入
   */
  onStoryInput(e) {
    this.setData({
      backgroundStory: e.detail.value
    });
  },

  /**
   * 创建角色
   */
  handleCreate() {
    const { name, relationshipIndex, relationshipOptions, genderIndex, genderOptions, backgroundStory } = this.data;

    // 验证输入
    if (!name) {
      util.showToast('请输入角色名称');
      return;
    }

    if (name.length < 2) {
      util.showToast('角色名称至少2个字符');
      return;
    }

    if (!backgroundStory) {
      util.showToast('请输入角色背景');
      return;
    }

    if (backgroundStory.length < 10) {
      util.showToast('角色背景至少10个字符');
      return;
    }

    // 获取选中的值
    const relationship = relationshipOptions[relationshipIndex].value;
    const gender = genderOptions[genderIndex].value;

    // 开始创建
    this.setData({ loading: true });
    util.showLoading('创建中...');

    const companionData = {
      name,
      relationship,
      gender,
      background_story: backgroundStory,
      personality: {
        traits: ['caring', 'patient', 'warm'],
        tone: 'gentle'
      }
    };

    API.createCompanion(companionData)
      .then(companion => {
        util.hideLoading();
        util.showSuccess('创建成功');

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('创建角色失败:', err);
        util.hideLoading();
        util.showError(err.message || '创建失败');
        this.setData({ loading: false });
      });
  }
});
