import { expect, test, type Page } from '@playwright/test'

async function mockApp(page: Page) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.14.0' } }))
  await page.route('**/api/boards/*/labels', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/boards/*/lists', (route) => route.fulfill({ json: [] }))
}

test('a descrição recolhida mostra o resumo e reabre intacta (FR-002/FR-004)', async ({ page }) => {
  await mockApp(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'adicionar descrição' }).click()
  await page.getByLabel('Descrição').fill('linha 1\nlinha 2 com mais texto')
  await page.getByRole('button', { name: 'voltar' }).click()

  const summary = page.getByRole('button', { name: /linha 1/ })
  await expect(summary).toBeVisible()

  await summary.click()
  await expect(page.getByLabel('Descrição')).toHaveValue('linha 1\nlinha 2 com mais texto')
})

test('salvar pede confirmação e só cria após confirmar (FR-006/FR-007)', async ({ page }) => {
  await mockApp(page)
  let calls = 0
  await page.route('**/api/cards', async (route) => {
    calls += 1
    await route.fulfill({ status: 201, json: { card_id: 'c1' } })
  })

  await page.goto('/')
  await page.getByLabel('Título').fill('Revisão do carro')
  await page.getByRole('button', { name: 'Salvar' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('Revisão do carro')
  await expect(page.getByRole('dialog')).toContainText('Pessoal')
  expect(calls).toBe(0)

  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(calls).toBe(0)

  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
  expect(calls).toBe(1)
})

test('os novos controles têm alvo de 48px e o resumo clampa em 2 linhas (SC-001/FR-002)', async ({
  page,
}) => {
  await mockApp(page)
  await page.goto('/')

  const openBox = await page.getByRole('button', { name: 'adicionar descrição' }).boundingBox()
  expect(openBox!.height).toBeGreaterThanOrEqual(48)

  await page.getByRole('button', { name: 'adicionar descrição' }).click()
  const voltarBox = await page.getByRole('button', { name: 'voltar' }).boundingBox()
  expect(voltarBox!.height).toBeGreaterThanOrEqual(48)

  await page.getByLabel('Descrição').fill('linha 1\nlinha 2\nlinha 3\nlinha 4')
  await page.getByRole('button', { name: 'voltar' }).click()

  const clamp = await page.getByRole('button', { name: /linha 1/ }).evaluate((el) => {
    const span = el.querySelector('.desc-summary__text')
    return span ? getComputedStyle(span).webkitLineClamp : '0'
  })
  expect(clamp).toBe('2')
})
