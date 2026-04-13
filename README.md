# Secure Vault App

A secure web application for managing data. Built with React, TypeScript and integrated with Ethereum blockchain via ethers.js.

## Features

- Authentication: User registration and login
- Cryptographic Security: BIP39 mnemonic phrase generation using @scure/bip39
- Blockchain Integration: Ethereum wallet management via ethers.js v6
- Protected Routes: Components for securing private pages
- Responsive Design: Styled with Tailwind CSS
- Type Safety: Fully written in TypeScript

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Blockchain**: ethers.js v6
- **Crypto**: @scure/bip39
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **HTTP**: Axios

## Installation

```bash
npm install
```

## Running

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Scripts

- `npm run dev` - Start dev server with HMR
- `npm run build` - Production build (TypeScript check + Vite build)
- `npm run lint` - ESLint code check
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── api/          - API requests
├── abi/          - Ethereum contract ABI
├── assets/       - Static assets
├── components/   - React components (Login, Register, Dashboard)
├── context/      - React Context (Auth)
├── hooks/        - Custom hooks
├── providers/    - Providers (AuthProvider)
├── types/        - TypeScript types
└── utils/        - Utilities
```

## Security

- Cryptographically secure libraries (@scure/bip39)
- Protected routes for authenticated users
- Secure private key management

## CI/CD

Project is configured with GitHub Actions for automated:
- ESLint check on every commit
- Build check on pull requests

