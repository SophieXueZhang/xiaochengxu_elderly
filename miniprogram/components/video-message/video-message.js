// components/video-message/video-message.js
Component({
  properties: {
    videoData: {
      type: Object,
      value: {}
    },
    caption: {
      type: String,
      value: ''
    },
    alignRight: {
      type: Boolean,
      value: false
    }
  },

  data: {
    formattedDuration: '0:00',
    formattedSize: ''
  },

  observers: {
    'videoData.duration': function(duration) {
      if (duration) {
        this.setData({
          formattedDuration: this.formatDuration(duration)
        });
      }
    },
    'videoData.size': function(size) {
      if (size) {
        this.setData({
          formattedSize: this.formatSize(size)
        });
      }
    }
  },

  methods: {
    /**
     * 格式化时长
     */
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化文件大小
     */
    formatSize(bytes) {
      if (bytes < 1024) {
        return `${bytes}B`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)}KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      }
    }
  }
});
