/**
 * 紫鸟浏览器连接服务
 * 负责：启动紫鸟、管理店铺浏览器、获取调试端口
 */
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 紫鸟配置
const ZINIAO_CONFIG = {
  // Linux 版紫鸟路径（根据实际安装位置调整）
  clientPath: process.env.ZINIAO_PATH || '/opt/ziniao/ziniao',
  
  // 紫鸟账号信息
  company: process.env.ZINIAO_COMPANY || '',
  username: process.env.ZINIAO_USERNAME || '',
  password: process.env.ZINIAO_PASSWORD || '',
  
  // 通讯端口
  socketPort: parseInt(process.env.ZINIAO_PORT) || 19888,
  
  // 超时设置
  timeout: 120000, // 120秒
};

class ZiNiaoService {
  constructor(config = {}) {
    this.config = { ...ZINIAO_CONFIG, ...config };
    this.baseUrl = `http://127.0.0.1:${this.config.socketPort}`;
    this.process = null;
    this.isRunning = false;
    this.activeBrowsers = new Map(); // browserId -> { debuggingPort, coreVersion }
  }

  /**
   * 启动紫鸟客户端主进程
   */
  async startClient() {
    if (this.isRunning) {
      console.log('[ZiNiao] 客户端已在运行');
      return true;
    }

    return new Promise((resolve) => {
      try {
        const cmd = [
          this.config.clientPath,
          '--no-sandbox',
          '--run_type=web_driver',
          '--ipc_type=http',
          `--port=${this.config.socketPort}`
        ];

        console.log(`[ZiNiao] 启动命令: ${cmd.join(' ')}`);
        
        this.process = spawn(cmd[0], cmd.slice(1), {
          detached: true,
          stdio: 'ignore'
        });

        this.process.unref();

        // 等待启动
        setTimeout(async () => {
          const running = await this.healthCheck();
          if (running) {
            this.isRunning = true;
            console.log('[ZiNiao] 客户端启动成功');
            resolve(true);
          } else {
            console.log('[ZiNiao] 客户端启动失败');
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('[ZiNiao] 启动异常:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const response = await axios.post(this.baseUrl, {
        action: 'getRunningInfo',
        requestId: `health_${Date.now()}`
      }, { timeout: 10000 });
      
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * 调用紫鸟 API
   */
  async callApi(payload) {
    const fullPayload = {
      company: this.config.company,
      username: this.config.username,
      password: this.config.password,
      ...payload,
      requestId: payload.requestId || `req_${Date.now()}`
    };

    try {
      const response = await axios.post(this.baseUrl, fullPayload, {
        timeout: this.config.timeout,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
    } catch (error) {
      console.error('[ZiNiao] API调用失败:', error.message);
      throw error;
    }
  }

  /**
   * 设备授权（首次使用）
   */
  async applyAuth() {
    const result = await this.callApi({ action: 'applyAuth' });
    return result.statusCode === 0;
  }

  /**
   * 获取店铺列表
   */
  async getBrowserList() {
    const result = await this.callApi({ action: 'getBrowserList' });
    
    if (result.statusCode !== 0) {
      throw new Error(result.err || '获取店铺列表失败');
    }

    return (result.browserList || []).map(item => ({
      browserId: item.browserOauth || item.browserId,
      browserName: item.browserName,
      browserIp: item.browserIp,
      siteId: item.siteId,
      platformId: item.platform_id,
      platformName: item.platform_name,
      isExpired: item.isExpired
    }));
  }

  /**
   * 启动店铺浏览器
   */
  async startBrowser(browserId, options = {}) {
    // 如果已启动，返回缓存的信息
    if (this.activeBrowsers.has(browserId)) {
      console.log(`[ZiNiao] 浏览器 ${browserId} 已启动，复用连接`);
      return this.activeBrowsers.get(browserId);
    }

    const payload = {
      action: 'startBrowser',
      browserId: browserId,
      isHeadless: options.headless || false,
      notPromptForDownload: 1,
      windowRatio: options.windowRatio || 100,
    };

    if (options.downloadPath) {
      payload.forceDownloadPath = options.downloadPath;
    }

    console.log(`[ZiNiao] 启动浏览器: ${browserId}`);
    const result = await this.callApi(payload);

    if (result.statusCode !== 0) {
      const error = result.err || result.LastError || `状态码: ${result.statusCode}`;
      throw new Error(`启动浏览器失败: ${error}`);
    }

    const browserInfo = {
      browserId,
      debuggingPort: parseInt(result.debuggingPort),
      coreType: result.core_type || result.coreType,
      coreVersion: result.core_version || result.coreVersion,
      downloadPath: result.downloadPath,
      launcherPage: result.launcherPage,
      proxyType: result.proxyType,
      ip: result.ip
    };

    this.activeBrowsers.set(browserId, browserInfo);
    console.log(`[ZiNiao] 浏览器启动成功，端口: ${browserInfo.debuggingPort}`);
    
    return browserInfo;
  }

  /**
   * 关闭店铺浏览器
   */
  async stopBrowser(browserId) {
    const result = await this.callApi({
      action: 'stopBrowser',
      browserId: browserId
    });

    this.activeBrowsers.delete(browserId);
    
    return result.statusCode === 0;
  }

  /**
   * 获取当前运行中的浏览器
   */
  async getRunningBrowsers() {
    const result = await this.callApi({ action: 'getRunningInfo' });
    return result.browsers || [];
  }

  /**
   * 退出紫鸟客户端
   */
  async exitClient() {
    try {
      await this.callApi({ action: 'exit' });
    } catch {
      // 忽略退出时的错误
    }
    
    this.isRunning = false;
    this.activeBrowsers.clear();
    
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * 获取浏览器信息（如果已启动）
   */
  getBrowserInfo(browserId) {
    return this.activeBrowsers.get(browserId);
  }

  /**
   * 确保浏览器已启动
   */
  async ensureBrowser(browserId, options = {}) {
    // 检查紫鸟是否运行
    if (!this.isRunning) {
      const started = await this.startClient();
      if (!started) {
        throw new Error('紫鸟客户端启动失败');
      }
    }

    // 启动/获取浏览器
    return await this.startBrowser(browserId, options);
  }
}

// 单例
let instance = null;

function getZiNiaoService(config) {
  if (!instance) {
    instance = new ZiNiaoService(config);
  }
  return instance;
}

module.exports = {
  ZiNiaoService,
  getZiNiaoService,
  ZINIAO_CONFIG
};
