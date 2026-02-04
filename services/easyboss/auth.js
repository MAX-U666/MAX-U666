/**
 * EasyBoss 自动登录模块
 * 使用 Playwright 无头浏览器登录 EasyBoss ERP
 */

const { chromium } = require('playwright');

class EasyBossAuth {
  constructor(config = {}) {
    this.username = config.username || 'xuziyi';
    this.password = config.password || 'Xuziyi123.';
    this.loginUrl = 'https://www.easyboss.com/account/login.html?redirect=%2Flogin';
    this.browser = null;
    this.context = null;
    this.page = null;
    this.cookies = null;
    this.lastLogin = null;
    this.sessionMaxAge = 3600 * 1000;
  }

  async login() {
    try {
      console.log('[EasyBoss] 开始登录...');

      this.browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
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
      console.log('[EasyBoss] 打开登录页...');
      await this.page.goto(this.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(3000);

      console.log('[EasyBoss] 页面URL:', this.page.url());

      // 输入用户名
      const usernameInput = await this.page.$('input[type="text"]') 
        || await this.page.$('input[placeholder*="账号"]')
        || await this.page.$('input[placeholder*="account"]')
        || await this.page.$('input[placeholder*="用户名"]')
        || await this.page.$('input[placeholder*="email"]')
        || await this.page.$('input[placeholder*="手机"]');
      
      if (!usernameInput) {
        const allInputs = await this.page.$$('input:visible');
        console.log('[EasyBoss] 找到', allInputs.length, '个可见 input');
        if (allInputs.length >= 2) {
          await allInputs[0].fill(this.username);
          console.log('[EasyBoss] 用户名已输入(通过索引)');
        } else {
          throw new Error('找不到用户名输入框');
        }
      } else {
        await usernameInput.fill(this.username);
        console.log('[EasyBoss] 用户名已输入');
      }

      await this.page.waitForTimeout(500);

      // 输入密码
      const passwordInput = await this.page.$('input[type="password"]');
      if (!passwordInput) {
        throw new Error('找不到密码输入框');
      }
      await passwordInput.fill(this.password);
      console.log('[EasyBoss] 密码已输入');

      await this.page.waitForTimeout(500);

      // 点击登录按钮
      const loginBtn = await this.page.$('button:has-text("Sign In")')
        || await this.page.$('button:has-text("登录")')
        || await this.page.$('button:has-text("Login")')
        || await this.page.$('.sign-in-btn')
        || await this.page.$('button[type="submit"]');
      
      if (loginBtn) {
        await loginBtn.click();
        console.log('[EasyBoss] 已点击登录按钮');
      } else {
        await this.page.keyboard.press('Enter');
        console.log('[EasyBoss] 已按回车提交');
      }

      // 等待登录完成
      await Promise.race([
        this.page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        this.page.waitForTimeout(10000)
      ]);

      await this.page.waitForTimeout(3000);

      const currentUrl = this.page.url();
      console.log('[EasyBoss] 登录后页面:', currentUrl);

      // 检查异地登录验证
      const verifyPopup = await this.page.$('text=验证') 
        || await this.page.$('text=Verification')
        || await this.page.$('text=Off-site');
      if (verifyPopup) {
        console.log('[EasyBoss] ⚠️ 检测到异地登录验证');
      }

      // 保存 cookies
      this.cookies = await this.context.cookies();
      this.lastLogin = Date.now();

      if (currentUrl.includes('/account/login')) {
        const pageText = await this.page.textContent('body');
        if (pageText.includes('验证') || pageText.includes('Verification')) {
          return { success: false, error: '需要异地登录验证码', needVerify: true };
        }
        return { success: false, error: '登录失败，仍在登录页' };
      }

      console.log('[EasyBoss] ✅ 登录成功! 获取到', this.cookies.length, '个 cookies');
      return { success: true, cookies: this.cookies, url: currentUrl };

    } catch (err) {
      console.error('[EasyBoss] 登录失败:', err.message);
      await this.close();
      return { success: false, error: err.message };
    }
  }

  async getCookies() {
    if (!this.cookies || !this.lastLogin || (Date.now() - this.lastLogin > this.sessionMaxAge)) {
      const result = await this.login();
      if (!result.success) {
        throw new Error('登录失败: ' + result.error);
      }
    }
    return this.cookies;
  }

  async getCookieString() {
    const cookies = await this.getCookies();
    return cookies.map(c => `${c.name}=${c.value}`).join('; ');
  }

  async getPage() {
    if (!this.page || !this.browser) {
      const result = await this.login();
      if (!result.success) {
        throw new Error('获取页面失败: ' + result.error);
      }
    }
    return this.page;
  }

  async navigateTo(url) {
    const page = await this.getPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    return page;
  }

  async close() {
    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch (e) {}
    this.page = null;
    this.context = null;
    this.browser = null;
    this.cookies = null;
    this.lastLogin = null;
    console.log('[EasyBoss] 浏览器已关闭');
  }

  getStatus() {
    return {
      loggedIn: !!this.cookies,
      lastLogin: this.lastLogin ? new Date(this.lastLogin).toISOString() : null,
      sessionAge: this.lastLogin ? Math.floor((Date.now() - this.lastLogin) / 1000) + 's' : null,
      browserAlive: !!this.browser
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
