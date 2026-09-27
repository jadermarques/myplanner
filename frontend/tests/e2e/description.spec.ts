import { expect, test } from '@playwright/test'

const boards = [{ id: 'b1', name: 'Pessoal' }]

async function mockAuthenticatedApp(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) => route.fulfill({ json: boards }))
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.7.0' } }))
}

test('the simple card flow shows no description field (FR-009)', async ({ page }) => {
  await mockAuthenticatedApp(page)
  await page.goto('/')
  await expect(page.getByLabel('Título')).toBeVisible()
  await expect(page.getByLabel('Descrição')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'adicionar descrição' })).toBeVisible()
})

test('opening, typing and saving sends the description', async ({ page }) => {
  await mockAuthenticatedApp(page)
  let body: string | null = null
  await page.route('**/api/cards', (route) => {
    body = route.request().postData()
    return route.fulfill({ status: 201, json: { card_id: 'c1' } })
  })

  await page.goto('/')
  await page.getByLabel('Título').fill('Comprar leite')
  await page.getByRole('button', { name: 'adicionar descrição' }).click()
  await page.getByLabel('Descrição').fill('linha 1\nlinha 2')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page.getByRole('status')).toHaveText('Card criado!')
  expect(body).toContain('"description":"linha 1\\nlinha 2"')
  // depois do sucesso o campo volta recolhido
  await expect(page.getByLabel('Descrição')).toHaveCount(0)
})

test('above the limit the Save button is blocked and the text is kept', async ({ page }) => {
  await mockAuthenticatedApp(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'adicionar descrição' }).click()
  const long = 'x'.repeat(2001)
  await page.getByLabel('Descrição').fill(long)

  await expect(page.getByText('2001/2000')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  await expect(page.getByLabel('Descrição')).toHaveValue(long)
})
