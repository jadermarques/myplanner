import { expect, test, type Page } from '@playwright/test'

const lists = [
  { id: 'list-1', name: 'A fazer' },
  { id: 'list-2', name: 'Em andamento' },
]

async function mockApp(page: Page, { boardLists = lists } = {}) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.10.0' } }))
  await page.route('**/api/boards/*/labels', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/boards/*/lists', (route) => route.fulfill({ json: boardLists }))
}

test('the destination list defaults to the first list of the board (FR-002/SC-001)', async ({
  page,
}) => {
  await mockApp(page)
  await page.goto('/')
  await expect(page.getByLabel('Lista de destino')).toHaveValue('list-1')
})

test('the chosen list is used when the card is created (FR-006)', async ({ page }) => {
  await mockApp(page)
  let payload: Record<string, unknown> | null = null
  await page.route('**/api/cards', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { card_id: 'c1', unapplied: [] } })
  })

  await page.goto('/')
  await page.getByLabel('Lista de destino').selectOption('list-2')
  await page.getByLabel('Título').fill('Revisão do carro')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payload).toMatchObject({ title: 'Revisão do carro', list_id: 'list-2' })
})

test('saving without touching the field keeps the current payload (SC-002)', async ({ page }) => {
  await mockApp(page)
  let payload: Record<string, unknown> | null = null
  await page.route('**/api/cards', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { card_id: 'c1', unapplied: [] } })
  })

  await page.goto('/')
  await page.getByLabel('Título').fill('Sem escolher lista')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  // o padrão é a primeira lista do board, decidida pelo servidor
  expect(payload).toMatchObject({ list_id: 'list-1' })
})

test('a failing lists request hides the field and never blocks the capture (SC-004)', async ({
  page,
}) => {
  await mockApp(page)
  await page.route('**/api/boards/*/lists', (route) =>
    route.fulfill({ status: 502, json: { detail: 'erro ao listar listas' } }),
  )
  await page.route('**/api/cards', (route) => route.fulfill({ status: 201, json: { card_id: 'c1', unapplied: [] } }))

  await page.goto('/')
  await expect(page.getByLabel('Lista de destino')).toHaveCount(0)

  await page.getByLabel('Título').fill('Listas fora do ar')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')
})

test('a board with a single list offers only it (Edge Case)', async ({ page }) => {
  await mockApp(page, { boardLists: [{ id: 'only-1', name: 'Entrada' }] })
  await page.goto('/')
  await expect(page.getByLabel('Lista de destino')).toHaveValue('only-1')
  await expect(page.getByLabel('Lista de destino').getByRole('option')).toHaveCount(1)
})
