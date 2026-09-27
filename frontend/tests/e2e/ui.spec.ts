import { expect, test } from '@playwright/test'

async function mockApp(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/status', (route) =>
    route.fulfill({ json: { password_set: true, authenticated: true } }),
  )
  await page.route('**/api/boards', (route) =>
    route.fulfill({ json: [{ id: 'b1', name: 'Pessoal' }] }),
  )
  await page.route('**/api/version', (route) => route.fulfill({ json: { version: '0.8.0' } }))
  await page.route('**/api/boards/*/customFields', (route) =>
    route.fulfill({
      json: [
        {
          id: 'cf-prior',
          name: 'Prioridade',
          type: 'list',
          options: [
            { id: 'opt-alta', value: 'Alta', color: 'orange' },
            { id: 'opt-media', value: 'Média', color: 'yellow' },
            { id: 'opt-baixa', value: 'Baixa', color: 'sky' },
          ],
        },
      ],
    }),
  )
}

test('the title field is ready for typing as soon as the capture screen opens (FR-001)', async ({
  page,
}) => {
  await mockApp(page)
  await page.goto('/')
  await expect(page.getByLabel('Título')).toBeFocused()
})

test('a priority is chosen from a single-choice combobox (FR-001)', async ({ page }) => {
  await mockApp(page)
  await page.goto('/')

  const select = page.getByLabel('Prioridade')
  await expect(select).toBeVisible()
  const options = await select.locator('option').allTextContents()
  expect(options).toEqual(['', 'Alta', 'Média', 'Baixa']) // sem "Sem prioridade"

  await select.selectOption('Alta')
  await expect(select).toHaveValue('Alta')
})

test('the primary controls honour the 48px touch target (FR-003)', async ({ page }) => {
  await mockApp(page)
  await page.goto('/')

  const targets = [
    { name: 'Título', locator: page.getByLabel('Título') },
    { name: 'Board', locator: page.getByLabel('Board') },
    { name: 'Prioridade', locator: page.getByLabel('Prioridade') },
    { name: 'adicionar descrição', locator: page.getByRole('button', { name: 'adicionar descrição' }) },
    { name: 'Salvar', locator: page.getByRole('button', { name: 'Salvar' }) },
    { name: 'menu', locator: page.getByRole('button', { name: 'Mais opções' }) },
  ]

  for (const target of targets) {
    const box = await target.locator.boundingBox()
    expect(box, `alvo de toque de "${target.name}"`).not.toBeNull()
    expect(box!.height, `altura do alvo de "${target.name}"`).toBeGreaterThanOrEqual(48)
  }
})

test('the action bar stays reachable with a long description open (FR-002)', async ({ page }) => {
  await mockApp(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'adicionar descrição' }).click()
  await page.getByLabel('Descrição').fill(`${'linha de contexto\n'.repeat(30)}fim`)

  await expect(page.getByRole('button', { name: 'Salvar' })).toBeInViewport()
})

test('a narrow phone keeps everything reachable (SC-004)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockApp(page)
  await page.goto('/')

  await expect(page.getByLabel('Título')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('the secondary actions stay out of the capture flow (FR-006)', async ({ page }) => {
  await mockApp(page)
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Sair' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Mais opções' }).click()
  await expect(page.getByRole('menuitem', { name: 'Trocar senha' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Sair' })).toBeVisible()
})
