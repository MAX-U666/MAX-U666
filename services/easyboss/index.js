/**
 * EasyBoss 模块入口
 */

const { EasyBossAuth, getAuthInstance } = require('./auth');
const EasyBossFetcher = require('./fetch-ads');
const EasyBossScheduler = require('./scheduler');

module.exports = {
  EasyBossAuth,
  getAuthInstance,
  EasyBossFetcher,
  EasyBossScheduler
};
