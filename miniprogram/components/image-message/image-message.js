// components/image-message/image-message.js
Component({
  properties: {
    imageData: {
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

  methods: {
    /**
     * 预览图片
     */
    previewImage() {
      const { url } = this.properties.imageData;
      if (url) {
        wx.previewImage({
          urls: [url],
          current: url
        });
      }
    }
  }
});
