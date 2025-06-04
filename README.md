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

## Database Setup

1. Create a new Supabase project.

2. Run the migration:
   ```bash
   npx supabase db push
   ```

## Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── public/              # Static files
├── supabase/           # Supabase configurations and migrations
└── test/               # Test files
```

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