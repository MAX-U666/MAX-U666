/**
 * 操作：修改商品标题
 * update_title
 */
const { By, Key } = require('selenium-webdriver');

/**
 * 执行修改商品标题
 * 
 * @param {BrowserController} browser - 浏览器控制器
 * @param {Object} context - 执行上下文
 * @param {Object} context.payload - 操作参数
 * @param {string} context.payload.product_id - 商品ID (SKU)
 * @param {string} context.payload.product_name - 商品名称（用于搜索）
 * @param {string} context.payload.new_title - 新标题
 */
async function execute(browser, context) {
  const { payload, locators, addLog } = context;
  const { product_id, product_name, new_title } = payload;

  if (!product_id && !product_name) {
    return { ok: false, error: '缺少商品ID或名称' };
  }

  if (!new_title || new_title.trim().length === 0) {
    return { ok: false, error: '新标题不能为空' };
  }

  const { list: productList, edit: productEdit } = locators;
  let oldTitle = null;

  try {
    // 步骤1：导航到商品列表
    await addLog(2, '导航', 'info', '打开商品管理页面');
    await browser.navigate(productList.listUrl, 3);

    // 步骤2：等待页面加载
    await addLog(3, '等待', 'info', '等待商品列表加载');
    await browser.sleep(2000);

    // 步骤3：搜索商品
    await addLog(4, '搜索', 'info', `搜索商品: ${product_name || product_id}`);
    
    const searchInput = By.css(productList.searchInput.replace('css:', ''));
    
    if (await browser.elementExists(searchInput)) {
      await browser.sendKeys(searchInput, product_name || product_id, true);
      await browser.sleep(500);
      
      // 按回车搜索
      const inputElement = await browser.driver.findElement(searchInput);
      await inputElement.sendKeys(Key.RETURN);
      
      await browser.sleep(2000);
    }

    // 步骤4：查找商品
    await addLog(5, '查找', 'info', '查找目标商品');
    
    const productRows = await browser.driver.findElements(
      By.css(productList.productRow.replace('css:', ''))
    );

    if (productRows.length === 0) {
      return { ok: false, error: '未找到任何商品' };
    }

    // 找到目标商品行
    let targetRow = null;
    for (const row of productRows) {
      const rowText = await row.getText();
      if (product_id && rowText.includes(product_id)) {
        targetRow = row;
        break;
      }
      if (product_name && rowText.toLowerCase().includes(product_name.toLowerCase())) {
        targetRow = row;
        break;
      }
    }

    if (!targetRow) {
      if (productRows.length === 1) {
        targetRow = productRows[0];
        await addLog(6, '匹配', 'warning', '未精确匹配，使用唯一的商品');
      } else {
        return { ok: false, error: `未找到商品: ${product_name || product_id}` };
      }
    }

    // 步骤5：获取当前标题
    try {
      const nameCell = await targetRow.findElement(
        By.css(productList.productName.replace('css:', ''))
      );
      oldTitle = await nameCell.getText();
      await addLog(6, '读取', 'info', `当前标题: ${oldTitle.substring(0, 50)}...`);
    } catch {
      await addLog(6, '读取', 'warning', '无法读取当前标题');
    }

    // 步骤6：点击编辑按钮
    await addLog(7, '点击', 'info', '点击编辑按钮');
    
    const editBtn = await targetRow.findElement(
      By.css(productList.editBtn.replace('css:', ''))
    ).catch(() => null);

    if (editBtn) {
      await editBtn.click();
    } else {
      // 尝试点击商品名称进入编辑
      const nameLink = await targetRow.findElement(
        By.css('a, .product-name')
      ).catch(() => null);
      
      if (nameLink) {
        await nameLink.click();
      } else {
        return { ok: false, error: '找不到编辑入口' };
      }
    }

    await browser.sleep(2000);

    // 步骤7：等待编辑页面加载
    await addLog(8, '等待', 'info', '等待编辑页面加载');
    
    const titleInput = await browser.waitForElement(
      By.css(productEdit.titleInput.replace('css:', '')),
      10000
    );

    if (!titleInput) {
      return { ok: false, error: '编辑页面加载失败，找不到标题输入框' };
    }

    // 步骤8：滚动到标题输入框
    await browser.scrollToElement(By.css(productEdit.titleInput.replace('css:', '')));
    await browser.sleep(500);

    // 步骤9：修改标题
    await addLog(9, '输入', 'info', `输入新标题: ${new_title.substring(0, 50)}...`);
    
    // 清空原有内容
    await browser.executeScript("arguments[0].value = '';", titleInput);
    await browser.sleep(200);
    
    // 输入新标题
    await titleInput.sendKeys(new_title);
    
    // 触发事件
    await browser.executeScript(
      "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
      titleInput
    );
    await browser.executeScript(
      "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      titleInput
    );

    await browser.sleep(500);

    // 步骤10：保存
    await addLog(10, '保存', 'info', '点击保存按钮');
    
    // 滚动到页面底部
    await browser.scrollToBottom();
    await browser.sleep(500);

    const saveBtn = By.css(productEdit.saveBtn.replace('css:', ''));
    const saved = await browser.waitAndClick(saveBtn, 10000);

    if (!saved) {
      return { ok: false, error: '保存按钮点击失败' };
    }

    // 步骤11：等待保存完成
    await browser.sleep(3000);

    // 检查错误提示
    const errorToast = await browser.elementExists(
      By.css(productEdit.errorToast.replace('css:', ''))
    );

    if (errorToast) {
      const errorText = await browser.getText(By.css(productEdit.errorToast.replace('css:', '')));
      return { ok: false, error: `保存失败: ${errorText}` };
    }

    // 检查成功提示
    const successToast = await browser.elementExists(
      By.css(productEdit.successToast.replace('css:', ''))
    );

    await addLog(11, '完成', 'success', '标题修改成功');

    return {
      ok: true,
      data: {
        product_id,
        product_name,
        old_title: oldTitle,
        new_title: new_title,
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
