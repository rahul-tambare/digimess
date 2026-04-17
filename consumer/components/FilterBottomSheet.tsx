import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { X } from 'lucide-react-native';

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onClear: () => void;
}

export function FilterBottomSheet({ visible, onClose, onApply, onClear }: FilterBottomSheetProps) {
  const [selected, setSelected] = React.useState<Record<string, string>>({});

  const handleSelect = (category: string, option: string) => {
    setSelected(prev => ({
      ...prev,
      [category]: prev[category] === option ? undefined : option, // toggle logic
    } as any));
  };

  const handleClear = () => {
    setSelected({});
    onClear();
  };

  const FilterSection = ({ title, options, category }: { title: string; options: string[], category: string }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.chipGrid}>
        {options.map((opt, i) => {
          const isActive = selected[category] === opt;
          return (
            <TouchableOpacity 
              key={i} 
              style={[s.chip, isActive && s.chipActive]} 
              activeOpacity={0.7}
              onPress={() => handleSelect(category, opt)}
            >
              <Text style={[s.chipText, isActive && s.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={s.sheet}>
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <FilterSection title="Mess Type" category="type" options={['Veg Only', 'Non-Veg', 'Both']} />
            <FilterSection title="Price per Thali" category="price" options={['Under ₹100', '₹100 - ₹200', '₹200+']} />
            <FilterSection title="Dietary Options" category="diet" options={['Jain', 'Sattvic', 'High Protein', 'Diabetic-friendly']} />
            <FilterSection title="Distance" category="distance" options={['Within 1 km', 'Within 2 km', 'Within 5 km']} />
            <FilterSection title="Delivery Options" category="delivery" options={['Home Delivery', 'Self Pickup', 'Dine-in']} />
          </ScrollView>

          <View style={s.actionRow}>
            <TouchableOpacity style={s.clearBtn} onPress={handleClear}>
              <Text style={s.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={() => onApply(selected)}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, maxHeight: '85%',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FF6B35', borderColor: '#FF6B35',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFF' },
  actionRow: {
    flexDirection: 'row', paddingTop: 16, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12,
  },
  clearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF',
  },
  clearBtnText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  applyBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FF6B35',
    ...Platform.select({
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 12px rgba(255,107,53,0.2)' },
    }),
  },
  applyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
