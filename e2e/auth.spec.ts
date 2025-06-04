import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByText('Enter your email to sign in to your account')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('m@example.com').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('m@example.com').fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'test123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
}) 