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
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.11.0' } }))
  await page.route('**/api/boards/*/labels', (route) => route.fulfill({ json: labels }))
}

const twoLabels = [
  { name: 'Casa', color: 'green' },
  { name: 'Financeiro', color: 'orange_dark' },
]

async function mockCapture(page: Page): Promise<Record<string, unknown>[]> {
  const payloads: Record<string, unknown>[] = []
  await page.route('**/api/cards', async (route) => {
    payloads.push(route.request().postDataJSON())
    await route.fulfill({ status: 201, json: { card_id: 'c1' } })
  })
  return payloads
}

test('more than one label can be chosen, and all of them travel with the card (FR-005/SC-002)', async ({
  page,
}) => {
  await mockApp(page, { labels: twoLabels })
  const payloads = await mockCapture(page)

  await page.goto('/')

  await expect(page.getByRole('checkbox')).toHaveCount(2)
  await page.getByRole('checkbox', { name: 'Casa', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Financeiro', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Casa', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Financeiro', exact: true })).toBeChecked()

  await page.getByLabel('Título').fill('Revisão do carro')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payloads[0]).toMatchObject({ labels: ['Casa', 'Financeiro'] })
})

test('turning a label off keeps the others chosen (FR-001)', async ({ page }) => {
  await mockApp(page, { labels: twoLabels })
  const payloads = await mockCapture(page)

  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Casa', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Financeiro', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Casa', exact: true }).click()

  await expect(page.getByRole('checkbox', { name: 'Casa', exact: true })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Financeiro', exact: true })).toBeChecked()

  await page.getByLabel('Título').fill('Uma etiqueta só')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payloads[0]).toMatchObject({ labels: ['Financeiro'] })
})

test('"limpar" turns every label off at once (FR-003)', async ({ page }) => {
  await mockApp(page, { labels: twoLabels })
  const payloads = await mockCapture(page)

  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Casa', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Financeiro', exact: true }).click()
  await page.getByRole('button', { name: 'limpar' }).click()

  await expect(page.getByRole('checkbox', { name: 'Casa', exact: true })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Financeiro', exact: true })).not.toBeChecked()

  await page.getByLabel('Título').fill('Sem etiquetas')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payloads[0]).toMatchObject({ labels: null })
})

test('the label item disappears when the board has no labels to offer (FR-010)', async ({
  page,
}) => {
  await mockApp(page, { labels: [] })
  await mockCapture(page)

  await page.goto('/')
  await expect(page.getByRole('group', { name: 'Etiqueta' })).toHaveCount(0)

  await page.getByLabel('Título').fill('Sem etiquetas no board')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})

test('a failing labels request never blocks the capture (SC-003)', async ({ page }) => {
  await mockApp(page)
  await page.route('**/api/boards/*/labels', (route) =>
    route.fulfill({ status: 502, json: { detail: 'erro ao listar etiquetas' } }),
  )
  await mockCapture(page)

  await page.goto('/')
  await expect(page.getByRole('group', { name: 'Etiqueta' })).toHaveCount(0)

  await page.getByLabel('Título').fill('Sem etiquetas carregadas')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})

test('changing the board clears the labels chosen before (FR-009)', async ({ page }) => {
  await mockApp(page, { boards: [board, otherBoard] })

  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Casa', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Casa', exact: true })).toBeChecked()

  await page.getByLabel('Board').selectOption('b2')

  await expect(page.getByRole('checkbox', { name: 'Casa', exact: true })).not.toBeChecked()
})
