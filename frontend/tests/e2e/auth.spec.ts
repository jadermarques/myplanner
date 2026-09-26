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

// Regression: the set-password form used to call the React state setter (same
// name as the API function), so no request was sent (bug found 2026-09-25).
test('first access: submitting the set-password form creates a session', async ({ page }) => {
  let passwordSet = false
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: passwordSet, authenticated: passwordSet } }),
  )
  let posted = false
  await page.route('**/api/auth/set-password', (route) => {
    posted = true
    passwordSet = true
    return route.fulfill({ json: {} })
  })
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.4.1' } }))

  await page.goto('/')
  await page.getByLabel('Nova senha').fill('senha123')
  await page.getByLabel('Confirmar senha').fill('senha123')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect.poll(() => posted, { timeout: 3000 }).toBe(true)
  await expect(page.getByRole('heading', { name: 'Inserir card' })).toBeVisible()
})


