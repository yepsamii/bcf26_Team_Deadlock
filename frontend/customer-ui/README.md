# Valerix Customer Portal - React + Vite

Modern React application with Vite, TanStack Query, Axios, and Tailwind CSS.

## Features

- ✅ **React 18** with Vite for fast development
- ✅ **TanStack Query (React Query)** for server state management
- ✅ **Axios** for HTTP requests
- ✅ **Tailwind CSS** for styling
- ✅ **React Router** for navigation
- ✅ **Auth Context** - No localStorage dependencies
- ✅ **Environment Variables** - Configured via .env
- ✅ **Mock Mode** - Development without backend

## Project Structure

```
src/
├── api/                    # API service layers
│   └── authService.js      # Auth API calls
├── components/             # React components
│   ├── auth/               # Auth-related components
│   │   ├── AuthView.jsx    # Main auth page
│   │   ├── LoginForm.jsx   # Login form
│   │   └── RegisterForm.jsx # Registration form
│   └── dashboard/          # Dashboard components
│       └── Dashboard.jsx   # Main dashboard
├── config/                 # Configuration
│   └── env.js              # Environment config
├── contexts/               # React contexts
│   └── AuthContext.jsx     # Auth state management
├── hooks/                  # Custom React hooks
│   └── useAuth.js          # Auth hooks (login, register, logout)
├── lib/                    # Third-party library setup
│   ├── axios.js            # Axios instances & interceptors
│   └── react-query.js      # Query client configuration
├── App.jsx                 # Main app component with routing
└── main.jsx                # App entry point with providers
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API Configuration
VITE_AUTH_SERVICE_URL=http://localhost:5001
VITE_ORDER_SERVICE_URL=http://localhost:3001
VITE_INVENTORY_SERVICE_URL=http://localhost:3002

# Feature Flags
VITE_USE_MOCK_DATA=true                # Set to false for real backend
VITE_SIMULATE_NETWORK_DELAY=true       # Simulate network delays
VITE_NETWORK_DELAY_MS=500              # Delay in milliseconds
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### Mock Mode vs Real Backend

The app can run in two modes:

#### Mock Mode (Development)
- Set `VITE_USE_MOCK_DATA=true` in `.env`
- No backend required
- Uses mock data with simulated delays
- Default test users:
  - `john@example.com` / `password123`
  - `jane@example.com` / `password123`
  - `demo@valerix.com` / `demo`

#### Real Backend Mode (Production)
- Set `VITE_USE_MOCK_DATA=false` in `.env`
- Requires backend services running
- Connects to actual auth service on port 5001
- Uses real JWT tokens and database

### Backend Services

Start the backend auth service:

```bash
# From project root
docker-compose up auth-service
```

## Authentication

### Auth Flow

1. User submits login/register form
2. `useLogin` or `useRegister` hook makes API call via TanStack Query
3. On success, `AuthContext` stores token and user in **sessionStorage** (not localStorage)
4. Protected routes check auth status via `useAuth` hook
5. Axios interceptors add auth token to requests

### Auth Context

The `AuthContext` provides:

```javascript
const { user, token, isLoading, login, logout, isAuthenticated, getToken } = useAuth();
```

### Protected Routes

Routes are automatically protected using `ProtectedRoute` component:

```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## API Integration

### Using Axios

All API calls use axios instances from `src/lib/axios.js`:

```javascript
import { authServiceClient } from '../lib/axios';

// Make API call
const response = await authServiceClient.post('/login', credentials);
```

### Using TanStack Query

Wrap API calls in mutations or queries:

```javascript
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';

const loginMutation = useMutation({
  mutationFn: (credentials) => authService.login(credentials),
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  },
});

// Use in component
loginMutation.mutate({ email, password });
```

### Request/Response Interceptors

Axios interceptors are configured to:

- Add auth token to requests (when available)
- Simulate network delays (in mock mode)
- Transform errors to consistent format
- Handle timeouts and network errors

## Session Management

### Why sessionStorage instead of localStorage?

- **Security**: sessionStorage is cleared when tab closes
- **Privacy**: No persistent data on user's machine
- **Compliance**: Better for sensitive data handling
- **UX**: User must re-authenticate when returning

### Auth Token Storage

Tokens are stored in `sessionStorage`:

```javascript
sessionStorage.setItem('valerix_token', token);
sessionStorage.setItem('valerix_user', JSON.stringify(user));
```

To switch to localStorage, modify `src/contexts/AuthContext.jsx`.

## Error Handling

### API Errors

Errors are caught and transformed by axios interceptors:

```javascript
{
  status: 401,
  message: "Invalid email or password",
  data: null
}
```

### React Query Error Handling

```javascript
const mutation = useMutation({
  mutationFn: apiCall,
  onError: (error) => {
    console.error('Error:', error.message);
    // Show toast notification
  },
});

// In component
{mutation.error && <div className="error">{mutation.error.message}</div>}
```

## Styling

### Tailwind CSS

The app uses Tailwind CSS with custom configuration:

- Custom primary color palette (blue shades)
- Utility classes for card shadows
- Responsive design utilities

### Custom Classes

```css
.card-shadow      /* Light shadow for cards */
.card-shadow-lg   /* Large shadow for elevated cards */
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the app.

Access in code:

```javascript
import.meta.env.VITE_AUTH_SERVICE_URL
```

## Testing

### Test Login

1. Start the app: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Use demo credentials:
   - Email: `demo@valerix.com`
   - Password: `demo`
4. Should redirect to dashboard after successful login

### Test with Real Backend

1. Start backend: `docker-compose up auth-service`
2. Set `VITE_USE_MOCK_DATA=false` in `.env`
3. Restart dev server
4. Register new account or login with existing credentials

## Deployment

### Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment Variables for Production

Update `.env` for production:

```env
VITE_AUTH_SERVICE_URL=https://api.valerix.com
VITE_USE_MOCK_DATA=false
VITE_SIMULATE_NETWORK_DELAY=false
```

### Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variables in dashboard
4. Deploy

### Deploy to S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Troubleshooting

### "Network Error" when calling API

- **Check**: Is backend running? `docker-compose ps`
- **Check**: Is URL correct in `.env`?
- **Check**: CORS configured on backend?

### App shows blank screen

- **Check**: Browser console for errors
- **Check**: All dependencies installed? `npm install`
- **Check**: `.env` file exists? `cp .env.example .env`

### Tailwind styles not working

- **Check**: PostCSS configuration exists
- **Check**: `@tailwind` directives in `src/index.css`
- **Restart**: Dev server

## Next Steps

- [ ] Add order management components
- [ ] Add inventory/product browsing
- [ ] Add profile management
- [ ] Implement password reset
- [ ] Add toast notifications
- [ ] Add loading skeletons
- [ ] Add error boundary
- [ ] Add analytics tracking
- [ ] Add testing (Jest/Vitest + Testing Library)

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
