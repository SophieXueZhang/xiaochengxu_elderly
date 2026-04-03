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
  }
});
