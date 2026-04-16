# Consumer App — Agent Instructions

## Tech Stack

- **Framework**: Expo 54 with Expo Router (file-based routing)
- **Language**: TypeScript
- **UI**: React Native 0.81 with NativeWind (TailwindCSS for RN)
- **State**: Zustand stores in `stores/`
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react-native and @expo/vector-icons

## File Organization

```
consumer/
  app/                → Expo Router pages (file-based routing)
    (tabs)/           → Tab navigator screens
    onboarding/       → Onboarding flow screens
    mess/             → Mess detail pages
    order/            → Order tracking pages
    _layout.tsx       → Root layout with providers
  components/         → Reusable UI components
    ui/               → Base UI components
    MessCard.tsx      → Mess list card
    ThaliCard.tsx     → Thali/menu item card
    CartSummaryBar.tsx → Floating cart bar
    FilterBottomSheet.tsx → Filter modal
    FormInput.tsx     → Form input wrapper
  constants/
    theme.ts          → Colors and Fonts definitions
  hooks/              → Custom React hooks
  stores/
    dataStore.ts      → Zustand stores (user, data, cart)
    mockData.ts       → Mock data (being replaced with real API)
```

## Routing

Uses Expo Router file-based routing:
- `app/(tabs)/` — Tab screens (home, explore, orders, profile)
- `app/mess/[id].tsx` — Dynamic mess detail page
- `app/order/[id].tsx` — Dynamic order detail page
- `app/onboarding/` — Customer onboarding screens

## State Management (Zustand)

Stores are in `stores/dataStore.ts`. Pattern:

```typescript
import { create } from 'zustand';

interface SomeState {
  items: Item[];
  loading: boolean;
  fetchItems: () => Promise<void>;
}

export const useSomeStore = create<SomeState>((set, get) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/endpoint`);
      const data = await res.json();
      set({ items: data, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
}));
```

## Styling

- Use **NativeWind** (TailwindCSS) classes via `className` prop
- Config: `tailwind.config.js`, `global.css`
- Theme colors defined in `constants/theme.ts` — use `Colors.light` / `Colors.dark`
- **Do NOT use inline StyleSheet.create** unless NativeWind cannot handle it

## Component Pattern

```tsx
import { View, Text, Pressable } from 'react-native';

export default function MyComponent({ title }: { title: string }) {
  return (
    <View className="p-4 bg-white rounded-xl shadow-sm">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
    </View>
  );
}
```

## Rules

1. **TypeScript only** — all new files must be `.tsx` or `.ts`.
2. **NativeWind for styling** — use `className` not `StyleSheet.create`.
3. **Single mess per cart** — enforce in `useCartStore.addToCart`.
4. **API integration in progress** — consumer is transitioning from `mockData.ts` to real API calls. When adding features, wire up to the real backend API, not mock data.
5. **Expo Router conventions** — use `router.push()`, `router.replace()`, `<Link>` for navigation.

## Running

```bash
cd consumer && npm start          # Expo dev server on port 8081
cd consumer && npm run android    # Launch on Android
cd consumer && npm run web        # Launch web version
```
