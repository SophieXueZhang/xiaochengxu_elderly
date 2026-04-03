// utils/validator.js
// 表单验证工具类

/**
 * 验证规则配置
 */
const VALIDATION_RULES = {
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号'
  },
  password: {
    minLength: 6,
    maxLength: 20,
    message: '密码长度应为6-20位'
  },
  nickname: {
    minLength: 2,
    maxLength: 20,
    message: '昵称长度应为2-20个字符'
  },
  companionName: {
    minLength: 2,
    maxLength: 10,
    message: '角色名称应为2-10个字符'
  },
  backgroundStory: {
    minLength: 10,
    maxLength: 500,
    message: '角色背景应为10-500个字符'
  }
};

/**
 * 验证器类
 */
class Validator {
  constructor() {
    this.errors = [];
  }

  /**
   * 验证手机号
   */
  validatePhone(phone, fieldName = '手机号') {
    if (!phone) {
      this.errors.push(`${fieldName}不能为空`);
      return false;
    }

    if (!VALIDATION_RULES.phone.pattern.test(phone)) {
      this.errors.push(VALIDATION_RULES.phone.message);
      return false;
    }

    return true;
  }

  /**
   * 验证密码
   */
  validatePassword(password, fieldName = '密码') {
    if (!password) {
      this.errors.push(`${fieldName}不能为空`);
      return false;
    }

    const { minLength, maxLength, message } = VALIDATION_RULES.password;
    if (password.length < minLength || password.length > maxLength) {
      this.errors.push(message);
      return false;
    }

    return true;
  }

  /**
   * 验证密码匹配
   */
  validatePasswordMatch(password, password2) {
    if (password !== password2) {
      this.errors.push('两次输入的密码不一致');
      return false;
    }
    return true;
  }

  /**
   * 验证昵称
   */
  validateNickname(nickname) {
    if (!nickname) {
      this.errors.push('昵称不能为空');
      return false;
    }

    const { minLength, maxLength, message } = VALIDATION_RULES.nickname;
    if (nickname.length < minLength || nickname.length > maxLength) {
      this.errors.push(message);
      return false;
    }

    return true;
  }

  /**
   * 验证角色名称
   */
  validateCompanionName(name) {
    if (!name) {
      this.errors.push('角色名称不能为空');
      return false;
    }

    const { minLength, maxLength, message } = VALIDATION_RULES.companionName;
    if (name.length < minLength || name.length > maxLength) {
      this.errors.push(message);
      return false;
    }

    return true;
  }

  /**
   * 验证角色背景
   */
  validateBackgroundStory(story) {
    if (!story) {
      this.errors.push('角色背景不能为空');
      return false;
    }

    const { minLength, maxLength, message } = VALIDATION_RULES.backgroundStory;
    if (story.length < minLength || story.length > maxLength) {
      this.errors.push(message);
      return false;
    }

    return true;
  }

  /**
   * 验证必填字段
   */
  validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.errors.push(`${fieldName}不能为空`);
      return false;
    }
    return true;
  }

  /**
   * 验证长度范围
   */
  validateLength(value, minLength, maxLength, fieldName) {
    if (!value) {
      this.errors.push(`${fieldName}不能为空`);
      return false;
    }

    if (value.length < minLength) {
      this.errors.push(`${fieldName}至少${minLength}个字符`);
      return false;
    }

    if (value.length > maxLength) {
      this.errors.push(`${fieldName}不能超过${maxLength}个字符`);
      return false;
    }

    return true;
  }

  /**
   * 重置错误信息
   */
  reset() {
    this.errors = [];
  }

  /**
   * 获取第一个错误信息
   */
  getFirstError() {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  /**
   * 获取所有错误信息
   */
  getAllErrors() {
    return this.errors;
  }

  /**
   * 是否有错误
   */
  hasErrors() {
    return this.errors.length > 0;
  }
}

/**
 * 创建验证器实例
 */
function createValidator() {
  return new Validator();
}

/**
 * 快捷验证方法
 */
const validate = {
  // 验证手机号
  phone: (phone) => {
    const validator = createValidator();
    validator.validatePhone(phone);
    return {
      valid: !validator.hasErrors(),
      error: validator.getFirstError()
    };
  },

  // 验证密码
  password: (password) => {
    const validator = createValidator();
    validator.validatePassword(password);
    return {
      valid: !validator.hasErrors(),
      error: validator.getFirstError()
    };
  },

  // 验证登录表单
  loginForm: (phone, password) => {
    const validator = createValidator();
    validator.validatePhone(phone);
    validator.validatePassword(password);
    return {
      valid: !validator.hasErrors(),
      error: validator.getFirstError()
    };
  },

  // 验证注册表单
  registerForm: (phone, nickname, password, password2) => {
    const validator = createValidator();
    validator.validatePhone(phone);
    validator.validateNickname(nickname);
    validator.validatePassword(password);
    validator.validatePasswordMatch(password, password2);
    return {
      valid: !validator.hasErrors(),
      error: validator.getFirstError()
    };
  },

  // 验证创建角色表单
  companionForm: (name, backgroundStory) => {
    const validator = createValidator();
    validator.validateCompanionName(name);
    validator.validateBackgroundStory(backgroundStory);
    return {
      valid: !validator.hasErrors(),
      error: validator.getFirstError()
    };
  }
};

module.exports = {
  Validator,
  createValidator,
  validate
};
