# Provider App — Agent Instructions

## Tech Stack

- **Framework**: Expo 55 (canary) with Expo Router
- **Language**: TypeScript
- **UI**: React Native 0.83 with react-native-svg, reanimated
- **State**: Zustand stores in `src/stores/`
- **API**: Custom fetch wrapper in `src/services/api.ts`
- **Forms**: react-hook-form + zod
- **Secure Storage**: expo-secure-store (for auth tokens)
- **Notifications**: expo-notifications

## File Organization

```
provider/
  src/
    app/                → Expo Router pages
      (tabs)/           → Tab navigator (dashboard, orders, menu, settings)
      _layout.tsx       → Root layout
      index.tsx         → Login/landing screen
      onboarding.tsx    → Multi-step registration wizard (all-in-one)
      order-detail.tsx  → Order detail screen
      earnings.tsx      → Earnings breakdown
    components/
      ui/               → Base UI components
    constants/          → Theme, config values
    data/               → Static reference data
    hooks/              → Custom React hooks
    lib/                → Utility libraries
    services/
      api.ts            → API service layer (single fetch wrapper)
    stores/
      authStore.ts      → Auth state + token persistence
      menuStore.ts      → Menu/thali CRUD
      onboardingStore.ts → Multi-step form state
      orderStore.ts     → Order management
      vendorStore.ts    → Vendor profile
    types/              → TypeScript type definitions
    utils/              → Helper functions
```

## API Service Pattern

All API calls go through `src/services/api.ts`. The `apiFetch` wrapper:
- Auto-injects JWT from `authStore`
- Sets `Content-Type: application/json`
- Throws on non-OK responses
- Auto-detects API base URL by platform (web vs Android emulator)

```typescript
// Grouped by domain:
import { authApi } from '../services/api';     // sendOTP, verifyOTP
import { providerApi } from '../services/api'; // getDashboard, getEarnings, toggleMess
import { messApi } from '../services/api';     // registerMess, updateMess
import { orderApi } from '../services/api';    // getProviderOrders, updateOrderStatus
import { menuApi } from '../services/api';     // getMessMenu, addMenuItem
import { thaliApi } from '../services/api';    // getMessThalis, addThali
import { vendorApi } from '../services/api';   // getBankDetails, createBankDetails
```

When adding a new API call, add it to the appropriate group in `api.ts`.

## Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { someApi } from '../services/api';

interface SomeState {
  data: SomeType[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useSomeStore = create<SomeState>((set) => ({
  data: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await someApi.getData();
      set({ data: result, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
```

## Multi-Step Onboarding

The onboarding wizard is a **single screen** (`src/app/onboarding.tsx`) with 9 steps managed by `onboardingStore.ts`. Steps: Personal Info → Business Details → Address → Timings → Menu Items → Thali Setup → Bank Details → Settings → Preview & Submit.

## Rules

1. **TypeScript only** — all new files must be `.tsx` or `.ts`.
2. **API calls through `api.ts`** — never use raw `fetch` in components or stores.
3. **One vendor = one mess** — the app assumes a single mess per vendor.
4. **Auth tokens in SecureStore** — `authStore` handles persistence.
5. **Expo Router** — use `router.push()`, `router.replace()` for navigation.

## Running

```bash
cd provider && npm start          # Expo dev server on port 8082
cd provider && npm run android    # Launch on Android
cd provider && npm run web        # Launch web version
```
