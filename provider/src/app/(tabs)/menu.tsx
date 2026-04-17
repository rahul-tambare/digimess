// ==========================================
// Menu Management Screen — Live API Data
// ==========================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';
import { thaliApi, menuApi, messApi } from '../../services/api';
import ThaliCard from '../../components/ui/ThaliCard';
import EmptyState from '../../components/ui/EmptyState';
import BottomSheet from '../../components/ui/BottomSheet';
import ConfirmModal from '../../components/ui/ConfirmModal';
import FormField from '../../components/ui/FormField';

type Tab = 'thalis' | 'items';

export default function MenuScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('thalis');
  const [thalis, setThalis] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [messId, setMessId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddThali, setShowAddThali] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Thali form state
  const [thaliName, setThaliName] = useState('');
  const [thaliMealTime, setThaliMealTime] = useState('Lunch');
  const [thaliType, setThaliType] = useState('Veg');
  const [thaliItems, setThaliItems] = useState('');
  const [thaliPrice, setThaliPrice] = useState('');
  const [thaliDiscountPrice, setThaliDiscountPrice] = useState('');

  // Item form state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('General');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemDescription, setItemDescription] = useState('');

  const resetThaliForm = () => {
    setThaliName(''); setThaliMealTime('Lunch'); setThaliType('Veg');
    setThaliItems(''); setThaliPrice(''); setThaliDiscountPrice('');
  };

  const resetItemForm = () => {
    setItemName(''); setItemPrice(''); setItemCategory('General');
    setItemIsVeg(true); setItemDescription('');
  };

  const fetchData = async () => {
    try {
      const messes = await messApi.getMyMesses();
      if (messes && messes.length > 0) {
        const mId = messes[0].id;
        setMessId(mId);
        const [t, m] = await Promise.all([
          thaliApi.getMessThalis(mId),
          menuApi.getMessMenu(mId),
        ]);
        setThalis(t || []);
        setMenuItems(m || []);
      }
    } catch (e) {
      console.error('Menu fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleAddThali = async () => {
    if (!thaliName.trim() || !thaliPrice.trim() || !messId) return;
    try {
      await thaliApi.addThali({
        messId,
        name: thaliName,
        mealTime: thaliMealTime,
        type: thaliType,
        itemsIncluded: thaliItems,
        price: parseFloat(thaliPrice),
        discountedPrice: thaliDiscountPrice ? parseFloat(thaliDiscountPrice) : undefined,
      });
      resetThaliForm();
      setShowAddThali(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteThali = async (id: string) => {
    try {
      if (activeTab === 'thalis') {
        await thaliApi.deleteThali(id);
      } else {
        await menuApi.deleteMenuItem(id);
      }
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setDeleteId(null);
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !messId) return;
    try {
      await menuApi.addMenuItem({
        messId,
        itemName: itemName,
        price: parseFloat(itemPrice),
        isVeg: itemIsVeg,
        category: itemCategory,
        // itemDescription is updated in controller to handle this if passed, 
        // but current menuApi.addMenuItem type only has these fields. 
        // I'll stick to the type for now.
      });
      resetItemForm();
      setShowAddThali(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await thaliApi.toggleAvailability(id);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleSpecial = async (id: string) => {
    try {
      await thaliApi.toggleSpecial(id);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleMenuItem = async (item: any) => {
    try {
      await menuApi.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const filteredThalis = thalis.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredItems = menuItems.filter(m => (m.itemName || m.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.tabRow}>
          <Pressable style={[styles.tab, activeTab === 'thalis' && styles.tabActive]} onPress={() => setActiveTab('thalis')}>
            <Text style={[styles.tabText, activeTab === 'thalis' && styles.tabTextActive]}>🍽️ Thalis ({thalis.length})</Text>
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'items' && styles.tabActive]} onPress={() => setActiveTab('items')}>
            <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>📋 Items ({menuItems.length})</Text>
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search menu..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'thalis' ? (
          <>
            {filteredThalis.length > 0 ? filteredThalis.map(thali => (
              <ThaliCard
                key={thali.id}
                thali={{
                  ...thali,
                  itemsIncluded: thali.itemsIncluded || '',
                  isAvailable: !!thali.isAvailable,
                  isSpecial: !!thali.isSpecial,
                }}
                onEdit={() => {}}
                onDelete={() => setDeleteId(thali.id)}
                onToggleAvailability={() => handleToggleAvailability(thali.id)}
                onToggleSpecial={() => handleToggleSpecial(thali.id)}
              />
            )) : (
              <EmptyState emoji="🍽️" title="No thalis yet" description="Add your first thali to start receiving orders" actionLabel="+ Add Thali" onAction={() => { setActiveTab('thalis'); setShowAddThali(true); }} />
            )}
          </>
        ) : (
          <>
            {filteredItems.length > 0 ? filteredItems.map(item => (
              <View key={item.id} style={styles.menuItemCard}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.veg : Colors.nonVeg }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemName}>{item.itemName || item.name}</Text>
                    <Text style={styles.menuItemCategory}>{item.category || 'Menu Item'}</Text>
                  </View>
                </View>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                    <Pressable
                      style={[styles.availBadge, item.isAvailable ? styles.availOn : styles.availOff]}
                      onPress={() => handleToggleMenuItem(item)}
                    >
                      <Text style={[styles.availText, item.isAvailable ? styles.availTextOn : styles.availTextOff]}>
                        {item.isAvailable ? 'On' : 'Off'}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.deleteMiniBtn} onPress={() => setDeleteId(item.id)}>
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )) : (
              <EmptyState emoji="📋" title="No menu items" description="Add individual items to complement your thalis" actionLabel="+ Add Item" onAction={() => { setActiveTab('items'); setShowAddThali(true); }} />
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAddThali(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Add Sheet */}
      <BottomSheet 
        visible={showAddThali} 
        title={activeTab === 'thalis' ? "Add New Thali" : "Add New Item"} 
        onClose={() => { setShowAddThali(false); resetThaliForm(); resetItemForm(); }}
      >
        {activeTab === 'thalis' ? (
          <>
            <FormField label="Thali Name" required placeholder="e.g. Special Rajasthani Thali" value={thaliName} onChangeText={setThaliName} />
            
            <Text style={styles.fieldLabel}>Meal Time</Text>
            <View style={styles.chipRow}>
              {(['Breakfast', 'Lunch', 'Dinner', 'All Day'] as const).map(t => (
                <Pressable key={t} style={[styles.chip, thaliMealTime === t && styles.chipActive]} onPress={() => setThaliMealTime(t)}>
                  <Text style={[styles.chipText, thaliMealTime === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              {(['Veg', 'Non-Veg', 'Jain'] as const).map(t => (
                <Pressable key={t} style={[styles.chip, thaliType === t && styles.chipActive]} onPress={() => setThaliType(t)}>
                  <Text style={[styles.chipText, thaliType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <FormField label="Items Included" required placeholder="3 Roti, 1 Sabzi, Dal, Rice..." value={thaliItems} onChangeText={setThaliItems} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: 14 }} />
            <FormField label="Price (₹)" required placeholder="e.g. 120" value={thaliPrice} onChangeText={setThaliPrice} keyboardType="number-pad" />
            <FormField label="Discounted Price (₹)" placeholder="Optional" value={thaliDiscountPrice} onChangeText={setThaliDiscountPrice} keyboardType="number-pad" />

            <Pressable style={styles.saveBtn} onPress={handleAddThali}>
              <Text style={styles.saveBtnText}>Save Thali</Text>
            </Pressable>
          </>
        ) : (
          <>
            <FormField label="Item Name" required placeholder="e.g. Extra Butter Roti" value={itemName} onChangeText={setItemName} />
            
            <Text style={styles.fieldLabel}>Dietary Type</Text>
            <View style={styles.chipRow}>
              {([true, false] as const).map(v => (
                <Pressable key={v ? 'Veg' : 'Non-Veg'} style={[styles.chip, itemIsVeg === v && styles.chipActive]} onPress={() => setItemIsVeg(v)}>
                  <Text style={[styles.chipText, itemIsVeg === v && styles.chipTextActive]}>{v ? 'Veg' : 'Non-Veg'}</Text>
                </Pressable>
              ))}
            </View>

            <FormField label="Category" placeholder="e.g. Breads, Sides, Drinks" value={itemCategory} onChangeText={setItemCategory} />
            <FormField label="Price (₹)" required placeholder="e.g. 20" value={itemPrice} onChangeText={setItemPrice} keyboardType="number-pad" />

            <Pressable style={styles.saveBtn} onPress={handleAddItem}>
              <Text style={styles.saveBtnText}>Save Item</Text>
            </Pressable>
          </>
        )}
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmModal
        visible={!!deleteId}
        title={activeTab === 'thalis' ? "Delete Thali?" : "Delete Item?"}
        message="This action cannot be undone. Are you sure?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => { if (deleteId) handleDeleteThali(deleteId); }}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.lg },
  tabRow: { flexDirection: 'row', gap: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.background, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primaryBg },
  tabText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  searchContainer: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  searchInput: {
    height: 44, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  scrollContent: { padding: Spacing.xl, paddingBottom: 120 },
  menuItemCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.sm, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  vegDot: { width: 10, height: 10, borderRadius: 2 },
  menuItemName: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  menuItemCategory: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  menuItemRight: { alignItems: 'flex-end', gap: Spacing.xs },
  menuItemPrice: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.primary },
  availBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  availOn: { backgroundColor: Colors.successBg },
  availOff: { backgroundColor: Colors.errorBg },
  availText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  availTextOn: { color: Colors.success },
  availTextOff: { color: Colors.error },
  deleteMiniBtn: {
    padding: Spacing.xs,
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.xs,
  },
  fab: {
    position: 'absolute', bottom: 100, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center',
    alignItems: 'center', ...Shadows.lg,
  },
  fabText: { fontSize: 28, color: Colors.textInverse, fontWeight: FontWeights.bold, marginTop: -2 },
  fieldLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
});
