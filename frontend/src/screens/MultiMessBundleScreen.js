import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#a14000',
  primaryContainer: '#f26d21',
  secondary: '#1b6d24',
  secondaryContainer: '#a0f399',
  surface: '#faf9f8',
  surfaceContainerLow: '#f4f3f2',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#584238',
  tertiaryFixed: '#ffdeac'
};

const BUNDLE_MESSES = [
  { id: 1, name: 'The Green Grove', style: 'Organic', rating: '4.8', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCW4waxyD6r4etNzpDt-k2tmk9jvx6Nb9lq5xWljgIqaPiTU8lXXzsQ_gU-QtjBbYbX2I30nrbSR4_MGgVWrs0jiy568vr4I3q9WPQkXamq4G7NOPORHtPg0rKsr8VwCwdNMhXmXpUpzrQzL6YrCn5cGuvcQEJs_vTt-SrfMYdLKgqE4PlxmlZ-jyV7IJXgzgxX6yqJEIp9kOha5kkOBFuyyipqvAONZvEqY6Pad0s5auPDm8UhdICLgHxFWkKB3_d_P9cYqRh1pDY' },
  { id: 2, name: 'Heritage Spice', style: 'Traditional', rating: '4.9', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzYmRci7Up392GJtYBcbchi4rw8ysbraEAbWXOv7ICOw9cADPQqlOJ8_Pd9yHcvRqzmHlnNkbCpgOvvGB9RS-RhF7u64yPBCYBdR4BGE3XIbp-oBd3VYfUy7gmepEwNekpI4idvQwZroo80-j-qRXan4XMw5lmcWOlh7YsSfupaxECIQ-67dcO-fd-9tUels0GtU_W-VC7MQs2Z1SCuSQ3g98AraRFZNkxraEOPW6sTIEnPqw35dqjoXab_IRhMllCfz2O8yhEl_k' },
  { id: 3, name: 'The Artisan Grill', style: 'Protein', rating: '4.7', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw2TE_CXiZ1VWrFTBJORRy4DtrhpBvy45BbAN7ibvm8zmRNWLAG-O6mHsA1zkkxKKE81UrQrjxZj_Y3-E-_CZeh-t16UibtDA5GmENWBjaBnmXtEgxhYupLrZWOZ4AIRM0oasbI_TslSdLHw0lQboe36j6ksmfQ-OZm_NCdms75QoHj1NshcInNHMdxwqeS79dfT31wtoDu4JXD99lHRafGkXDsH5SkDL1UOkqWxDEkwyP_7nm5eR5A0tulQuFestBMvl2duxBm3M' }
];

export default function MultiMessBundleScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState([1, 2]);

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else setSelected([...selected, id]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={{fontSize: 24}}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>The Editorial Kitchen</Text>
        <View style={{width: 24}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingBottom: 100}}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTag}>Curated Dining Experience</Text>
          <Text style={styles.heroTitle}>The 3 Restaurant Bundle.</Text>
          <Text style={styles.heroDesc}>Craft your personal culinary circuit. Select any 3 messes and enjoy the freedom of visiting them up to 2 times every single day.</Text>
        </View>

        <View style={styles.selectionCanvas}>
          <Text style={styles.sectionTitle}>Choose Your Trio</Text>
          <Text style={styles.sectionDesc}>Select three participating mess kitchens to form your custom monthly bundle.</Text>

          <View style={styles.grid}>
            {BUNDLE_MESSES.map((mess) => {
              const isSelected = selected.includes(mess.id);
              return (
                <TouchableOpacity 
                  key={mess.id} 
                  style={[styles.messCard, isSelected && styles.messCardSelected]}
                  activeOpacity={0.9}
                  onPress={() => toggleSelect(mess.id)}
                >
                  <View style={styles.messImageContainer}>
                    <Image source={{uri: mess.img}} style={styles.messImage} />
                  </View>
                  <View style={styles.messHeaderRow}>
                    <Text style={styles.messName}>{mess.name}</Text>
                    {isSelected && <Text style={{color: COLORS.primary, fontSize: 18}}>✅</Text>}
                  </View>
                  <View style={styles.tagsContainer}>
                    <View style={styles.tagPrimary}><Text style={styles.tagTextPrimary}>{mess.style}</Text></View>
                    <View style={styles.tagSecondary}><Text style={styles.tagTextSecondary}>⭐ {mess.rating}</Text></View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action / Total Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View>
          <Text style={styles.totalLabel}>TOTAL MONTHLY COST</Text>
          <Text style={styles.totalPrice}>₹3,499</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('OrderSuccess')}
        >
          <Text style={styles.checkoutBtnText}>Start Bundle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', fontStyle: 'italic', color: COLORS.onSurface },
  heroSection: { marginBottom: 32 },
  heroTag: { alignSelf: 'flex-start', backgroundColor: COLORS.secondaryContainer, color: '#005312', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, fontSize: 12, fontWeight: '800', marginBottom: 16 },
  heroTitle: { fontSize: 40, fontWeight: '800', color: COLORS.onSurface, marginBottom: 16 },
  heroDesc: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24 },
  selectionCanvas: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 32, padding: 24, paddingBottom: 32, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.05, shadowRadius: 20 },
  sectionTitle: { fontSize: 28, fontWeight: '800', color: COLORS.onSurface, marginBottom: 8 },
  sectionDesc: { fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: 24 },
  grid: { gap: 16 },
  messCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  messCardSelected: { borderColor: COLORS.primary, backgroundColor: '#fff' },
  messImageContainer: { height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  messImage: { width: '100%', height: '100%' },
  messHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  messName: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  tagsContainer: { flexDirection: 'row', gap: 8 },
  tagPrimary: { backgroundColor: 'rgba(160,243,153,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagTextPrimary: { fontSize: 10, fontWeight: '800', color: '#005312', textTransform: 'uppercase' },
  tagSecondary: { backgroundColor: COLORS.tertiaryFixed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagTextSecondary: { fontSize: 10, fontWeight: '800', color: '#3f2a00', textTransform: 'uppercase' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surfaceContainerHigh, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  totalLabel: { fontSize: 10, fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: 4 },
  totalPrice: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  checkoutBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 32 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
