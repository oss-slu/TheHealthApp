# Frontend Testing Guide (No Database Required)

## Quick Start

The frontend is **fully functional without a database connection**. Authentication is currently mocked/simulated, so you can test all features immediately.

## Running the Frontend

### 1. Install Dependencies (if not already done)

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:5173**

### 3. Access the Application

Open your browser and navigate to:
- **http://localhost:5173** - Will automatically redirect to login page

## Testing the Authentication Flow

### Login Testing

1. **Navigate to Login Page**: The root URL (`/`) automatically redirects to `/auth/login`

2. **Test Username Validation**:
   - ✅ Valid: `john_doe`, `user123`, `test.user`
   - ❌ Invalid: `_user` (starts with special char), `ab` (too short), `user__name` (consecutive underscores)

3. **Test Password Validation**:
   - ✅ Valid: `Password123!`, `MyP@ssw0rd`
   - ❌ Invalid: `password` (no uppercase/number/special), `PASS123!` (no lowercase), `Pass 123!` (contains space)

4. **Real-time Feedback**: 
   - Watch the checklist update as you type (green ✔ for satisfied, red ✖ for missing)
   - Error messages appear when fields are touched and invalid

5. **Submit Form**:
   - Form is disabled until all validations pass
   - After successful validation, click "Login"
   - You'll be redirected to `/dashboard` after ~300ms (simulated API delay)

### Signup Testing

1. **Navigate to Signup**: Click "Sign up" link or go to `/auth/signup`

2. **Fill Form Fields**:
   - Username: Same validation as login
   - Password: Same validation as login
   - Confirm Password: Must match password exactly
   - Age, Gender, Phone: Optional fields

3. **Test Confirm Password**:
   - Enter matching passwords → No error
   - Enter mismatched passwords → Error message appears

4. **Submit**: Same flow as login, redirects to dashboard

### Dashboard & Navigation Testing

1. **After Login**:
   - You'll see the Dashboard page
   - Navigation bar shows: Dashboard, Account Settings, and module links
   - Logout button appears in the top right

2. **Test Protected Routes**:
   - Try accessing `/dashboard` directly (should work if logged in)
   - Logout and try again (should redirect to login)

3. **Test Logout**:
   - Click "Logout" button
   - You'll be redirected to login page
   - Session is cleared

### Language Testing

1. **Language Picker**: 
   - Appears on first visit if no language is set
   - Click globe icon (🌐) in header to change language
   - Test all 5 languages: English, Hindi, Spanish, Arabic, Chinese

2. **RTL Support**:
   - Switch to Arabic to see RTL (Right-to-Left) layout

## Testing Checklist

### ✅ Authentication Flow
- [ ] Root URL redirects to login
- [ ] Login form validates username correctly
- [ ] Login form validates password correctly
- [ ] Real-time validation feedback works
- [ ] Form submission disabled when invalid
- [ ] Successful login redirects to dashboard
- [ ] Signup form includes confirm password
- [ ] Signup validation works correctly

### ✅ Navigation & Routing
- [ ] Navigation hidden on auth pages (`showNav={false}`)
- [ ] Navigation shows correct links for authenticated users
- [ ] Navigation shows login/signup for unauthenticated users
- [ ] Logout button appears when logged in
- [ ] Logout clears session and redirects
- [ ] Protected routes redirect to login when not authenticated

### ✅ Validation Rules
- [ ] Username: 3-20 chars, starts with letter
- [ ] Username: No consecutive special characters
- [ ] Password: 8+ chars, uppercase, lowercase, number, special char
- [ ] Password: No spaces allowed
- [ ] Confirm password: Must match
- [ ] All error messages display correctly

### ✅ Internationalization
- [ ] All 5 languages work
- [ ] Validation messages translate correctly
- [ ] RTL layout works for Arabic
- [ ] Language preference persists

## Current Mock Behavior

The authentication currently uses **simulated success**:

```javascript
// In Login.jsx and Signup.jsx
setTimeout(() => {
  onAuthSuccess({ username: normalizedUsername });
  navigate('/dashboard', { replace: true });
}, 300);
```

**What this means:**
- ✅ Any valid username/password combination will "succeed"
- ✅ No actual API calls are made
- ✅ No database connection needed
- ✅ Session is stored in `localStorage` as `auth.session = 'true'`

## Testing Different Scenarios

### Scenario 1: First-time User
1. Clear browser localStorage: `localStorage.clear()` in browser console
2. Visit `http://localhost:5173`
3. Language picker should appear
4. Select language
5. Redirected to login page

### Scenario 2: Returning User (Logged In)
1. Login with valid credentials
2. Close browser tab
3. Reopen `http://localhost:5173`
4. Should redirect to dashboard (session persisted)

### Scenario 3: Invalid Credentials (Validation)
1. Try to submit with invalid username: `_user`
2. See error message
3. Try invalid password: `pass`
4. See checklist showing missing requirements
5. Form submit button remains disabled

### Scenario 4: Protected Route Access
1. Logout (or clear session)
2. Try to access `http://localhost:5173/dashboard` directly
3. Should redirect to login page

## Browser Console Testing

Open browser DevTools (F12) and test:

```javascript
// Check current session
localStorage.getItem('auth.session')  // Should be 'true' if logged in

// Check language preference
localStorage.getItem('app.lang')  // Should be 'en', 'hi', 'es', 'ar', or 'zh'

// Clear session (simulate logout)
localStorage.removeItem('auth.session')
window.location.reload()

// Clear everything
localStorage.clear()
window.location.reload()
```

## Common Issues & Solutions

### Issue: Page not loading
**Solution**: Make sure you're in the `frontend` directory and dependencies are installed:
```bash
cd frontend
npm install
npm run dev
```

### Issue: Validation not working
**Solution**: Check browser console for errors. Make sure `src/utils/validation.js` exists.

### Issue: Translations not loading
**Solution**: Check that `public/locales/` folder exists with all language files.

### Issue: Styling looks broken
**Solution**: Tailwind CSS should compile automatically. If not, check `tailwind.config.js` and restart dev server.

## Next Steps (When Backend is Ready)

When you're ready to connect to a real backend:

1. **Update Login.jsx**: Replace `setTimeout` with actual API call
2. **Update Signup.jsx**: Replace `setTimeout` with actual API call
3. **Add API Configuration**: Create `src/config/api.js` with backend URL
4. **Add Error Handling**: Handle API errors and display to user
5. **Update Session Management**: Store actual tokens instead of boolean

The TODO markers in the code indicate where API integration is needed.

## Summary

✅ **You can test everything right now without a database!**
- All validation works
- All routing works
- All UI components work
- Authentication flow works (mocked)
- Internationalization works

Just run `npm run dev` and start testing! 🚀

