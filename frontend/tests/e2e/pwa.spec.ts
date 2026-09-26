import { expect, test } from '@playwright/test'

test('PWA manifest is served and describes a standalone app', async ({ page }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const manifestResponse = await page.request.get(href!)
  expect(manifestResponse.ok()).toBe(true)

  const manifest = await manifestResponse.json()
  expect(manifest.name).toBe('MyPlanner')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThan(0)
})
