/**
 * EasyBoss 自动登录模块
 * 使用 Playwright 无头浏览器登录 EasyBoss ERP
 * 维护登录会话，自动刷新 cookie
 */

const { chromium } = require('playwright');

class EasyBossAuth {
  constructor(config = {}) {
    this.username = config.username || 'xuziyi';
    this.password = config.password || 'Xuziyi123.';
    this.loginUrl = 'https://www.easyboss.com/login';
    this.browser = null;
    this.context = null;
    this.page = null;
    this.cookies = null;
    this.lastLogin = null;
    this.sessionMaxAge = 3600 * 1000; // 1小时刷新一次
  }

  /**
   * 启动浏览器并登录
   */
  async login() {
    try {
      console.log('[EasyBoss] 开始登录...');

      // 启动浏览器
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });

      this.page = await this.context.newPage();

      // 访问登录页
      await this.page.goto(this.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);

      // 输入用户名
      const usernameInput = await this.page.$('input[type="text"], input[name="username"], input[name="account"], input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="email"]');
      if (!usernameInput) {
        // 尝试更通用的选择器
        const inputs = await this.page.$$('input');
        if (inputs.length >= 2) {
          await inputs[0].fill(this.username);
        } else {
          throw new Error('找不到用户名输入框');
        }
      } else {
        await usernameInput.fill(this.username);
      }

      await this.page.waitForTimeout(500);

      // 输入密码
      const passwordInput = await this.page.$('input[type="password"]');
      if (!passwordInput) {
        throw new Error('找不到密码输入框');
      }
      await passwordInput.fill(this.password);

      await this.page.waitForTimeout(500);

      // 点击登录按钮
      const loginBtn = await this.page.$('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign in")');
      if (loginBtn) {
        await loginBtn.click();
      } else {
        // 尝试回车提交
        await this.page.keyboard.press('Enter');
      }

      // 等待登录完成（页面跳转或出现特定元素）
      await Promise.race([
        this.page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        this.page.waitForTimeout(8000)
      ]);

      // 再等一下确保完全加载
      await this.page.waitForTimeout(3000);

      // 检查是否登录成功
      const currentUrl = this.page.url();
      console.log('[EasyBoss] 当前页面:', currentUrl);

      if (currentUrl.includes('/login')) {
        // 可能还在登录页，检查是否有错误提示
        const errorText = await this.page.$eval('.error, .err-msg, .ant-message-error, [class*="error"]', el => el.textContent).catch(() => null);
        if (errorText) {
          throw new Error(`登录失败: ${errorText}`);
        }
        // 可能是慢加载，再等一下
        await this.page.waitForTimeout(5000);
      }

      // 保存 cookies
      this.cookies = await this.context.cookies();
      this.lastLogin = Date.now();

      console.log(`[EasyBoss] 登录成功! 获取到 ${this.cookies.length} 个 cookies`);
      return { success: true, cookies: this.cookies };

    } catch (err) {
      console.error('[EasyBoss] 登录失败:', err.message);
      await this.close();
      return { success: false, error: err.message };
    }
  }

  /**
   * 获取有效的 cookies（自动刷新）
   */
  async getCookies() {
    if (!this.cookies || !this.lastLogin || (Date.now() - this.lastLogin > this.sessionMaxAge)) {
      console.log('[EasyBoss] 会话过期，重新登录...');
      const result = await this.login();
      if (!result.success) {
        throw new Error('重新登录失败: ' + result.error);
      }
    }
    return this.cookies;
  }

  /**
   * 获取用于 fetch 请求的 cookie 字符串
   */
  async getCookieString() {
    const cookies = await this.getCookies();
    return cookies.map(c => `${c.name}=${c.value}`).join('; ');
  }

  /**
   * 在已登录的页面上执行操作
   */
  async getPage() {
    if (!this.page || !this.browser) {
      await this.login();
    }
    return this.page;
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(url) {
    const page = await this.getPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    return page;
  }

  /**
   * 拦截并获取 API 请求的响应
   */
  async interceptAPI(url, apiPattern) {
    const page = await this.getPage();

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('API 请求超时'));
      }, 30000);

      page.on('response', async (response) => {
        const reqUrl = response.url();
        if (reqUrl.includes(apiPattern)) {
          try {
            const data = await response.json();
            clearTimeout(timeout);
            resolve(data);
          } catch (e) {
            // 不是目标请求，忽略
          }
        }
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    });
  }

  /**
   * 关闭浏览器
   */
  async close() {
    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch (e) {
      // ignore
    }
    this.page = null;
    this.context = null;
    this.browser = null;
    this.cookies = null;
    this.lastLogin = null;
    console.log('[EasyBoss] 浏览器已关闭');
  }

  /**
   * 健康检查
   */
  getStatus() {
    return {
      loggedIn: !!this.cookies,
      lastLogin: this.lastLogin ? new Date(this.lastLogin).toISOString() : null,
      sessionAge: this.lastLogin ? Math.floor((Date.now() - this.lastLogin) / 1000) + 's' : null,
      browserAlive: !!this.browser
    };
  }
}

// 单例模式
let instance = null;

function getAuthInstance(config) {
  if (!instance) {
    instance = new EasyBossAuth(config);
  }
  return instance;
}

module.exports = { EasyBossAuth, getAuthInstance };
