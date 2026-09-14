import { expect, test } from 'vitest'
import { IsTabAudible } from './tab'

test('identifies tabs that are producing audio', () => {
  expect(IsTabAudible({ audible: true })).toBe(true)
})

test('does not protect tabs without an audible signal', () => {
  expect(IsTabAudible({ audible: false })).toBe(false)
  expect(IsTabAudible({})).toBe(false)
})
