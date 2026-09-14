import { expect, test } from 'vitest'
import { FindMatchedRule, Rule } from './rule'

const stagedRules: Rule[] = [
  { url_pattern: '*', inactive_minutes: 60, action: 'close' },
  { url_pattern: '*', inactive_minutes: 15, action: 'discard' },
]

test('selects a lower-priority rule when earlier matching rules are not inactive long enough', () => {
  expect(FindMatchedRule(stagedRules, 'https://example.com', 20)).toMatchObject({
    index: 1,
    action: 'discard',
  })
})

test('selects the first eligible rule for a staged action', () => {
  expect(FindMatchedRule(stagedRules, 'https://example.com', 61)).toMatchObject({
    index: 0,
    action: 'close',
  })
})

test('keeps an earlier eligible nop rule as an exclusion', () => {
  const rules: Rule[] = [
    { url_pattern: '*://mail.example.com/*', inactive_minutes: 1, action: 'nop' },
    { url_pattern: '*', inactive_minutes: 15, action: 'discard' },
  ]

  expect(FindMatchedRule(rules, 'https://mail.example.com/inbox', 20)).toMatchObject({
    index: 0,
    action: 'nop',
  })
})
