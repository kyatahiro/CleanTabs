
import { browser, Tabs } from 'wxt/browser'
import { storage } from 'wxt/storage';
import { defineBackground } from 'wxt/sandbox';
import { sendMessage, onMessage } from 'webext-bridge/background'

import { FindMatchedRule, Rule } from '@/lib/rule';
import { AddToStash, GetSettings, GetRules, STORAGE_KEY_ENABLED, GetFlags, SetFlags, InitStorage } from '@/lib/storage';
import { StashItem } from '@/lib/stash';
import { NowHuman } from '@/lib/date';

export default defineBackground(() => {
  console.log('background.js starts...', { id: browser.runtime.id });

  const DefaultAlarmName = "default-alarm"
  checkAlarmState();

  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install') {
      return;
    }
    console.log('onInstalled...')
    await onInstall()
  })

  browser.alarms.onAlarm.addListener((alarm) => {
    console.log(NowHuman(), 'alarm fired:', alarm)
    cron();
  });

  onMessage('run-cron', async () => {
    console.log('manual cron...')
    await cron();
    return { ok: true }
  })

  async function onInstall() {
    await InitStorage()

    if (import.meta.env.MODE === 'development') {
      cron();
    }
  }

  async function cron() {
    // - get rules
    // - loop over tabs
    //   - find matching rule
    //   - run action

    await clearFlags()

    const enabled_ = await enabled()
    if (!enabled_) {
      console.log('Extension disabled, abort...')
      return
    }

    const settings = await GetSettings()
    console.log('settings:', settings)

    const flags = await GetFlags()
    console.log('flag:', flags)

    const rules = await GetRules();
    console.log('rules:', rules)

    const tabs = await browser.tabs.query({})
    for (const tab of tabs) {
      if (!(tab.id) || !(tab.url)) {
        console.log('tab has no id or url')
        continue
      }

      const url = tab.url;
      console.log('tab url:', url)

      if (tab.active) {
        console.log('tab is active, skip...')
        continue
      }

      const flag = flags.find((f) => f.id === tab.id)
      if (flag?.always_keep) {
        console.log('flag always_keep=true, skip...')
        continue
      }

      if (!tab.lastAccessed) {
        console.log('tab.lastAccessed undefined')
        continue
      }

      const inactiveMinutes = (Date.now() - tab.lastAccessed) / 1000 / 60
      const rule = FindMatchedRule(rules, url, inactiveMinutes)
      if (!rule) {
        console.log('no matching rule')
        continue
      }
      console.log('matching rule:', rule)

      // execute matching rule
      await executeRule(rule, tab)
    }

    sendMessage('cron:done', {}, 'popup')
  }

  async function checkAlarmState() {
    console.log('checking alarm state')
    const alarm = await browser.alarms.get(DefaultAlarmName);
    if (!alarm) {
      console.log('creating alarm')
      browser.alarms.create(DefaultAlarmName, { periodInMinutes: 1 });
      return
    }
    console.log('alarm created already')
  }

  async function clearFlags() {
    const flags = await GetFlags()
    console.log('flags before:', flags)
    const tabs = await browser.tabs.query({})
    const aliveFlags = flags.filter((f) => !!tabs.find((t) => f.id === t.id))
    console.log('flags after:', aliveFlags)
    await SetFlags(aliveFlags)
  }

  async function executeRule(rule: Rule, tab: Tabs.Tab) {
    if (rule.action === 'discard') {
      discardTab(tab)
    } else if (rule.action === 'close') {
      await closeTab(tab, { toStash: rule.to_stash })
    } else {
      console.log('action=nop')
    }
  }

  function discardTab(tab: Tabs.Tab) {
    if (tab.discarded) {
      console.log('discarded')
      return
    }

    if (tab.id) {
      console.log('try to discard tab:', tab)
      browser.tabs.discard(tab.id)
    }
  }

  async function closeTab(tab: Tabs.Tab, options?: { toStash?: boolean }) {
    if (tab.id) {
      const settings = await GetSettings();
      if (!settings.CloseTabInGroup && tab.groupId !== -1) {
        console.log(`CloseTabInGroup=false, groupId=${tab.groupId}, skip...`)
        return
      }
      if (!settings.ClosePinTab && tab.pinned) {
        console.log('ClosePinTab=false, skip...')
        return
      }

      if (options?.toStash) {
        await addToInbox(tab)
      }
      console.log('try to close tab:', tab)
      browser.tabs.remove(tab.id)
    }
  }

  async function enabled(): Promise<boolean> {
    const b = await storage.getItem(STORAGE_KEY_ENABLED)
    return b === true
  }

  async function addToInbox(tab: Tabs.Tab) {
    if (!tab.url || !tab.favIconUrl || !tab.title) {
      return
    }
    console.log('add to inbox')
    const item: StashItem = {
      url: tab.url,
      favicon_url: tab.favIconUrl,
      title: tab.title,
      last_ts: new Date().getTime(),
      count: 1,
    }

    await AddToStash(item)
  }



  // init();
  // storage.removeItems([STORAGE_KEY_RULES])
});
