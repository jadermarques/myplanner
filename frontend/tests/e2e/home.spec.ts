import { expect, test } from '@playwright/test'

test('home screen shows the "Inserir card" heading and the version', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.3.0' } }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Inserir card' })).toBeVisible()
  await expect(page.getByLabel('Título')).toBeVisible()
  await expect(page.locator('footer')).toHaveText(/v\d+\.\d+\.\d+/)
})


