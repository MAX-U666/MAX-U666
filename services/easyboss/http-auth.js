/**
 * EasyBoss HTTP API 自动登录模块
 * 
 * [2026-02-06] 统一使用 /api/auth/account/login 接口 + CryptoJS加密
 *              同时写入Cookie文件，getCookie优先读文件
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const COOKIE_FILE = path.join(__dirname, '.easyboss_cookie');

// AES加密（与daily-sync一致，使用CryptoJS兼容方式）
const EB_AES_KEY = '@3438jj;siduf832';

function aesEncryptCryptoJS(data) {
  // CryptoJS CBC with empty IV, PKCS7 padding
  const key = Buffer.from(EB_AES_KEY, 'utf-8');
  const iv = Buffer.alloc(16, 0); // empty IV
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

class EasyBossHttpAuth {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.username = config.username || 'xuziyi';
    this.password = config.password || 'Xuziyi123.';
    // 统一使用 auth/account/login 接口（与daily-sync一致）
    this.loginUrl = 'https://www.easyboss.com/api/auth/account/login';
  }

  /**
   * 执行登录（使用https模块，与daily-sync一致的方式）
   */
  async login() {
    const https = require('https');
    
    try {
      console.log('[HttpAuth] 开始登录 EasyBoss (auth/account/login)...');
      
      const mobile = aesEncryptCryptoJS(this.username);
      const password = aesEncryptCryptoJS(this.password);

      const result = await new Promise((resolve, reject) => {
        const formData = {
          mobile, password,
          loginValidateCode: '',
          isForwarderLogin: '1',
          isVerifyRemoteLogin: '1',
          from: 'erp',
        };
        const body = Object.entries(formData)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
          .join('&');

        const req = https.request({
          hostname: 'www.easyboss.com',
          port: 443,
          path: '/api/auth/account/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          },
          timeout: 15000,
        }, res => {
          let d = '';
          const setCookies = res.headers['set-cookie'] || [];
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve({ data: JSON.parse(d), setCookies, status: res.statusCode }); }
            catch { resolve({ data: d, setCookies, status: res.statusCode }); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('登录请求超时')); });
        req.write(body);
        req.end();
      });

      console.log('[HttpAuth] 响应状态:', result.status);
      console.log('[HttpAuth] Set-Cookie 数量:', result.setCookies.length);

      if (result.data && result.data.result === 'success' && result.setCookies.length > 0) {
        const cookieString = result.setCookies.map(c => c.split(';')[0]).join('; ');
        
        console.log('[HttpAuth] ✅ 登录成功! Cookie长度:', cookieString.length);
        return {
          success: true,
          cookieString,
          accountId: result.data.accountId,
          subAccountId: result.data.subAccountId
        };
      } else if (result.data && result.data.needSmsVerify) {
        return { success: false, error: '需要短信验证码(异地登录)' };
      } else {
        const reason = result.data?.reason || result.data?.message || '未知错误';
        console.log('[HttpAuth] ❌ 登录失败:', reason);
        return { success: false, error: reason };
      }
    } catch (err) {
      console.error('[HttpAuth] 登录异常:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 登录并保存 Cookie 到文件+数据库
   */
  async loginAndSave() {
    const result = await this.login();
    if (result.success && result.cookieString) {
      await this.saveCookie(result.cookieString);
    }
    return result;
  }

  /**
   * 保存 Cookie 到文件 + 数据库
   */
  async saveCookie(cookieString) {
    // 写入文件（最可靠）
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
      console.error('[HttpAuth] 保存到数据库失败:', err.message);
    }
  }

  /**
   * 获取 Cookie（优先读文件，fallback数据库）
   */
  async getCookie() {
    // 优先从文件读取
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
        return { cookieString: rows[0].config_value, updatedAt: rows[0].updated_at };
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
    return age > 20 * 60 * 60 * 1000;
  }

  /**
   * 智能获取 Cookie：过期则自动刷新
   */
  async ensureFreshCookie() {
    if (await this.isCookieExpiringSoon()) {
      console.log('[HttpAuth] Cookie 即将过期，自动刷新...');
      const result = await this.loginAndSave();
      if (!result.success) {
        throw new Error('自动刷新 Cookie 失败: ' + result.error);
      }
      return result.cookieString;
    }
    const saved = await this.getCookie();
    return saved?.cookieString;
  }
}

module.exports = EasyBossHttpAuth;
