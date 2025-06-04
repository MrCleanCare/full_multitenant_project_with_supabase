import { test, expect } from '@playwright/test'

test.describe('Tenant Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login')
    await page.getByPlaceholder('m@example.com').fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'test123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new tenant', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Workspace' }).click()
    await expect(page).toHaveURL('/dashboard/new-tenant')

    const tenantName = `Test Tenant ${Date.now()}`
    await page.getByLabel('Name').fill(tenantName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText(tenantName)).toBeVisible()
  })

  test('should switch between tenants', async ({ page }) => {
    await page.getByRole('button', { name: /Select a workspace/ }).click()
    const firstTenant = await page.getByRole('button').first()
    const tenantName = await firstTenant.textContent()
    await firstTenant.click()
    await expect(page.getByText(`Overview of your workspace ${tenantName}`)).toBeVisible()
  })

  test('should update tenant settings', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/dashboard/settings')

    const newName = `Updated Tenant ${Date.now()}`
    await page.getByLabel('Workspace Name').fill(newName)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Settings updated successfully')).toBeVisible()
    await expect(page.getByText(newName)).toBeVisible()
  })

  test('should manage team members', async ({ page }) => {
    await page.getByRole('link', { name: 'Team' }).click()
    await expect(page).toHaveURL('/dashboard/team')

    await page.getByRole('button', { name: 'Invite Member' }).click()
    await page.getByLabel('Email').fill('newmember@example.com')
    await page.getByLabel('Role').selectOption('member')
    await page.getByRole('button', { name: 'Send Invitation' }).click()

    await expect(page.getByText('Invitation sent successfully')).toBeVisible()
  })

  test('should create and manage templates', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click()
    await expect(page).toHaveURL('/dashboard/templates')

    await page.getByRole('button', { name: 'New Template' }).click()
    const templateName = `Test Template ${Date.now()}`
    await page.getByLabel('Name').fill(templateName)
    await page.getByLabel('Content').fill('Test template content')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Template created successfully')).toBeVisible()
    await expect(page.getByText(templateName)).toBeVisible()
  })

  test('should create and manage QR codes', async ({ page }) => {
    await page.getByRole('link', { name: 'QR Codes' }).click()
    await expect(page).toHaveURL('/dashboard/qr')

    await page.getByRole('button', { name: 'New QR Code' }).click()
    const qrName = `Test QR ${Date.now()}`
    await page.getByLabel('Name').fill(qrName)
    await page.getByLabel('URL').fill('https://example.com')
    await page.getByRole('button', { name: 'Generate' }).click()

    await expect(page.getByText('QR code created successfully')).toBeVisible()
    await expect(page.getByText(qrName)).toBeVisible()
  })
}) 