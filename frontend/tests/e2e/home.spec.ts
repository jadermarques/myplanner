import { expect, test } from '@playwright/test'

test('home screen shows the "Inserir card" icon and the version', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Inserir card' })).toBeVisible()
  await expect(page.locator('footer')).toHaveText(/v\d+\.\d+\.\d+/)
})
