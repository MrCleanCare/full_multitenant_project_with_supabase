# Multi-tenant SaaS Platform

A powerful multi-tenant SaaS platform built with Next.js 14, Supabase, and TypeScript. This platform provides a secure and scalable foundation for building SaaS applications with features like authentication, role-based access control, and customizable templates.

## Features

- 🔐 **Authentication & Authorization**
  - Email/password authentication
  - Role-based access control (RBAC)
  - Secure session management

- 🏢 **Multi-tenancy**
  - Isolated workspaces for each tenant
  - Custom domain support
  - Tenant-specific branding and settings

- 📝 **Templates**
  - Create and manage reusable templates
  - Version control
  - Role-based permissions

- 📱 **QR Code Management**
  - Generate and customize QR codes
  - Track QR code usage
  - Custom styling options

- 📧 **Email Integration**
  - Email notifications
  - Custom email templates
  - SMTP configuration

- 🎨 **Modern UI/UX**
  - Responsive design
  - Dark mode support
  - Customizable themes

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: React Hook Form
- **Validation**: Zod
- **UI Components**: Custom components with Tailwind

## Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Supabase account
- SMTP server (for email features)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/multi-tenant-saas.git
   cd multi-tenant-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your Supabase and SMTP credentials.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploying to Render

1. Fork this repository to your GitHub account.

2. Create a new Web Service on Render:
   - Go to https://dashboard.render.com
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose the branch to deploy
   - Fill in the following settings:
     - Name: your-app-name
     - Environment: Node
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Select the appropriate instance type

3. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_SITE_URL
   - NODE_ENV=production

4. Click "Create Web Service"

Your application will be automatically deployed when you push changes to the main branch.

## Development

- **Code Style**: The project uses ESLint and Prettier for code formatting.
- **Type Safety**: TypeScript is used throughout the project for type safety.
- **Testing**: Jest and Playwright for testing.
- **Git Hooks**: Husky is configured for pre-commit hooks.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.