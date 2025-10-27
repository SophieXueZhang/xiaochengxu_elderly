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
   * 发送消息
   */
  sendMessage() {
    const { inputText, companionId, sending } = this.data;

    // 防止重复发送
    if (sending || !inputText.trim()) {
      return;
    }

    const messageContent = inputText.trim();

    // 清空输入框
    this.setData({
      inputText: '',
      sending: true
    });

    // 添加用户消息到界面
    const userMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
      timeText: '刚刚'
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      thinking: true
    });

    this.scrollToBottom();

    // 发送到服务器
    API.sendMessage(messageContent, companionId, false)
      .then(data => {
        // 更新对话ID
        if (data.conversation_id) {
          this.setData({
            conversationId: data.conversation_id
          });
        }

        // 替换临时用户消息
        const messages = this.data.messages.filter(m => m.id !== userMessage.id);

        // 添加真实的用户消息和AI回复
        const realUserMessage = {
          ...data.user_message,
          timeText: '刚刚'
        };

        const assistantMessage = {
          ...data.assistant_message,
          timeText: '刚刚'
        };

        this.setData({
          messages: [...messages, realUserMessage, assistantMessage],
          thinking: false,
          sending: false
        });

        this.scrollToBottom();
      })
      .catch(err => {
        console.error('发送消息失败:', err);

        // 移除临时消息
        const messages = this.data.messages.filter(m => m.id !== userMessage.id);

        this.setData({
          messages,
          thinking: false,
          sending: false
        });

        util.showError(err.message || '发送失败');
      });
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
