// pages/chat/chat.js
const app = getApp();
const API = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    companionId: null,
    companionName: '',
    conversationId: null,
    messages: [],
    inputText: '',
    sending: false,
    thinking: false,
    scrollToView: '',
    hasMoreHistory: false
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    // 获取角色信息
    const { companionId, companionName } = options;

    if (!companionId) {
      util.showError('参数错误');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      companionId: parseInt(companionId),
      companionName: companionName || '陪伴'
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: companionName || '聊天'
    });

    // 加载历史消息
    this.loadRecentMessages();
  },

  /**
   * 加载最近的消息
   */
  loadRecentMessages() {
    const { companionId } = this.data;

    API.getConversations(companionId, 1, 1)
      .then(result => {
        if (result.items && result.items.length > 0) {
          const conversation = result.items[0];
          this.setData({
            conversationId: conversation.id
          });

          // 加载对话详情
          return API.getConversation(conversation.id);
        } else {
          // 没有历史对话
          return { messages: [] };
        }
      })
      .then(conversation => {
        if (conversation.messages && conversation.messages.length > 0) {
          const messages = conversation.messages.map(msg => ({
            ...msg,
            timeText: util.formatRelativeTime(msg.created_at)
          }));

          this.setData({
            messages,
            hasMoreHistory: messages.length >= 20
          });

          // 滚动到底部
          this.scrollToBottom();
        }
      })
      .catch(err => {
        console.error('加载消息失败:', err);
        // 不显示错误，允许开始新对话
      });
  },

  /**
   * 加载历史消息
   */
  loadHistory() {
    util.showToast('功能开发中');
  },

  /**
   * 输入框内容变化
   */
  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  /**
   * 发送消息（带防抖）
   */
  sendMessage: util.throttle(function() {
    const { inputText, companionId, sending } = this.data;

    // 验证输入
    if (!inputText || !inputText.trim()) {
      util.showToast('请输入消息内容');
      return;
    }

    if (sending) {
      return;
    }

    const messageContent = inputText.trim();

    // 限制消息长度
    if (messageContent.length > 500) {
      util.showToast('消息内容不能超过500字');
      return;
    }

    // 清空输入框并标记发送状态
    this.setData({
      inputText: '',
      sending: true
    });

    // 创建临时用户消息
    const userMessage = this.createTempMessage('user', messageContent);

    // 添加到界面
    this.addMessage(userMessage);
    this.setData({ thinking: true });
    this.scrollToBottom();

    // 发送到服务器
    API.sendMessage(messageContent, companionId, false)
      .then(data => this.handleSendSuccess(data, userMessage))
      .catch(err => this.handleSendError(err, userMessage));
  }, 1000),

  /**
   * 创建临时消息
   */
  createTempMessage(role, content) {
    return {
      id: `temp-${role}-${Date.now()}`,
      role,
      content,
      created_at: new Date().toISOString(),
      timeText: '刚刚'
    };
  },

  /**
   * 添加消息到列表
   */
  addMessage(message) {
    this.setData({
      messages: [...this.data.messages, message]
    });
  },

  /**
   * 处理发送成功
   */
  handleSendSuccess(data, tempMessage) {
    // 更新对话ID
    if (data.conversation_id) {
      this.setData({ conversationId: data.conversation_id });
    }

    // 移除临时消息
    const messages = this.data.messages.filter(m => m.id !== tempMessage.id);

    // 添加真实消息
    const realUserMessage = { ...data.user_message, timeText: '刚刚' };
    const assistantMessage = { ...data.assistant_message, timeText: '刚刚' };

    this.setData({
      messages: [...messages, realUserMessage, assistantMessage],
      thinking: false,
      sending: false
    });

    this.scrollToBottom();
  },

  /**
   * 处理发送失败
   */
  handleSendError(err, tempMessage) {
    console.error('发送消息失败:', err);

    // 移除临时消息
    const messages = this.data.messages.filter(m => m.id !== tempMessage.id);

    this.setData({
      messages,
      thinking: false,
      sending: false,
      inputText: tempMessage.content // 恢复输入内容
    });

    util.showError(err.message || '发送失败，请重试');
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    const messages = this.data.messages;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      this.setData({
        scrollToView: `msg-${lastMessage.id}`
      });
    }
  },

  /**
   * 选择视频
   */
  chooseVideo() {
    const that = this;

    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success(res) {
        const media = res.tempFiles[0];
        const { tempFilePath, size, duration } = media;

        // 检查视频大小（50MB限制）
        if (size > 50 * 1024 * 1024) {
          util.showToast('视频大小不能超过50MB');
          return;
        }

        // 检查时长（60秒限制）
        if (duration > 60) {
          util.showToast('视频时长不能超过60秒');
          return;
        }

        // 显示预览确认
        that.showVideoPreview(tempFilePath, duration, size);
      },
      fail(err) {
        console.error('选择视频失败:', err);
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          util.showToast('选择视频失败');
        }
      }
    });
  },

  /**
   * 显示视频预览
   */
  showVideoPreview(filePath, duration, size) {
    const durationText = `${Math.floor(duration)}秒`;
    const sizeText = `${(size / (1024 * 1024)).toFixed(1)}MB`;

    wx.showModal({
      title: '确认发送视频？',
      content: `时长：${durationText}\n大小：${sizeText}`,
      confirmText: '发送',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 询问是否添加文字说明
          this.askForCaption(filePath);
        }
      }
    });
  },

  /**
   * 询问视频说明
   */
  askForCaption(filePath) {
    const that = this;

    wx.showModal({
      title: '添加说明',
      content: '要为这个视频添加文字说明吗？',
      confirmText: '添加',
      cancelText: '直接发送',
      success(res) {
        if (res.confirm) {
          // 弹出输入框
          that.showCaptionInput(filePath);
        } else {
          // 直接发送
          that.uploadAndSendVideo(filePath, '');
        }
      }
    });
  },

  /**
   * 显示说明输入框
   */
  showCaptionInput(filePath) {
    const that = this;

    // 使用自定义模态框或直接上传
    // 这里简化处理，使用输入文本后发送
    wx.showModal({
      title: '视频说明',
      editable: true,
      placeholderText: '例如：今天跳舞的视频',
      success(res) {
        if (res.confirm) {
          const caption = res.content || '';
          that.uploadAndSendVideo(filePath, caption);
        }
      }
    });
  },

  /**
   * 上传并发送视频
   */
  uploadAndSendVideo(filePath, caption) {
    const { companionId } = this.data;

    util.showLoading('上传中...');

    // 上传视频
    API.uploadVideo(filePath, companionId)
      .then(videoData => {
        // 发送视频消息
        return API.sendVideoMessage(companionId, videoData.media_id, caption);
      })
      .then(data => {
        util.hideLoading();
        util.showSuccess('发送成功');

        // 添加消息到界面
        const userMessage = { ...data.user_message, timeText: '刚刚' };
        const assistantMessage = { ...data.assistant_message, timeText: '刚刚' };

        this.setData({
          messages: [...this.data.messages, userMessage, assistantMessage]
        });

        this.scrollToBottom();
      })
      .catch(err => {
        util.hideLoading();
        console.error('发送视频失败:', err);
        util.showError(err.message || '发送失败，请重试');
      });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const that = this;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const media = res.tempFiles[0];
        const { tempFilePath, size } = media;

        // 检查图片大小（10MB限制）
        if (size > 10 * 1024 * 1024) {
          util.showToast('图片大小不能超过10MB');
          return;
        }

        // 直接上传（图片不需要预览）
        that.uploadAndSendImage(tempFilePath);
      },
      fail(err) {
        console.error('选择图片失败:', err);
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          util.showToast('选择图片失败');
        }
      }
    });
  },

  /**
   * 上传并发送图片
   */
  uploadAndSendImage(filePath) {
    const { companionId } = this.data;

    util.showLoading('上传中...');

    // 上传图片
    API.uploadImage(filePath, companionId)
      .then(imageData => {
        // 发送图片消息
        return API.sendImageMessage(companionId, imageData.media_id, '');
      })
      .then(data => {
        util.hideLoading();
        util.showSuccess('发送成功');

        // 添加消息到界面
        const userMessage = { ...data.user_message, timeText: '刚刚' };
        const assistantMessage = { ...data.assistant_message, timeText: '刚刚' };

        this.setData({
          messages: [...this.data.messages, userMessage, assistantMessage]
        });

        this.scrollToBottom();
      })
      .catch(err => {
        util.hideLoading();
        console.error('发送图片失败:', err);
        util.showError(err.message || '发送失败，请重试');
      });
  }
});
