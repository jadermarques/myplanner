import { expect, test, type Page } from '@playwright/test'

const PRIORITY = {
  id: 'cf-prior',
  name: 'Prioridade',
  type: 'list',
  options: [
    { id: 'opt-alta', value: 'Alta', color: 'orange' },
    { id: 'opt-media', value: 'Média', color: 'yellow' },
  ],
}

async function mockApp(page: Page, { customFields = [PRIORITY] } = {}) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.15.0' } }))
  await page.route('**/api/boards/*/customFields', (route) =>
    route.fulfill({ json: customFields }),
  )
  await page.route('**/api/boards/*/labels', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/boards/*/lists', (route) =>
    route.fulfill({ json: [{ id: 'l1', name: 'A fazer' }] }),
  )
}

test('custom fields are rendered by type and travel with the card (FR-006/SC-002)', async ({
  page,
}) => {
  await mockApp(page, {
    customFields: [
      PRIORITY,
      { id: 'cf-text', name: 'Texto', type: 'text', options: [] },
      { id: 'cf-check', name: 'Cartão sem relevância', type: 'checkbox', options: [] },
    ],
  })
  let payload: Record<string, unknown> | null = null
  await page.route('**/api/cards', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { card_id: 'c1', unapplied: [] } })
  })

  await page.goto('/')
  await page.getByLabel('Título').fill('Revisão do carro')
  await page.getByLabel('Prioridade').selectOption('Alta')
  await page.getByLabel('Texto').fill('oi')
  await page.getByRole('checkbox', { name: 'Cartão sem relevância' }).click()

  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payload).toMatchObject({
    priority: 'Alta',
    custom_fields: [
      { field_id: 'cf-text', value: 'oi' },
      { field_id: 'cf-check', value: 'true' },
    ],
  })
})

test('a due date enables the reminder, and clearing the date removes it (014/FR-005/FR-009)', async ({
  page,
}) => {
  await mockApp(page)
  let payload: Record<string, unknown> | null = null
  await page.route('**/api/cards', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { card_id: 'c1', unapplied: [] } })
  })

  await page.goto('/')
  await page.getByLabel('Título').fill('Comprar leite')

  await expect(page.getByRole('checkbox', { name: 'Definir lembrete' })).toHaveCount(0)
  await page.getByLabel('Data de entrega').fill('2026-09-28T10:30')
  await page.getByRole('checkbox', { name: 'Definir lembrete' }).click()
  await page.getByLabel('Quando lembrar').selectOption('5')

  await page.getByRole('button', { name: 'limpar data' }).click()
  await expect(page.getByRole('checkbox', { name: 'Definir lembrete' })).toHaveCount(0)

  await page.getByLabel('Data de entrega').fill('2026-09-28T10:30')
  await page.getByRole('checkbox', { name: 'Definir lembrete' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status')).toHaveText('Card criado!')

  expect(payload).toMatchObject({ due: '2026-09-28T10:30', due_reminder: 5 })
})
