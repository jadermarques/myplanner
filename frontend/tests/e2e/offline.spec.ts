import { expect, test } from '@playwright/test'

test('going offline shows the connection notice', async ({ page, context }) => {
  await page.goto('/')
  await context.setOffline(true)
  await expect(page.getByRole('alert')).toHaveText(
    'Você precisa de conexão para usar o app.',
  )
})
