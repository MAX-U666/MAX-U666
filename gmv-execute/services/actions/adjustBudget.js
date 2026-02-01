/**
 * 操作：调整广告预算
 * adjust_budget
 */
const { By } = require('selenium-webdriver');

/**
 * 执行调整预算
 * 
 * @param {BrowserController} browser - 浏览器控制器
 * @param {Object} context - 执行上下文
 * @param {Object} context.payload - 操作参数
 * @param {string} context.payload.campaign_id - 广告计划ID
 * @param {number} context.payload.new_budget - 新预算金额
 * @param {string} context.payload.budget_type - 预算类型: daily/total
 * @param {Object} context.locators - 页面定位器
 * @param {Function} context.addLog - 日志记录函数
 */
async function execute(browser, context) {
  const { payload, locators, site, addLog } = context;
  const { campaign_id, campaign_name, new_budget, budget_type = 'daily' } = payload;

  if (!campaign_id && !campaign_name) {
    return { ok: false, error: '缺少广告计划ID或名称' };
  }

  if (!new_budget || new_budget <= 0) {
    return { ok: false, error: '无效的预算金额' };
  }

  const ads = locators;
  let oldBudget = null;

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
      // 如果没有精确匹配，使用第一个
      if (adRows.length === 1) {
        targetRow = adRows[0];
        await addLog(5, '匹配', 'warning', '未精确匹配，使用唯一的广告');
      } else {
        return { ok: false, error: '未找到匹配的广告' };
      }
    }

    // 步骤4：获取当前预算
    try {
      const budgetCell = await targetRow.findElement(By.css('.ad-budget, td:nth-child(5)'));
      oldBudget = await budgetCell.getText();
      await addLog(5, '读取', 'info', `当前预算: ${oldBudget}`);
    } catch {
      await addLog(5, '读取', 'warning', '无法读取当前预算');
    }

    // 步骤5：点击编辑按钮
    await addLog(6, '点击', 'info', '点击编辑预算');
    
    // 尝试找到编辑按钮
    const editBtn = await targetRow.findElement(
      By.css('button:has-text("Ubah"), button:has-text("Edit"), .edit-budget')
    ).catch(() => null);

    if (editBtn) {
      await editBtn.click();
    } else {
      // 尝试点击行内的更多操作
      const moreBtn = await targetRow.findElement(By.css('.more-actions, .dropdown-toggle')).catch(() => null);
      if (moreBtn) {
        await moreBtn.click();
        await browser.sleep(500);
        // 点击下拉菜单中的编辑预算
        await browser.waitAndClick(By.css('a:has-text("Ubah Anggaran"), a:has-text("Edit Budget")'));
      } else {
        return { ok: false, error: '找不到编辑按钮' };
      }
    }

    await browser.sleep(1000);

    // 步骤6：等待预算弹窗
    await addLog(7, '等待', 'info', '等待预算编辑弹窗');
    const modal = ads.budgetModal;
    
    const modalVisible = await browser.waitForElement(
      By.css(modal.container.replace('css:', '')),
      5000
    );

    if (!modalVisible) {
      return { ok: false, error: '预算编辑弹窗未出现' };
    }

    // 步骤7：选择预算类型
    if (budget_type === 'daily') {
      await browser.waitAndClick(By.css(modal.dailyBudgetOption.replace('css:', '')));
    } else {
      await browser.waitAndClick(By.css(modal.totalBudgetOption.replace('css:', '')));
    }
    await browser.sleep(300);

    // 步骤8：输入新预算
    await addLog(8, '输入', 'info', `输入新预算: ${new_budget}`);
    
    const budgetInput = await browser.waitForElement(
      By.css(modal.input.replace('css:', '')),
      3000
    );

    if (!budgetInput) {
      return { ok: false, error: '找不到预算输入框' };
    }

    // 清空并输入
    await browser.executeScript("arguments[0].value = '';", budgetInput);
    await browser.sleep(200);
    await budgetInput.sendKeys(new_budget.toString());

    // 触发 input 事件
    await browser.executeScript(
      "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
      budgetInput
    );

    await browser.sleep(500);

    // 步骤9：点击保存
    await addLog(9, '保存', 'info', '点击保存按钮');
    
    const saved = await browser.waitAndClick(
      By.css(modal.saveBtn.replace('css:', '')),
      5000
    );

    if (!saved) {
      return { ok: false, error: '保存按钮点击失败' };
    }

    // 步骤10：等待保存完成
    await browser.sleep(2000);

    // 检查是否有错误提示
    const errorToast = await browser.elementExists(
      By.css(ads.errorToast.replace('css:', ''))
    );

    if (errorToast) {
      const errorText = await browser.getText(By.css(ads.errorToast.replace('css:', '')));
      return { ok: false, error: `保存失败: ${errorText}` };
    }

    // 检查成功提示
    const successToast = await browser.elementExists(
      By.css(ads.successToast.replace('css:', ''))
    );

    await addLog(10, '完成', 'success', `预算已调整为 ${new_budget}`);

    return {
      ok: true,
      data: {
        campaign_id,
        campaign_name,
        old_budget: oldBudget,
        new_budget: new_budget,
        budget_type,
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
