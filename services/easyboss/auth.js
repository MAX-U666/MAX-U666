/**
 * EasyBoss 登录模块
 * 使用 HTTP API 登录，不依赖浏览器
 */

const EasyBossHttpAuth = require('./http-auth');

class EasyBossAuth {
  constructor(config = {}) {
    this.pool = config.pool || null;
    this.httpAuth = null;
    this.cookieString = null;
    this.lastLogin = null;
  }

  setPool(pool) {
    this.pool = pool;
    this.httpAuth = new EasyBossHttpAuth(pool);
  }

  async login() {
    if (!this.httpAuth) {
      return { success: false, error: '数据库连接未初始化' };
    }

    try {
      console.log('[EasyBoss] 开始 HTTP 登录...');
      const result = await this.httpAuth.loginAndSave();
      
      if (result.success) {
        this.cookieString = result.cookieString;
        this.lastLogin = Date.now();
        
        // 返回兼容旧格式的 cookies 数组
        const cookies = this.cookieString.split('; ').map(pair => {
          const [name, value] = pair.split('=');
          return { name, value };
        });
        
        console.log('[EasyBoss] ✅ HTTP 登录成功!');
        return { success: true, cookies, url: 'https://www.easyboss.com/welcome' };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('[EasyBoss] 登录失败:', err.message);
      return { success: false, error: err.message };
    }
  }

  async getCookies() {
    if (!this.cookieString || !this.lastLogin) {
      const result = await this.login();
      if (!result.success) {
        throw new Error('登录失败: ' + result.error);
      }
    }
    
    return this.cookieString.split('; ').map(pair => {
      const [name, value] = pair.split('=');
      return { name, value };
    });
  }

  async getCookieString() {
    if (!this.cookieString) {
      await this.login();
    }
    return this.cookieString || '';
  }

  async close() {
    // HTTP 登录不需要关闭浏览器
    console.log('[EasyBoss] 会话已关闭');
  }

  getStatus() {
    return {
      loggedIn: !!this.cookieString,
      lastLogin: this.lastLogin ? new Date(this.lastLogin).toISOString() : null,
      sessionAge: this.lastLogin ? Math.floor((Date.now() - this.lastLogin) / 1000) + 's' : null,
      browserAlive: false
    };
  }
}

let instance = null;
function getAuthInstance(config) {
  if (!instance) {
    instance = new EasyBossAuth(config);
  }
  return instance;
}

module.exports = { EasyBossAuth, getAuthInstance };
