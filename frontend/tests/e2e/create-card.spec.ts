import { expect, test } from '@playwright/test'

test('shows validation error for empty title', async ({ page }) => {
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.2.0' } }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('alert')).toHaveText('O título é obrigatório.')
})

test('creates a card and shows success', async ({ page }) => {
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.2.0' } }))
  await page.route('**/api/cards', (route) => route.fulfill({ json: { card_id: 'card-1' } }))
  await page.goto('/')
  await page.getByLabel('Título').fill('Comprar leite')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})
