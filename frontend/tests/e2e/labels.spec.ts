import { expect, test, type Page } from '@playwright/test'

const board = { id: 'b1', name: 'Pessoal' }
const otherBoard = { id: 'b2', name: 'Trabalho' }

async function mockApp(
  page: Page,
  { boards = [board], labels = [{ name: 'Casa', color: 'green' }] } = {},
) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) => route.fulfill({ json: boards }))
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.9.0' } }))
  await page.route('**/api/boards/*/labels', (route) => route.fulfill({ json: labels }))
}

test('a label is chosen with a single tap and travels with the card (FR-003/SC-001)', async ({
  page,
}) => {
  await mockApp(page, {
    labels: [
      { name: 'Casa', color: 'green' },
      { name: 'Financeiro', color: 'orange_dark' },
    ],
  })
  let payload: Record<string, unknown> | null = null
  await page.route('**/api/cards', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { card_id: 'c1' } })
  })

  await page.goto('/')
  // 6 prioridades + "Sem etiqueta" + as 2 etiquetas do board
  await expect(page.getByRole('radio')).toHaveCount(9)

  await page.getByRole('radio', { name: 'Casa', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Casa', exact: true })).toBeChecked()

  await page.getByLabel('Título').fill('Revisão do carro')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payload).toMatchObject({ title: 'Revisão do carro', label: 'Casa' })
})

test('the label item disappears when the board has no labels to offer (FR-008)', async ({
  page,
}) => {
  await mockApp(page, { labels: [] })
  await page.route('**/api/cards', (route) => route.fulfill({ status: 201, json: { card_id: 'c1' } }))

  await page.goto('/')
  await expect(page.getByRole('radiogroup', { name: 'Etiqueta' })).toHaveCount(0)

  await page.getByLabel('Título').fill('Sem etiqueta')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})

test('a failing labels request never blocks the capture (SC-003)', async ({ page }) => {
  await mockApp(page)
  await page.route('**/api/boards/*/labels', (route) =>
    route.fulfill({ status: 502, json: { detail: 'erro ao listar etiquetas' } }),
  )
  await page.route('**/api/cards', (route) => route.fulfill({ status: 201, json: { card_id: 'c1' } }))

  await page.goto('/')
  await expect(page.getByRole('radiogroup', { name: 'Etiqueta' })).toHaveCount(0)

  await page.getByLabel('Título').fill('Sem etiquetas carregadas')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})

test('changing the board clears the label chosen before (SC-005)', async ({ page }) => {
  await mockApp(page, { boards: [board, otherBoard] })

  await page.goto('/')
  await page.getByRole('radio', { name: 'Casa', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Casa', exact: true })).toBeChecked()

  await page.getByLabel('Board').selectOption('b2')

  await expect(page.getByRole('radio', { name: 'Sem etiqueta' })).toBeChecked()
})
