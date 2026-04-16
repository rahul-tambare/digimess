---
name: add-provider-feature
description: Step-by-step guide to add a new feature to the Digimess provider app
---

# Add a New Feature to Provider App

Follow these steps to add a new feature to the provider Expo app.

## 1. Add API Methods

Add new API methods to `provider/src/services/api.ts`:

```typescript
// Add to an existing group or create a new one
export const myResourceApi = {
  getAll: () =>
    apiFetch('/my-resource'),

  create: (data: { name: string }) =>
    apiFetch('/my-resource', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/my-resource/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/my-resource/${id}`, { method: 'DELETE' }),
};
```

## 2. Define Types

Create or update types in `provider/src/types/`:

```typescript
// provider/src/types/myResource.ts
export interface MyResource {
  id: string;
  name: string;
  createdAt: string;
}
```

## 3. Create Zustand Store

Create a store in `provider/src/stores/`:

```typescript
// provider/src/stores/myResourceStore.ts
import { create } from 'zustand';
import { myResourceApi } from '../services/api';
import type { MyResource } from '../types/myResource';

interface MyResourceState {
  items: MyResource[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (data: { name: string }) => Promise<void>;
}

export const useMyResourceStore = create<MyResourceState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const items = await myResourceApi.getAll();
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
  create: async (data) => {
    await myResourceApi.create(data);
    await get().fetch(); // Refresh list after creation
  },
}));
```

## 4. Create the Screen

Create a screen in `provider/src/app/`:

```tsx
// provider/src/app/my-feature.tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { useMyResourceStore } from '../stores/myResourceStore';
import { useEffect } from 'react';

export default function MyFeatureScreen() {
  const { items, loading, fetch } = useMyResourceStore();

  useEffect(() => { fetch(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 16, backgroundColor: '#fff', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

## 5. Add to Navigation (if tab screen)

For a new tab, update `provider/src/app/(tabs)/_layout.tsx`.

## Checklist

- [ ] API methods added to `src/services/api.ts`
- [ ] Types defined in `src/types/`
- [ ] Zustand store created in `src/stores/`
- [ ] Screen created in `src/app/`
- [ ] Navigation updated if needed
- [ ] Backend endpoint exists (use `add-api-endpoint` skill if not)
