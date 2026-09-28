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

test('a caixa de seleção mostra o estado marcado no próprio chip (013)', async ({ page }) => {
  // Regressão: o input fica invisível dentro do chip; sem um estado visual o toque não muda nada na
  // tela e o campo parece não funcionar (visto no SESA com "Cartão sem relevância").
  await mockApp(page, {
    customFields: [{ id: 'cf-check', name: 'Cartão sem relevância', type: 'checkbox', options: [] }],
  })
  await page.goto('/')

  const chip = page.locator('label.chip', { hasText: 'Cartão sem relevância' })
  const before = await chip.evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.getByRole('checkbox', { name: 'Cartão sem relevância' }).click()
  const after = await chip.evaluate((el) => getComputedStyle(el).backgroundColor)

  expect(after).not.toBe(before)
  await expect(page.getByRole('checkbox', { name: 'Cartão sem relevância' })).toBeChecked()

  // e o nome do campo aparece uma vez só (o chip é o rótulo; não há segundo rótulo acima)
  await expect(page.getByText('Cartão sem relevância')).toHaveCount(1)
})

test('a captura não estoura a largura da tela, com os campos de data presentes (013/014)', async ({
  page,
}) => {
  // Regressão: no celular os controles nativos de data cresciam além do cartão (visto no SESA com
  // "Data de entrega" e "Cobrar em"). Os campos de data ficam presos ao tamanho do cartão.
  await mockApp(page, {
    customFields: [PRIORITY, { id: 'cf-date', name: 'Cobrar em', type: 'date', options: [] }],
  })
  await page.goto('/')
  await page.getByLabel('Data de entrega').fill('2026-09-28T10:30')
  await page.getByLabel('Cobrar em').fill('2026-09-28')

  const minWidths = await page
    .locator('input[type="date"], input[type="datetime-local"]')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).minWidth))
  expect(minWidths.length).toBe(2)
  for (const minWidth of minWidths) expect(minWidth).toBe('0px')

  for (const width of [320, 360, 393]) {
    await page.setViewportSize({ width, height: 800 })
    const overflowing = await page.evaluate(() => {
      const vw = window.innerWidth
      const bad: string[] = []
      for (const el of Array.from(
        document.querySelectorAll('input, select, textarea, button, label'),
      )) {
        const rect = el.getBoundingClientRect()
        if (rect.right > vw + 1 || rect.left < -1) {
          bad.push(`${el.tagName}${el.id ? '#' + el.id : ''} passa de ${vw}px`)
        }
      }
      return bad
    })
    expect(overflowing, `largura ${width}px`).toEqual([])
  }
})
