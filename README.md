# Osseilan Management Website

A comprehensive management dashboard for managing various business operations including inventory, sales, employees, and customer relations.

## Features

This application includes the following key modules:

- **Authentication**: Secure user login and profile management.
- **CRM & Customers**: Customer management including profiles and history.
- **Sales**: Management of Sell Orders and sales processes.
- **Inventory & Items**: Product management, items tracking, and measurements.
- **Purchase Orders**: Management of supplier orders and purchases.
- **Employees**: Staff management, permissions, and expense tracking.
- **Storage**: Warehouse and storage area organization.
- **Opportunities**: Tracking verification projects and business opportunities.

## Tech Stack

This project is built with a modern frontend stack:

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + `tailwindcss-animate`
- **UI Components**: Built with [Radix UI](https://www.radix-ui.com/) and [Lucide Icons](https://lucide.dev/)
- **State Management**:
  - Global Client State: [Zustand](https://github.com/pmndrs/zustand)
  - Server Data: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) Validation
- **Routing**: [React Router v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build

To build the application for production:

```bash
npm run build
```

### Linting

To run the linter:

```bash
npm run lint
```

### Testing

Run unit tests with Vitest:

```bash
npm run test
```

Run E2E tests with Playwright:

```bash
npm run test:e2e
```

## Project Structure

- `src/modules`: Feature-based organization (Auth, Customers, Employees, etc.) containing components, hooks, and services specific to each domain.
- `src/components`: Shared UI components and primitives (likely Shadcn UI compatible).
- `src/store`: Global state stores.
- `src/hooks`: Global custom hooks.
- `src/lib`: Utility functions and configurations.
