import { expect, test } from '@playwright/test'

test('shows "Definir senha" when no password is set', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: false, authenticated: false } }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Definir senha' })).toBeVisible()
  await expect(page.getByLabel('Nova senha')).toBeVisible()
})

test('shows "Entrar" when a password is set but not authenticated', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: false } }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
})

test('login submits the password', async ({ page }) => {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: false } }),
  )
  let called = false
  await page.route('**/api/auth/login', (route) => {
    called = true
    return route.fulfill({ json: {} })
  })
  await page.goto('/')
  await page.getByLabel('Senha').fill('senha123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect.poll(() => called, { timeout: 3000 }).toBe(true)
})

