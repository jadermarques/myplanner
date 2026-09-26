import { expect, test } from '@playwright/test'

test('login shows the TOTP field when the device is not registered', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: false, device_registered: false } }),
  )
  await page.goto('/')
  await expect(page.getByLabel('Código TOTP')).toBeVisible()
})

test('device list shows registered devices', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true, device_registered: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.5.0' } }))
  await page.route('**/api/devices', (route) =>
    route.fulfill({
      json: [{ id: 'd1', name: 'Chrome no Android', created_at: 'c', last_used_at: 'l' }],
    }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Aparelhos' }).click()
  await expect(page.getByText('Chrome no Android')).toBeVisible()
})
