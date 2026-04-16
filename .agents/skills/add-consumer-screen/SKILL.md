---
name: add-consumer-screen
description: Step-by-step guide to add a new screen to the Digimess consumer app
---

# Add a New Screen to Consumer App

Follow these steps to add a new screen to the consumer Expo app.

## 1. Create the Screen File

Add a new `.tsx` file in `consumer/app/`:

```tsx
// consumer/app/my-screen.tsx
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

export default function MyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Screen' }} />
      <ScrollView className="flex-1 bg-white">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900">My Screen</Text>
        </View>
      </ScrollView>
    </>
  );
}
```

For a **tab screen**, create in `consumer/app/(tabs)/my-tab.tsx` and update the tab layout.

For a **dynamic route**, use `consumer/app/my-resource/[id].tsx`.

## 2. Create Components (if needed)

Create reusable components in `consumer/components/`:

```tsx
// consumer/components/MyCard.tsx
import { View, Text, Pressable } from 'react-native';

interface MyCardProps {
  title: string;
  onPress: () => void;
}

export default function MyCard({ title, onPress }: MyCardProps) {
  return (
    <Pressable onPress={onPress} className="p-4 bg-white rounded-xl shadow-sm mb-3">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
    </Pressable>
  );
}
```

## 3. Add Store Logic (if needed)

Update or create a store in `consumer/stores/`:

```tsx
// In consumer/stores/dataStore.ts or a new store file
import { create } from 'zustand';

interface MyState {
  items: any[];
  loading: boolean;
  fetchItems: () => Promise<void>;
}

export const useMyStore = create<MyState>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    try {
      const token = useUserStore.getState().token; // if auth needed
      const res = await fetch(`${API_BASE}/my-resource`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      set({ items: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
```

## 4. Navigate To It

Use Expo Router navigation:

```tsx
import { router } from 'expo-router';

// Navigate to the screen
router.push('/my-screen');

// With params
router.push('/my-resource/123');

// Replace (no back button)
router.replace('/my-screen');
```

## Styling Rules

- Use **NativeWind** `className` for all styling
- Common classes: `flex-1`, `p-4`, `bg-white`, `rounded-xl`, `shadow-sm`
- Text: `text-lg font-bold text-gray-900`
- Colors from `constants/theme.ts` when needed

## Checklist

- [ ] Screen file created in `app/`
- [ ] Components created in `components/` if reusable
- [ ] Store logic added/updated in `stores/`
- [ ] Navigation wired up from other screens
- [ ] NativeWind styling applied (no StyleSheet.create)
