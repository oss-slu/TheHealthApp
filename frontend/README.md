# The Health App - Frontend

A modern React application built with Vite, featuring internationalization support and comprehensive authentication flow.

## Features

- **Multi-language Support**: English, Hindi, Spanish, Arabic, and Chinese
- **Authentication Flow**: Landing → Login → Dashboard
- **Form Validation**: Real-time username and password validation with visual feedback
- **Protected Routes**: Dashboard and authenticated pages require login
- **Responsive Design**: Built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Application Flow

### Landing & Authentication

1. **Landing Page**: The root route (`/`) automatically redirects to `/auth/login`
2. **Login Page**: Users must authenticate with valid credentials
3. **Dashboard**: After successful login, users are redirected to `/dashboard`
4. **Protected Routes**: Dashboard and other authenticated pages require valid session

### Navigation

- **Unauthenticated Users**: See Login and Signup links
- **Authenticated Users**: See Dashboard, Account Settings, and module links, plus Logout button
- **Navigation Visibility**: Can be hidden on auth pages using `showNav={false}` prop

## Authentication Validation Rules

### Username Requirements

- **Length**: 3-20 characters
- **Format**: Must start with a letter (A-Z, a-z)
- **Allowed Characters**: Letters, numbers, dots (.), and underscores (_)
- **Restrictions**: 
  - No consecutive special characters (e.g., `__`, `..`, `._`)
  - Case-insensitive (normalized before validation)

**Regex Pattern**: `/^[A-Za-z][A-Za-z0-9._]{2,19}$/`

**Examples**:
- ✅ Valid: `john_doe`, `user123`, `test.user`
- ❌ Invalid: `_user`, `123user`, `user__name`, `user..name`

### Password Requirements

- **Length**: Minimum 8 characters
- **Must Contain**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one numeric digit (0-9)
  - At least one special character (@$!%*?&)
- **Restrictions**: No spaces allowed

**Regex Pattern**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`

**Examples**:
- ✅ Valid: `Password123!`, `MyP@ssw0rd`
- ❌ Invalid: `password`, `PASSWORD123!`, `Pass123` (missing special char), `Pass 123!` (contains space)

### Validation Features

- **Real-time Feedback**: Visual indicators (✔ green / ✖ red) show requirement status
- **Inline Error Messages**: Displayed when fields are touched and invalid
- **Form Submission**: Disabled until all validation rules are met
- **Password Confirmation**: Required on signup page, must match password

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── LanguagePicker.jsx
│   └── PageShell.jsx   # Layout wrapper with navigation
├── pages/
│   ├── auth/          # Authentication pages
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── modules/       # Feature modules
│   └── settings/      # Settings pages
├── utils/
│   └── validation.js  # Username/password validation utilities
├── i18n.js            # i18n configuration
└── App.jsx            # Main app component with routing

public/
└── locales/           # Translation files
    ├── en/
    ├── hi/
    ├── es/
    ├── ar/
    └── zh/
```

## Routing

- `/` → Redirects to `/auth/login`
- `/auth/login` → Login page
- `/auth/signup` → Signup page
- `/auth/forgot-password` → Password reset page
- `/dashboard` → Main dashboard (protected)
- `/settings/account` → Account settings
- `/modules/*` → Feature modules

## Internationalization

The app supports 5 languages:
- English (en)
- Hindi (hi)
- Spanish (es)
- Arabic (ar) - RTL support
- Chinese (zh)

Translation files are located in `public/locales/{lang}/{namespace}.json`

## Authentication State

Authentication state is managed via `localStorage`:
- Key: `auth.session` (value: `'true'` when authenticated)
- Protected routes check this value and redirect to login if not authenticated
- Logout clears the session and redirects to login

## Backend Integration

Currently, authentication uses mock/simulated success. To integrate with backend:

1. Update `Login.jsx` and `Signup.jsx` to call actual API endpoints
2. Replace the `setTimeout` mock with real API calls
3. Handle API responses and errors appropriately
4. Store authentication tokens/session data as needed

**TODO markers** are present in the code where API integration is needed.

## Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Routing
- **i18next** - Internationalization
- **Tailwind CSS** - Styling
- **ESLint** - Code linting

## Development Notes

- Language preference is stored in `localStorage` as `app.lang`
- RTL (Right-to-Left) layout is automatically applied for Arabic
- Form validation uses regex patterns defined in `src/utils/validation.js`
- All validation feedback is internationalized

## License

© 2024 The Health App. All rights reserved.
