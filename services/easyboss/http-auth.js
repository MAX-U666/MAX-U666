/**
 * EasyBoss HTTP API 自动登录模块
 * 纯 HTTP 请求，无需浏览器，避免异地验证
 * 
 * 登录流程：AES加密账号密码 → POST登录接口 → 获取Cookie
 * 
 * [2026-02-06] 修复：Cookie同时写入文件，getCookie优先读文件，解决API进程内存缓存导致cookie过期问题
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const COOKIE_FILE = path.join(__dirname, '.easyboss_cookie');

class EasyBossHttpAuth {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.username = config.username || 'xuziyi';
    this.password = config.password || 'Xuziyi123.';
    this.loginUrl = 'https://www.easyboss.com/api/user/login';
    
    // AES 加密配置 (EasyBoss 使用的密钥)
    this.aesKey = 'dmerp1234567890a';
    this.aesIv = 'dmerp1234567890a';
  }

  /**
   * AES-128-CBC 加密
   */
  aesEncrypt(text) {
    const cipher = crypto.createCipheriv('aes-128-cbc', this.aesKey, this.aesIv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * 执行登录，返回 Cookie 字符串
   */
  async login() {
    try {
      console.log('[HttpAuth] 开始登录 EasyBoss...');
      
      // AES 加密账号密码
      const encryptedAccount = this.aesEncrypt(this.username);
      const encryptedPassword = this.aesEncrypt(this.password);
      
      console.log('[HttpAuth] 账号密码已加密');

      // 发送登录请求
      const response = await fetch(this.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Origin': 'https://www.easyboss.com',
          'Referer': 'https://www.easyboss.com/account/login.html',
        },
        body: JSON.stringify({
          account: encryptedAccount,
          password: encryptedPassword,
          isEncrypt: true,
          loginType: 'web'
        }),
      });

      // 提取 Set-Cookie
      // Node 22 fetch 兼容：getSetCookie() 或 fallback
      let setCookies = [];
      if (typeof response.headers.getSetCookie === 'function') {
        setCookies = response.headers.getSetCookie();
      } else if (typeof response.headers.raw === 'function') {
        setCookies = response.headers.raw()['set-cookie'] || [];
      } else {
        const raw = response.headers.get('set-cookie');
        if (raw) setCookies = raw.split(', ');
      }
      const data = await response.json();

      console.log('[HttpAuth] 响应状态:', response.status);
      console.log('[HttpAuth] 响应内容:', JSON.stringify(data));
      console.log('[HttpAuth] Set-Cookie 数量:', setCookies.length);

      // 检查登录结果
      if (data.result === 'success' || data.code === 200) {
        // 解析 cookies
        const cookiePairs = setCookies.map(c => {
          const match = c.match(/^([^=]+)=([^;]*)/);
          return match ? `${match[1]}=${match[2]}` : null;
        }).filter(Boolean);

        const cookieString = cookiePairs.join('; ');
        
        console.log('[HttpAuth] ✅ 登录成功!');
        console.log('[HttpAuth] Cookie 长度:', cookieString.length);

        return {
          success: true,
          cookieString,
          accountId: data.accountId,
          subAccountId: data.subAccountId
        };
      } else {
        console.log('[HttpAuth] ❌ 登录失败:', data.reason || data.message || '未知错误');
        return {
          success: false,
          error: data.reason || data.message || '登录失败'
        };
      }
    } catch (err) {
      console.error('[HttpAuth] 登录异常:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * 登录并保存 Cookie 到数据库+文件
   */
  async loginAndSave() {
    const result = await this.login();
    
    if (result.success && result.cookieString) {
      await this.saveCookie(result.cookieString);
    }
    
    return result;
  }

  /**
   * 保存 Cookie 到数据库 + 文件
   */
  async saveCookie(cookieString) {
    // 写入文件（最可靠，不受进程缓存影响）
    try {
      fs.writeFileSync(COOKIE_FILE, cookieString, 'utf-8');
      console.log('[HttpAuth] Cookie 已写入文件:', COOKIE_FILE);
    } catch (e) {
      console.error('[HttpAuth] 写入文件失败:', e.message);
    }
    // 写入数据库（备份）
    try {
      await this.pool.query(
        `INSERT INTO eb_config (config_key, config_value, updated_at) 
         VALUES ('easyboss_cookie', ?, NOW())
         ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
        [cookieString, cookieString]
      );
      console.log('[HttpAuth] Cookie 已保存到数据库');
    } catch (err) {
      console.error('[HttpAuth] 保存 Cookie 到数据库失败:', err.message);
    }
  }

  /**
   * 获取 Cookie（优先读文件，fallback数据库）
   */
  async getCookie() {
    // 优先从文件读取（最新，不受进程缓存影响）
    try {
      if (fs.existsSync(COOKIE_FILE)) {
        const cookieStr = fs.readFileSync(COOKIE_FILE, 'utf-8').trim();
        if (cookieStr.length > 10) {
          const stat = fs.statSync(COOKIE_FILE);
          console.log('[HttpAuth] 从文件读取Cookie (' + cookieStr.length + '字符)');
          return { cookieString: cookieStr, updatedAt: stat.mtime };
        }
      }
    } catch (e) {
      console.error('[HttpAuth] 读取Cookie文件失败:', e.message);
    }
    // fallback: 从数据库读取
    try {
      const [rows] = await this.pool.query(
        "SELECT config_value, updated_at FROM eb_config WHERE config_key = 'easyboss_cookie' LIMIT 1"
      );
      if (rows.length && rows[0].config_value) {
        return {
          cookieString: rows[0].config_value,
          updatedAt: rows[0].updated_at
        };
      }
      return null;
    } catch (err) {
      console.error('[HttpAuth] 获取 Cookie 失败:', err.message);
      return null;
    }
  }

  /**
   * 检查 Cookie 是否可能过期（超过20小时）
   */
  async isCookieExpiringSoon() {
    const saved = await this.getCookie();
    if (!saved) return true;
    
    const age = Date.now() - new Date(saved.updatedAt).getTime();
    const maxAge = 20 * 60 * 60 * 1000; // 20小时
    
    return age > maxAge;
  }

  /**
   * 智能获取 Cookie：过期则自动刷新
   */
  async ensureFreshCookie() {
    // 检查是否需要刷新
    if (await this.isCookieExpiringSoon()) {
      console.log('[HttpAuth] Cookie 即将过期，自动刷新...');
      const result = await this.loginAndSave();
      if (!result.success) {
        throw new Error('自动刷新 Cookie 失败: ' + result.error);
      }
      return result.cookieString;
    }
    
    // 使用现有 Cookie
    const saved = await this.getCookie();
    return saved?.cookieString;
  }
}

module.exports = EasyBossHttpAuth;
