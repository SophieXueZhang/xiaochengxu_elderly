# 视频分享功能设计

## 功能概述

让老年用户可以分享练歌、跳舞、日常生活等视频，AI陪伴角色会观看并给予温暖的回应和鼓励。

## 使用场景

### 场景1：分享广场舞视频
```
用户：妈妈上传跳广场舞的视频
AI回应："妈妈跳得真好！动作很标准，看得出来经常练习。跳舞既锻炼身体又愉悦心情，要坚持下去哦！"
```

### 场景2：分享唱歌视频
```
用户：上传K歌房录制的歌曲视频
AI回应："唱得真不错！声音很好听，感情也很投入。能听到你开心的歌声，我也很高兴。下次唱什么歌呀？"
```

### 场景3：分享日常生活
```
用户：上传做菜、散步等日常视频
AI回应："看起来很美味！你做菜一向很拿手。看到你每天都这么充实，我很欣慰。"
```

## 技术方案

### 一、数据结构设计

#### 1. 视频消息类型
```javascript
{
  id: 123,
  role: "user",
  type: "video",  // 消息类型：text, video, image, voice
  content: "今天跳舞的视频",  // 文字描述（可选）
  media: {
    url: "https://cdn.example.com/videos/123.mp4",
    thumbnail: "https://cdn.example.com/thumbnails/123.jpg",  // 视频封面
    duration: 45,  // 时长（秒）
    size: 2048000,  // 文件大小（字节）
    width: 720,
    height: 1280
  },
  created_at: "2026-04-03T10:00:00Z"
}
```

#### 2. AI回应消息
```javascript
{
  id: 124,
  role: "assistant",
  type: "text",
  content: "妈妈跳得真好！动作很标准...",
  video_analysis: {  // 视频分析结果（后端生成）
    activity: "dancing",  // 活动类型
    mood: "happy",  // 情绪
    duration: 45,
    keywords: ["广场舞", "健康", "快乐"]
  },
  created_at: "2026-04-03T10:00:05Z"
}
```

### 二、前端实现

#### 1. 视频选择和上传

**方案A：临时文件上传（推荐）**
```javascript
// 1. 选择视频
wx.chooseVideo({
  sourceType: ['album', 'camera'],
  maxDuration: 60,  // 限制60秒
  camera: 'back',
  success: (res) => {
    const videoPath = res.tempFilePath;
    this.uploadVideo(videoPath);
  }
});

// 2. 上传到服务器
uploadVideo(filePath) {
  wx.uploadFile({
    url: `${apiBaseUrl}/media/upload-video`,
    filePath: filePath,
    name: 'video',
    header: {
      'Authorization': `Bearer ${token}`
    },
    success: (res) => {
      const data = JSON.parse(res.data);
      const videoUrl = data.url;
      // 发送视频消息
      this.sendVideoMessage(videoUrl);
    }
  });
}
```

**方案B：直接上传到MinIO（备选）**
```javascript
// 获取上传凭证 -> 直接上传到MinIO -> 保存URL
```

#### 2. 视频消息展示组件

```html
<!-- components/video-message/video-message.wxml -->
<view class="video-message">
  <video 
    class="video-player"
    src="{{videoUrl}}"
    poster="{{thumbnail}}"
    controls
    show-center-play-btn
  />
  <view class="video-info">
    <text class="duration">{{duration}}秒</text>
  </view>
  <view wx:if="{{caption}}" class="caption">
    {{caption}}
  </view>
</view>
```

#### 3. 聊天页面集成

```html
<!-- pages/chat/chat.wxml -->
<view class="chat-input-area">
  <!-- 添加视频按钮 -->
  <view class="input-actions">
    <view class="action-btn" bindtap="chooseVideo">
      <image src="/images/video-icon.png" />
    </view>
  </view>
  
  <textarea class="chat-input" ... />
  <button class="btn-send" ...>发送</button>
</view>
```

### 三、后端API设计

#### 1. 视频上传接口

```python
POST /api/v1/media/upload-video
Authorization: Bearer <token>
Content-Type: multipart/form-data

# 请求
video: <video file>
companion_id: 1  # 可选：指定陪伴角色

# 响应
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/videos/abc123.mp4",
    "thumbnail": "https://cdn.example.com/thumbnails/abc123.jpg",
    "duration": 45,
    "size": 2048000,
    "media_id": "abc123"
  }
}
```

#### 2. 发送视频消息接口

```python
POST /api/v1/conversations/send-video
Authorization: Bearer <token>

# 请求
{
  "companion_id": 1,
  "media_id": "abc123",  # 上传后返回的ID
  "caption": "今天跳舞的视频"  # 可选文字说明
}

# 响应
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "user_message": { ... },  # 用户视频消息
    "assistant_message": { ... }  # AI文字回应
  }
}
```

### 四、AI视频理解方案

#### 方案A：简化版（短期 - 推荐）

**不做视频内容分析，基于用户输入的文字描述回应：**

```python
# 用户发送视频时可以添加文字说明
caption = "今天跳舞的视频"

# AI基于文字生成回应
prompt = f"""
用户是一位中老年人，刚刚分享了一段视频：{caption}

请以温暖、鼓励的语气回应，表达你的欣赏和关心。
回应要：
1. 真诚赞美
2. 鼓励继续
3. 关心身体健康
4. 语气亲切温暖
"""

# GPT-4回应示例
"跳得真好！看得出来动作很熟练。经常跳舞对身体很好，
既锻炼了身体又能结交朋友。不过也要注意劳逸结合，
别太累着了。下次有新舞蹈记得也给我看看！"
```

#### 方案B：AI视频分析（中长期）

**使用GPT-4 Vision或其他多模态AI分析视频：**

```python
# 1. 提取视频关键帧
frames = extract_key_frames(video_path, num_frames=3)

# 2. 使用GPT-4 Vision分析
response = openai.ChatCompletion.create(
    model="gpt-4-vision-preview",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "这是一位老年人分享的生活视频，请描述视频内容"},
            {"type": "image_url", "image_url": frame1_base64},
            {"type": "image_url", "image_url": frame2_base64}
        ]
    }]
)

# 3. 基于分析结果生成回应
activity = analyze_activity(response)
mood = analyze_mood(response)

# 生成个性化回应
```

### 五、存储方案

#### 选项1：使用现有MinIO
```
videos/
├── user_123/
│   ├── 20260403_100000.mp4
│   ├── 20260403_100000_thumb.jpg
│   └── ...
```

**优点：**
- 已有基础设施
- 成本可控
- 数据自主

**缺点：**
- 带宽占用
- CDN需求

#### 选项2：使用微信云存储
```javascript
wx.cloud.uploadFile({
  cloudPath: `videos/${Date.now()}.mp4`,
  filePath: tempFilePath
});
```

**优点：**
- 微信生态内
- 自动CDN
- 上传快速

**缺点：**
- 费用较高
- 依赖微信

#### 推荐：MinIO + CDN（如七牛云、腾讯云CDN）

### 六、用户体验优化

#### 1. 上传进度提示
```javascript
wx.uploadFile({
  // ...
  success: (res) => {
    wx.showToast({ title: '上传成功', icon: 'success' });
  },
  fail: (err) => {
    wx.showToast({ title: '上传失败，请重试', icon: 'error' });
  }
});
```

#### 2. 视频压缩
```javascript
// 自动压缩大视频
wx.compressVideo({
  src: videoPath,
  quality: 'medium',
  success: (res) => {
    // 使用压缩后的视频
  }
});
```

#### 3. 预览确认
```javascript
// 选择后先预览，确认再上传
wx.chooseVideo({
  success: (res) => {
    // 显示预览+确认按钮
    this.showVideoPreview(res.tempFilePath);
  }
});
```

#### 4. 离线处理
```javascript
// 网络不好时暂存本地，有网络时自动上传
if (!isNetworkAvailable) {
  wx.setStorageSync('pending_videos', [...]);
}
```

### 七、限制和规则

#### 1. 视频限制
- 时长：最长60秒
- 大小：最大50MB
- 格式：MP4, MOV
- 分辨率：最高1080p

#### 2. 上传限制
- 免费用户：每天5个视频
- 付费用户：每天20个视频
- 单次上传间隔：10秒

#### 3. 存储限制
- 免费用户：100MB总空间
- 付费用户：5GB总空间
- 超过后删除最早的视频

### 八、实现计划

#### Phase 1：基础功能（1周）
- [x] 视频选择和上传
- [x] 视频消息展示
- [x] 基于文字描述的AI回应
- [x] 基本错误处理

#### Phase 2：体验优化（1周）
- [ ] 上传进度提示
- [ ] 视频压缩
- [ ] 预览确认
- [ ] 离线处理

#### Phase 3：AI增强（2-3周）
- [ ] GPT-4 Vision集成
- [ ] 视频内容分析
- [ ] 智能回应生成
- [ ] 情感识别

#### Phase 4：高级功能（未来）
- [ ] 视频剪辑
- [ ] 美颜滤镜
- [ ] 视频相册
- [ ] 视频分享到朋友圈

## 代码示例

### 完整流程示例

```javascript
// 1. 用户点击视频按钮
onVideoButtonClick() {
  wx.chooseVideo({
    sourceType: ['album'],
    maxDuration: 60,
    camera: 'back',
    success: (res) => {
      this.handleVideoSelected(res);
    }
  });
}

// 2. 处理视频选择
handleVideoSelected(res) {
  const { tempFilePath, duration, size } = res;
  
  // 检查大小
  if (size > 50 * 1024 * 1024) {
    util.showToast('视频大小不能超过50MB');
    return;
  }
  
  // 显示预览
  this.showVideoPreview(tempFilePath, duration);
}

// 3. 预览并确认
showVideoPreview(path, duration) {
  wx.showModal({
    title: '确认发送视频？',
    content: `时长：${duration}秒`,
    success: (res) => {
      if (res.confirm) {
        this.uploadAndSendVideo(path);
      }
    }
  });
}

// 4. 上传视频
uploadAndSendVideo(filePath) {
  util.showLoading('上传中...');
  
  API.uploadVideo(filePath, this.data.companionId)
    .then(videoData => {
      // 发送视频消息
      return API.sendVideoMessage(
        this.data.companionId,
        videoData.media_id,
        this.data.videoCaption
      );
    })
    .then(data => {
      util.hideLoading();
      util.showSuccess('发送成功');
      
      // 添加消息到界面
      this.addMessages([
        data.user_message,
        data.assistant_message
      ]);
    })
    .catch(err => {
      util.hideLoading();
      util.showError(err.message || '发送失败');
    });
}
```

## 总结

这个视频分享功能能让老年用户更好地分享生活，AI陪伴角色通过温暖的回应给予情感支持，增强陪伴感。

**核心价值：**
1. 🎭 **生活记录** - 记录美好瞬间
2. 💬 **情感交流** - AI给予认可和鼓励
3. 🎯 **简单易用** - 老年友好的交互设计
4. ❤️ **温暖陪伴** - 让用户感受到被关注

**技术特点：**
- 渐进式实现（先文字后视频分析）
- 成本可控（MinIO存储 + 按需AI）
- 体验优先（压缩、预览、进度）
- 可扩展性（支持未来功能）
