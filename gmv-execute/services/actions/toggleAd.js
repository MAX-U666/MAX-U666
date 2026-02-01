/**
 * 操作：开/关广告
 * toggle_ad
 */
const { By } = require('selenium-webdriver');

/**
 * 执行开关广告
 * 
 * @param {BrowserController} browser - 浏览器控制器
 * @param {Object} context - 执行上下文
 * @param {Object} context.payload - 操作参数
 * @param {string} context.payload.campaign_id - 广告计划ID
 * @param {string} context.payload.campaign_name - 广告计划名称
 * @param {boolean} context.payload.enable - true=开启, false=关闭
 */
async function execute(browser, context) {
  const { payload, locators, addLog } = context;
  const { campaign_id, campaign_name, enable } = payload;

  if (!campaign_id && !campaign_name) {
    return { ok: false, error: '缺少广告计划ID或名称' };
  }

  if (typeof enable !== 'boolean') {
    return { ok: false, error: '缺少 enable 参数（true/false）' };
  }

  const ads = locators;
  let oldStatus = null;

  try {
    // 步骤1：导航到广告列表
    await addLog(2, '导航', 'info', '打开广告管理页面');
    await browser.navigate(ads.listUrl, 3);

    // 步骤2：等待页面加载
    await addLog(3, '等待', 'info', '等待广告列表加载');
    await browser.sleep(2000);

    // 步骤3：查找目标广告
    await addLog(4, '查找', 'info', `查找广告: ${campaign_name || campaign_id}`);
    
    // 如果有广告名称，先搜索
    if (campaign_name) {
      const searchInput = By.css('input[placeholder*="Cari"], input[placeholder*="Search"]');
      if (await browser.elementExists(searchInput)) {
        await browser.sendKeys(searchInput, campaign_name);
        await browser.sleep(1500);
      }
    }

    // 查找广告行
    const adRows = await browser.driver.findElements(By.css(ads.adRow.replace('css:', '')));
    
    if (adRows.length === 0) {
      return { ok: false, error: '未找到任何广告' };
    }

    // 找到目标广告行
    let targetRow = null;
    for (const row of adRows) {
      const rowText = await row.getText();
      if (campaign_id && rowText.includes(campaign_id)) {
        targetRow = row;
        break;
      }
      if (campaign_name && rowText.includes(campaign_name)) {
        targetRow = row;
        break;
      }
    }

    if (!targetRow) {
      if (adRows.length === 1) {
        targetRow = adRows[0];
        await addLog(5, '匹配', 'warning', '未精确匹配，使用唯一的广告');
      } else {
        return { ok: false, error: '未找到匹配的广告' };
      }
    }

    // 步骤4：检查当前状态
    try {
      const statusCell = await targetRow.findElement(By.css('.ad-status, td:nth-child(2)'));
      oldStatus = await statusCell.getText();
      await addLog(5, '读取', 'info', `当前状态: ${oldStatus}`);
      
      // 判断当前是否已经是目标状态
      const isCurrentlyEnabled = oldStatus.toLowerCase().includes('aktif') || 
                                  oldStatus.toLowerCase().includes('active') ||
                                  oldStatus.toLowerCase().includes('开启');
      
      if (isCurrentlyEnabled === enable) {
        await addLog(6, '跳过', 'info', `广告已经是${enable ? '开启' : '关闭'}状态`);
        return {
          ok: true,
          data: {
            campaign_id,
            campaign_name,
            old_status: oldStatus,
            new_status: oldStatus,
            skipped: true,
            message: '状态无需更改',
          },
        };
      }
    } catch {
      await addLog(5, '读取', 'warning', '无法读取当前状态');
    }

    // 步骤5：点击开关按钮
    await addLog(6, '点击', 'info', `${enable ? '开启' : '关闭'}广告`);
    
    // 尝试找到开关按钮
    const toggleBtn = await targetRow.findElement(
      By.css('.toggle-switch, input[type="checkbox"], button[data-testid="toggle"]')
    ).catch(() => null);

    if (toggleBtn) {
      await toggleBtn.click();
    } else {
      // 尝试点击行内的更多操作
      const moreBtn = await targetRow.findElement(By.css('.more-actions, .dropdown-toggle')).catch(() => null);
      if (moreBtn) {
        await moreBtn.click();
        await browser.sleep(500);
        // 点击下拉菜单中的开关选项
        const actionText = enable ? 'Aktifkan' : 'Nonaktifkan';
        await browser.waitAndClick(By.css(`a:has-text("${actionText}")`));
      } else {
        return { ok: false, error: '找不到开关按钮' };
      }
    }

    await browser.sleep(1000);

    // 步骤6：处理确认弹窗（如果有）
    const confirmModal = await browser.elementExists(
      By.css(ads.toggleConfirm.modal.replace('css:', ''))
    );

    if (confirmModal) {
      await addLog(7, '确认', 'info', '点击确认按钮');
      await browser.waitAndClick(
        By.css(ads.toggleConfirm.confirmBtn.replace('css:', '')),
        5000
      );
      await browser.sleep(1000);
    }

    // 步骤7：等待操作完成
    await browser.sleep(2000);

    // 检查是否有错误提示
    const errorToast = await browser.elementExists(
      By.css(ads.errorToast.replace('css:', ''))
    );

    if (errorToast) {
      const errorText = await browser.getText(By.css(ads.errorToast.replace('css:', '')));
      return { ok: false, error: `操作失败: ${errorText}` };
    }

    // 步骤8：验证状态变更
    let newStatus = null;
    try {
      // 重新获取状态
      await browser.sleep(1000);
      const statusCell = await targetRow.findElement(By.css('.ad-status, td:nth-child(2)'));
      newStatus = await statusCell.getText();
    } catch {
      newStatus = enable ? '已开启' : '已关闭';
    }

    await addLog(8, '完成', 'success', `广告已${enable ? '开启' : '关闭'}`);

    return {
      ok: true,
      data: {
        campaign_id,
        campaign_name,
        old_status: oldStatus,
        new_status: newStatus,
        enabled: enable,
      },
    };

  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

module.exports = { execute };
