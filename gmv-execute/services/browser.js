/**
 * Selenium 浏览器控制器
 * 负责：连接紫鸟浏览器、执行页面操作、截图取证
 */
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// 截图存储目录
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || './evidence';

class BrowserController {
  constructor(debuggingPort, coreVersion = '131') {
    this.debuggingPort = debuggingPort;
    this.coreVersion = coreVersion;
    this.driver = null;
    this.connected = false;
  }

  /**
   * 连接到紫鸟浏览器
   */
  async connect() {
    if (this.connected && this.driver) {
      return true;
    }

    try {
      const options = new chrome.Options();
      options.debuggerAddress(`127.0.0.1:${this.debuggingPort}`);

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      this.connected = true;
      console.log(`[Browser] 连接成功，端口: ${this.debuggingPort}`);
      return true;
    } catch (error) {
      console.error(`[Browser] 连接失败:`, error.message);
      return false;
    }
  }

  /**
   * 断开连接（不关闭浏览器）
   */
  async disconnect() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch {
        // 忽略
      }
      this.driver = null;
      this.connected = false;
    }
  }

  /**
   * 导航到 URL
   */
  async navigate(url, waitSeconds = 3) {
    await this.driver.get(url);
    await this.sleep(waitSeconds * 1000);
    return true;
  }

  /**
   * 等待元素出现
   */
  async waitForElement(locator, timeout = 10000) {
    try {
      const element = await this.driver.wait(
        until.elementLocated(locator),
        timeout
      );
      return element;
    } catch {
      return null;
    }
  }

  /**
   * 等待元素可点击并点击
   */
  async waitAndClick(locator, timeout = 10000) {
    try {
      const element = await this.driver.wait(
        until.elementLocated(locator),
        timeout
      );
      await this.driver.wait(until.elementIsEnabled(element), timeout);
      await this.sleep(300);
      await element.click();
      return true;
    } catch (error) {
      console.error('[Browser] 点击失败:', error.message);
      return false;
    }
  }

  /**
   * 安全输入文本
   */
  async sendKeys(locator, text, clearFirst = true, timeout = 10000) {
    try {
      const element = await this.driver.wait(
        until.elementLocated(locator),
        timeout
      );
      
      if (clearFirst) {
        await element.clear();
      }
      
      await this.sleep(300);
      await element.sendKeys(text);
      return true;
    } catch (error) {
      console.error('[Browser] 输入失败:', error.message);
      return false;
    }
  }

  /**
   * 获取元素文本
   */
  async getText(locator, timeout = 10000) {
    try {
      const element = await this.driver.wait(
        until.elementLocated(locator),
        timeout
      );
      return await element.getText();
    } catch {
      return null;
    }
  }

  /**
   * 获取元素属性
   */
  async getAttribute(locator, attr, timeout = 10000) {
    try {
      const element = await this.driver.wait(
        until.elementLocated(locator),
        timeout
      );
      return await element.getAttribute(attr);
    } catch {
      return null;
    }
  }

  /**
   * 检查元素是否存在
   */
  async elementExists(locator) {
    try {
      await this.driver.findElement(locator);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 执行 JavaScript
   */
  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(locator) {
    try {
      const element = await this.driver.findElement(locator);
      await this.driver.executeScript(
        "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
        element
      );
      await this.sleep(500);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 滚动到页面底部
   */
  async scrollToBottom() {
    await this.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    await this.sleep(500);
  }

  /**
   * 获取当前 URL
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  /**
   * 截图
   */
  async screenshot(name) {
    // 确保目录存在
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(EVIDENCE_DIR, filename);

    try {
      const image = await this.driver.takeScreenshot();
      fs.writeFileSync(filepath, image, 'base64');
      console.log(`[Browser] 截图保存: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[Browser] 截图失败:', error.message);
      return null;
    }
  }

  /**
   * 证据截图（用于任务执行）
   */
  async evidenceScreenshot(taskId, stage) {
    return await this.screenshot(`${taskId}_${stage}`);
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(timeout = 30000) {
    await this.driver.wait(async () => {
      const readyState = await this.executeScript('return document.readyState');
      return readyState === 'complete';
    }, timeout);
  }

  /**
   * 切换到 iframe
   */
  async switchToFrame(locator) {
    try {
      const frame = await this.driver.findElement(locator);
      await this.driver.switchTo().frame(frame);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 切换回主文档
   */
  async switchToDefaultContent() {
    await this.driver.switchTo().defaultContent();
  }

  /**
   * 辅助方法：等待
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 解析定位器字符串
   * 格式: "css:.class" 或 "xpath://div" 等
   */
  static parseLocator(locatorStr) {
    if (locatorStr.startsWith('css:')) {
      return By.css(locatorStr.slice(4));
    } else if (locatorStr.startsWith('xpath:')) {
      return By.xpath(locatorStr.slice(6));
    } else if (locatorStr.startsWith('id:')) {
      return By.id(locatorStr.slice(3));
    } else if (locatorStr.startsWith('name:')) {
      return By.name(locatorStr.slice(5));
    } else {
      // 默认当作 CSS
      return By.css(locatorStr);
    }
  }
}

/**
 * 创建浏览器控制器
 */
function createBrowserController(debuggingPort, coreVersion) {
  return new BrowserController(debuggingPort, coreVersion);
}

module.exports = {
  BrowserController,
  createBrowserController,
  EVIDENCE_DIR
};
