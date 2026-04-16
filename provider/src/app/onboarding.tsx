// ==========================================
// 10-Step Onboarding Wizard
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';
import { providerApi, messApi, vendorApi, thaliApi } from '../services/api';
import StepperHeader from '../components/ui/StepperHeader';
import FormField from '../components/ui/FormField';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { INDIAN_STATES, DAYS_OF_WEEK, DIETARY_OPTIONS, MEAL_TIMES, MENU_CATEGORIES } from '../data/mockData';

const STEP_TITLES = [
  'Vendor Basic Details',
  'Mess Basic Information',
  'Location Details',
  'Operating Details',
  'Service Options',
  'Menu Setup',
  'Thali / Combo Setup',
  'Payment & Banking',
  'Media Upload',
  'Review & Submit',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { data, setStep, nextStep, prevStep, updateVendor, updateMess, updateAddress, updateOperating, updateServices, addThali, removeThali, updateBankDetails, setTerms, setPrivacy, resetOnboarding } = useOnboardingStore();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Guard: redirect to dashboard if vendor already has a mess
  useEffect(() => {
    const checkExistingMess = async () => {
      try {
        const messes = await messApi.getMyMesses();
        if (messes && messes.length > 0) {
          router.replace('/(tabs)');
        }
      } catch {
        // If check fails, let them continue onboarding
      }
    };
    checkExistingMess();
  }, []);

  // Local form state for thali builder
  const [thaliName, setThaliName] = useState('');
  const [thaliMealTime, setThaliMealTime] = useState('Lunch');
  const [thaliType, setThaliType] = useState('Veg');
  const [thaliItems, setThaliItems] = useState('');
  const [thaliPrice, setThaliPrice] = useState('');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const s = data.step;
    if (s === 1 && !data.vendor.name?.trim()) e.name = 'Name is required';
    if (s === 2 && !data.mess.name?.trim()) e.messName = 'Mess name is required';
    if (s === 2 && !data.mess.description?.trim()) e.description = 'Description is required';
    if (s === 3 && !data.address.line1?.trim()) e.line1 = 'Address is required';
    if (s === 3 && !data.address.city?.trim()) e.city = 'City is required';
    if (s === 3 && !data.address.state?.trim()) e.state = 'State is required';
    if (s === 3 && !/^\d{6}$/.test(data.address.pincode || '')) e.pincode = 'Valid 6-digit pincode required';
    if (s === 8 && !data.bankDetails.accountHolderName?.trim()) e.holderName = 'Required';
    if (s === 8 && !data.bankDetails.accountNumber?.trim()) e.accNum = 'Required';
    if (s === 8 && !data.bankDetails.ifscCode?.trim()) e.ifsc = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) nextStep();
  };

  const handleSubmit = async () => {
    if (!data.termsAccepted || !data.privacyAccepted) {
      Alert.alert('Required', 'Please accept Terms & Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      // 1. Update vendor profile (non-critical — don't abort if fails)
      try {
        await providerApi.updateProfile({
          name: data.vendor.name,
          email: data.vendor.email,
          gender: data.vendor.gender,
          dateOfBirth: data.vendor.dateOfBirth,
        });
      } catch (profileErr: any) {
        console.warn('Profile update skipped:', profileErr.message);
      }

      // 2. Register mess (CRITICAL)
      let messId = '';
      try {
        const messRes = await messApi.registerMess({
          name: data.mess.name || 'My Mess',
          description: data.mess.description || 'Home cooked food',
          messType: data.mess.messType || 'Veg',
          category: (data.mess as any).category || 'Tiffin',
          capacity: data.mess.seatingCapacity || 0,
          autoConfirm: false,
          deliveryAvailable: data.services.deliveryAvailable || false,
          dineIn: data.services.dineIn || false,
          takeAway: data.services.selfPickup !== false,
          lunchStartTime: data.operating.meals?.lunch?.startTime || '12:00:00',
          lunchEndTime: data.operating.meals?.lunch?.endTime || '15:00:00',
          dinnerStartTime: data.operating.meals?.dinner?.startTime || '19:00:00',
          dinnerEndTime: data.operating.meals?.dinner?.endTime || '22:00:00',
          deliveryCharge: data.services.deliveryCharge || 0,
          deliveryRadius: data.address.deliveryRadius || 5,
          line1: data.address.line1 || '',
          line2: data.address.line2 || '',
          city: data.address.city || '',
          state: data.address.state || '',
          pincode: data.address.pincode || '',
        });
        messId = messRes.id;
      } catch (messErr: any) {
        // If vendor already has a mess, continue gracefully
        if (messErr.message?.includes('already has')) {
          const messes = await messApi.getMyMesses();
          if (messes && messes.length > 0) {
            messId = messes[0].id;
          }
        } else {
          throw messErr; // Re-throw for real errors
        }
      }

      // 3. Create bank details (non-critical)
      if (data.bankDetails.accountNumber) {
        try {
          await vendorApi.createBankDetails({
            bankName: data.bankDetails.bankName || 'N/A',
            accountNumber: data.bankDetails.accountNumber,
            accountHolderName: data.bankDetails.accountHolderName || '',
            ifscCode: data.bankDetails.ifscCode || '',
            upiId: data.bankDetails.upiId,
          });
        } catch (bankErr: any) {
          console.warn('Bank details skipped:', bankErr.message);
        }
      }

      // 4. Add thalis if any (non-critical)
      if (messId) {
        for (const thali of data.thalis) {
          try {
            await thaliApi.addThali({
              messId,
              name: thali.name || '',
              mealTime: thali.mealTime,
              type: thali.type,
              itemsIncluded: thali.itemsIncluded,
              price: thali.price || 0,
            });
          } catch (thaliErr: any) {
            console.warn('Thali add skipped:', thaliErr.message);
          }
        }
      }

      resetOnboarding();
      Alert.alert('🎉 Success!', 'Your mess has been registered successfully!', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e: any) {
      console.error('Onboarding submit error:', e);
      Alert.alert('Error', e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addThaliItem = () => {
    if (!thaliName.trim() || !thaliPrice.trim()) return;
    addThali({
      name: thaliName,
      mealTime: thaliMealTime as any,
      type: thaliType as any,
      itemsIncluded: thaliItems,
      price: parseFloat(thaliPrice),
      availableDays: DAYS_OF_WEEK.slice(0, 6),
      isAvailable: true,
      isSpecial: false,
      isSubscriptionThali: false,
    });
    setThaliName(''); setThaliItems(''); setThaliPrice('');
  };

  const toggleDay = (day: string) => {
    const days = data.operating.operatingDays || [];
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    updateOperating({ operatingDays: updated });
  };

  const toggleDietary = (opt: string) => {
    const opts = data.services.dietaryOptions || [];
    const updated = opts.includes(opt) ? opts.filter(o => o !== opt) : [...opts, opt];
    updateServices({ dietaryOptions: updated });
  };

  const renderStep = () => {
    switch (data.step) {
      // =============== STEP 1 ===============
      case 1:
        return (
          <>
            <FormField label="Full Name" required placeholder="e.g. Sunita Sharma" value={data.vendor.name || ''} onChangeText={v => updateVendor({ name: v })} error={errors.name} />
            <FormField label="Email" placeholder="e.g. sunita@example.com" value={data.vendor.email || ''} onChangeText={v => updateVendor({ email: v })} keyboardType="email-address" />
            <FormField label="Phone Number" placeholder="Pre-filled from login" value={data.vendor.phone || ''} editable={false} style={{ backgroundColor: '#f0f0f0' }} />
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map(g => (
                <Pressable key={g} style={[styles.chip, data.vendor.gender === g && styles.chipActive]} onPress={() => updateVendor({ gender: g })}>
                  <Text style={[styles.chipText, data.vendor.gender === g && styles.chipTextActive]}>{g}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Date of Birth" placeholder="YYYY-MM-DD" value={data.vendor.dateOfBirth || ''} onChangeText={v => updateVendor({ dateOfBirth: v })} />
            <Text style={styles.fieldLabel}>Government ID Type</Text>
            <View style={styles.chipRow}>
              {(['Aadhaar', 'PAN', 'Voter ID', 'Driving License'] as const).map(t => (
                <Pressable key={t} style={[styles.chip, data.vendor.governmentIdType === t && styles.chipActive]} onPress={() => updateVendor({ governmentIdType: t })}>
                  <Text style={[styles.chipText, data.vendor.governmentIdType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Government ID Number" placeholder="e.g. XXXX-XXXX-1234" value={data.vendor.governmentIdNumber || ''} onChangeText={v => updateVendor({ governmentIdNumber: v })} />
          </>
        );

      // =============== STEP 2 ===============
      case 2:
        return (
          <>
            <FormField label="Mess Name" required placeholder="e.g. Sunita's Home Kitchen" value={data.mess.name || ''} onChangeText={v => updateMess({ name: v })} error={errors.messName} />
            <Text style={styles.fieldLabel}>Mess Type *</Text>
            <View style={styles.chipRow}>
              {(['Veg', 'Non-Veg', 'Both'] as const).map(t => (
                <Pressable key={t} style={[styles.chip, data.mess.messType === t && styles.chipActive]} onPress={() => updateMess({ messType: t })}>
                  <Text style={[styles.chipText, data.mess.messType === t && styles.chipTextActive]}>{t === 'Veg' ? '🟢 ' : t === 'Non-Veg' ? '🔴 ' : '🟡 '}{t}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Tagline" placeholder="Short catchy line (max 150 chars)" hint="Optional" value={data.mess.tagline || ''} onChangeText={v => updateMess({ tagline: v })} maxLength={150} />
            <FormField label="Full Description" required placeholder="Tell customers about your food..." value={data.mess.description || ''} onChangeText={v => updateMess({ description: v })} multiline style={{ height: 100, textAlignVertical: 'top', paddingTop: 14 }} error={errors.description} />
            <FormField label="Seating Capacity" placeholder="0 = no seating" value={String(data.mess.seatingCapacity || '')} onChangeText={v => updateMess({ seatingCapacity: parseInt(v) || 0 })} keyboardType="number-pad" />
            <FormField label="Max Daily Orders" required placeholder="e.g. 50" value={String(data.mess.maxDailyOrders || '')} onChangeText={v => updateMess({ maxDailyOrders: parseInt(v) || 0 })} keyboardType="number-pad" />
            <FormField label="FSSAI License Number" placeholder="Optional — shows verified badge" hint="Encouraged" value={data.mess.fssaiLicense || ''} onChangeText={v => updateMess({ fssaiLicense: v })} />
          </>
        );

      // =============== STEP 3 ===============
      case 3:
        return (
          <>
            <View style={{ marginBottom: 16 }}>
              <Pressable style={styles.uploadBtn} onPress={() => setLocationModalVisible(true)}>
                <Text style={styles.uploadBtnText}>📍 {data.address.latitude ? 'Location Pinned (GPS)' : 'Pin Location on Map'}</Text>
              </Pressable>
              {data.address.latitude && (
                <Text style={{ fontSize: 12, color: '#10B981', marginTop: 8, fontWeight: '600' }}>
                  ✓ Coordinates saved: {data.address.latitude.toFixed(4)}, {data.address.longitude?.toFixed(4)}
                </Text>
              )}
            </View>
            <FormField label="Address Line 1" required placeholder="e.g. Shop No 4, Main Street" value={data.address.line1 || ''} onChangeText={v => updateAddress({ line1: v })} error={errors.line1} />
            <FormField label="Address Line 2" placeholder="e.g. Opp. Park" value={data.address.line2 || ''} onChangeText={v => updateAddress({ line2: v })} />
            <FormField label="Area / Locality" required placeholder="e.g. Kothrud" value={data.address.area || ''} onChangeText={v => updateAddress({ area: v })} />
            <FormField label="City" required placeholder="e.g. Pune" value={data.address.city || ''} onChangeText={v => updateAddress({ city: v })} error={errors.city} />
            <Text style={styles.fieldLabel}>State *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {INDIAN_STATES.slice(0, 10).map(s => (
                <Pressable key={s} style={[styles.chip, data.address.state === s && styles.chipActive]} onPress={() => updateAddress({ state: s })}>
                  <Text style={[styles.chipText, data.address.state === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <FormField label="State (type if not listed)" placeholder="e.g. Maharashtra" value={data.address.state || ''} onChangeText={v => updateAddress({ state: v })} error={errors.state} />
            <FormField label="Pincode" required placeholder="e.g. 411038" value={data.address.pincode || ''} onChangeText={v => updateAddress({ pincode: v })} keyboardType="number-pad" maxLength={6} error={errors.pincode} />
            <FormField label="Landmark" placeholder="e.g. Near Karve Road Signal" value={data.address.landmark || ''} onChangeText={v => updateAddress({ landmark: v })} />
            <Text style={styles.fieldLabel}>Delivery Radius: {data.address.deliveryRadius || 5} km</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>0 km</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((data.address.deliveryRadius || 5) / 15) * 100}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>15 km</Text>
            </View>
            <View style={styles.sliderButtons}>
              {[0, 2, 5, 8, 10, 15].map(v => (
                <Pressable key={v} style={[styles.chip, data.address.deliveryRadius === v && styles.chipActive]} onPress={() => updateAddress({ deliveryRadius: v })}>
                  <Text style={[styles.chipText, data.address.deliveryRadius === v && styles.chipTextActive]}>{v} km</Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // =============== STEP 4 ===============
      case 4:
        return (
          <>
            <Text style={styles.fieldLabel}>Operating Days *</Text>
            <View style={styles.chipRow}>
              {DAYS_OF_WEEK.map(d => (
                <Pressable key={d} style={[styles.chip, (data.operating.operatingDays || []).includes(d) && styles.chipActive]} onPress={() => toggleDay(d)}>
                  <Text style={[styles.chipText, (data.operating.operatingDays || []).includes(d) && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <FormField label="Opening Time" required placeholder="e.g. 07:00" value={data.operating.openingTime || ''} onChangeText={v => updateOperating({ openingTime: v })} />
            <FormField label="Closing Time" required placeholder="e.g. 22:00" value={data.operating.closingTime || ''} onChangeText={v => updateOperating({ closingTime: v })} />
            <Text style={styles.sectionLabel}>Meal Timings</Text>
            <ToggleSwitch label="🌅 Breakfast" value={data.operating.meals?.breakfast?.enabled ?? true} onValueChange={v => updateOperating({ meals: { ...data.operating.meals!, breakfast: { ...data.operating.meals!.breakfast, enabled: v } } })} />
            {data.operating.meals?.breakfast?.enabled && (
              <View style={styles.timeRow}>
                <FormField label="Start" placeholder="07:00" value={data.operating.meals?.breakfast?.startTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, breakfast: { ...data.operating.meals!.breakfast, startTime: v } } })} />
                <FormField label="End" placeholder="10:00" value={data.operating.meals?.breakfast?.endTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, breakfast: { ...data.operating.meals!.breakfast, endTime: v } } })} />
              </View>
            )}
            <ToggleSwitch label="☀️ Lunch" value={data.operating.meals?.lunch?.enabled ?? true} onValueChange={v => updateOperating({ meals: { ...data.operating.meals!, lunch: { ...data.operating.meals!.lunch, enabled: v } } })} />
            {data.operating.meals?.lunch?.enabled && (
              <View style={styles.timeRow}>
                <FormField label="Start" placeholder="12:00" value={data.operating.meals?.lunch?.startTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, lunch: { ...data.operating.meals!.lunch, startTime: v } } })} />
                <FormField label="End" placeholder="15:00" value={data.operating.meals?.lunch?.endTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, lunch: { ...data.operating.meals!.lunch, endTime: v } } })} />
              </View>
            )}
            <ToggleSwitch label="🌙 Dinner" value={data.operating.meals?.dinner?.enabled ?? true} onValueChange={v => updateOperating({ meals: { ...data.operating.meals!, dinner: { ...data.operating.meals!.dinner, enabled: v } } })} />
            {data.operating.meals?.dinner?.enabled && (
              <View style={styles.timeRow}>
                <FormField label="Start" placeholder="19:00" value={data.operating.meals?.dinner?.startTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, dinner: { ...data.operating.meals!.dinner, startTime: v } } })} />
                <FormField label="End" placeholder="22:00" value={data.operating.meals?.dinner?.endTime || ''} onChangeText={v => updateOperating({ meals: { ...data.operating.meals!, dinner: { ...data.operating.meals!.dinner, endTime: v } } })} />
              </View>
            )}
          </>
        );

      // =============== STEP 5 ===============
      case 5:
        return (
          <>
            <ToggleSwitch label="🚗 Home Delivery Available" value={data.services.deliveryAvailable ?? false} onValueChange={v => updateServices({ deliveryAvailable: v })} />
            {data.services.deliveryAvailable && (
              <>
                <FormField label="Delivery Charge (₹)" placeholder="e.g. 20" value={String(data.services.deliveryCharge || '')} onChangeText={v => updateServices({ deliveryCharge: parseInt(v) || 0 })} keyboardType="number-pad" />
                <FormField label="Free Delivery Above (₹)" placeholder="e.g. 200" value={String(data.services.freeDeliveryAbove || '')} onChangeText={v => updateServices({ freeDeliveryAbove: parseInt(v) || 0 })} keyboardType="number-pad" />
              </>
            )}
            <ToggleSwitch label="🏪 Self Pickup Available" value={data.services.selfPickup ?? true} onValueChange={v => updateServices({ selfPickup: v })} />
            <ToggleSwitch label="🪑 Dine-in / Seating Available" value={data.services.dineIn ?? false} onValueChange={v => updateServices({ dineIn: v })} />
            <ToggleSwitch label="📋 Pre-booking Required" value={data.services.preBookingRequired ?? false} onValueChange={v => updateServices({ preBookingRequired: v })} />
            <ToggleSwitch label="🔄 Subscription Plans" description="Allow customers to subscribe" value={data.services.subscriptionPlans ?? false} onValueChange={v => updateServices({ subscriptionPlans: v })} />
            <Text style={styles.fieldLabel}>Packaging Type</Text>
            <View style={styles.chipRow}>
              {(['Disposable', 'Steel Tiffin', 'Both'] as const).map(p => (
                <Pressable key={p} style={[styles.chip, data.services.packagingType === p && styles.chipActive]} onPress={() => updateServices({ packagingType: p })}>
                  <Text style={[styles.chipText, data.services.packagingType === p && styles.chipTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Special Dietary Options</Text>
            <View style={styles.chipRow}>
              {DIETARY_OPTIONS.map(d => (
                <Pressable key={d} style={[styles.chip, (data.services.dietaryOptions || []).includes(d) && styles.chipActive]} onPress={() => toggleDietary(d)}>
                  <Text style={[styles.chipText, (data.services.dietaryOptions || []).includes(d) && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      // =============== STEP 6 ===============
      case 6:
        return (
          <>
            <Text style={styles.helperText}>Add individual menu items (not thalis). These can also be ordered separately.</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>💡 You can skip this step and add items later from the Menu tab.</Text>
            </View>
            <Text style={styles.fieldLabel}>Category-based items will be available in Phase 2.</Text>
            <Text style={styles.fieldLabel}>For now, proceed to Thali setup →</Text>
          </>
        );

      // =============== STEP 7 ===============
      case 7:
        return (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>⭐ Most successful mess providers list at least 2–3 thalis</Text>
            </View>

            {/* Added thalis list */}
            {data.thalis.length > 0 && (
              <View style={styles.addedList}>
                <Text style={styles.addedTitle}>Added Thalis ({data.thalis.length})</Text>
                {data.thalis.map((t, idx) => (
                  <View key={idx} style={styles.addedItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addedName}>{t.type === 'Non-Veg' ? '🔴' : '🟢'} {t.name}</Text>
                      <Text style={styles.addedMeta}>₹{t.price} • {t.mealTime}</Text>
                    </View>
                    <Pressable onPress={() => removeThali(idx)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add form */}
            <Text style={styles.sectionLabel}>Add New Thali</Text>
            <FormField label="Thali Name" required placeholder="e.g. Special Rajasthani Thali" value={thaliName} onChangeText={setThaliName} />
            <Text style={styles.fieldLabel}>Meal Time</Text>
            <View style={styles.chipRow}>
              {MEAL_TIMES.map(t => (
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
            <FormField label="Items Included" required placeholder="3 Roti, 1 Sabzi, Dal, Rice, Papad..." value={thaliItems} onChangeText={setThaliItems} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: 14 }} />
            <FormField label="Price (₹)" required placeholder="e.g. 120" value={thaliPrice} onChangeText={setThaliPrice} keyboardType="number-pad" />
            <Pressable style={styles.addItemBtn} onPress={addThaliItem}>
              <Text style={styles.addItemBtnText}>+ Add to List</Text>
            </Pressable>
          </>
        );

      // =============== STEP 8 ===============
      case 8:
        return (
          <>
            <View style={styles.securityNote}>
              <Text style={styles.securityText}>🔒 Your banking details are encrypted and only used for payouts.</Text>
            </View>
            <FormField label="Account Holder Name" required placeholder="e.g. Sunita Sharma" value={data.bankDetails.accountHolderName || ''} onChangeText={v => updateBankDetails({ accountHolderName: v })} error={errors.holderName} />
            <FormField label="Bank Account Number" required placeholder="e.g. 1234567890" value={data.bankDetails.accountNumber || ''} onChangeText={v => updateBankDetails({ accountNumber: v })} keyboardType="number-pad" error={errors.accNum} secureTextEntry />
            <FormField label="Confirm Account Number" required placeholder="Re-enter account number" keyboardType="number-pad" />
            <FormField label="IFSC Code" required placeholder="e.g. SBIN0001234" value={data.bankDetails.ifscCode || ''} onChangeText={v => updateBankDetails({ ifscCode: v.toUpperCase() })} autoCapitalize="characters" error={errors.ifsc} />
            <FormField label="UPI ID" placeholder="e.g. sunita@upi (recommended)" hint="Optional" value={data.bankDetails.upiId || ''} onChangeText={v => updateBankDetails({ upiId: v })} />
          </>
        );

      // =============== STEP 9 ===============
      case 9:
        return (
          <>
            <Text style={styles.helperText}>Upload photos of your mess and food to attract more customers.</Text>
            <View style={styles.uploadBox}>
              <Text style={styles.uploadEmoji}>📸</Text>
              <Text style={styles.uploadTitle}>Mess Cover Image</Text>
              <Text style={styles.uploadHint}>Minimum 800×400px • Required</Text>
              <Pressable style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Choose File</Text>
              </Pressable>
            </View>
            <View style={styles.uploadBox}>
              <Text style={styles.uploadEmoji}>🖼️</Text>
              <Text style={styles.uploadTitle}>Gallery Photos</Text>
              <Text style={styles.uploadHint}>Up to 8 photos</Text>
              <Pressable style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Choose Files</Text>
              </Pressable>
            </View>
            <View style={styles.uploadBox}>
              <Text style={styles.uploadEmoji}>🍽️</Text>
              <Text style={styles.uploadTitle}>Food / Thali Photos</Text>
              <Text style={styles.uploadHint}>Up to 12 photos</Text>
              <Pressable style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Choose Files</Text>
              </Pressable>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>💡 You can add photos later from your Profile settings</Text>
            </View>
          </>
        );

      // =============== STEP 10 ===============
      case 10:
        return (
          <>
            <Text style={styles.helperText}>Review all your information before submitting.</Text>
            
            {[
              { title: '1. Vendor Details', check: !!data.vendor.name, content: `${data.vendor.name || '—'} • ${data.vendor.gender || '—'}` },
              { title: '2. Mess Info', check: !!data.mess.name, content: `${data.mess.name || '—'} • ${data.mess.messType || '—'}` },
              { title: '3. Location', check: !!data.address.city, content: `${data.address.line1 || '—'}, ${data.address.city || '—'} - ${data.address.pincode || '—'}` },
              { title: '4. Operating', check: !!(data.operating.operatingDays?.length), content: `${(data.operating.operatingDays || []).join(', ')} • ${data.operating.openingTime || '—'}-${data.operating.closingTime || '—'}` },
              { title: '5. Services', check: true, content: `Delivery: ${data.services.deliveryAvailable ? 'Yes' : 'No'} • Pickup: ${data.services.selfPickup ? 'Yes' : 'No'}` },
              { title: '6–7. Menu / Thalis', check: data.thalis.length > 0, content: `${data.thalis.length} thalis added` },
              { title: '8. Banking', check: !!data.bankDetails.accountNumber, content: data.bankDetails.accountNumber ? `A/C ****${data.bankDetails.accountNumber.slice(-4)}` : 'Not set' },
              { title: '9. Media', check: false, content: 'Can be added later' },
            ].map((section, idx) => (
              <Pressable key={idx} style={styles.reviewSection} onPress={() => setStep(idx + 1)}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewCheck}>{section.check ? '✅' : '⚠️'}</Text>
                  <Text style={styles.reviewTitle}>{section.title}</Text>
                  <Text style={styles.reviewEdit}>Edit →</Text>
                </View>
                <Text style={styles.reviewContent}>{section.content}</Text>
              </Pressable>
            ))}

            {/* Terms */}
            <View style={styles.checkboxRow}>
              <Pressable style={[styles.checkbox, data.termsAccepted && styles.checkboxChecked]} onPress={() => setTerms(!data.termsAccepted)}>
                {data.termsAccepted && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>
              <Text style={styles.checkboxLabel}>I agree to the Terms & Conditions</Text>
            </View>
            <View style={styles.checkboxRow}>
              <Pressable style={[styles.checkbox, data.privacyAccepted && styles.checkboxChecked]} onPress={() => setPrivacy(!data.privacyAccepted)}>
                {data.privacyAccepted && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>
              <Text style={styles.checkboxLabel}>I agree to the Privacy Policy</Text>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <StepperHeader
          currentStep={data.step}
          totalSteps={10}
          stepTitle={STEP_TITLES[data.step - 1]}
          onBack={prevStep}
          showBack={data.step > 1}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {data.step > 1 ? (
          <Pressable style={styles.backBtn} onPress={prevStep}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        ) : <View style={{ flex: 1 }} />}

        {data.step < 10 ? (
          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.submitBtn, (!data.termsAccepted || !data.privacyAccepted) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit ✓</Text>}
          </Pressable>
        )}
      </View>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelect={(loc) => {
          updateAddress({
            latitude: loc.lat,
            longitude: loc.lng,
            area: loc.area || data.address.area,
          });
        }}
        initialLocation={data.address.latitude ? { lat: data.address.latitude, lng: data.address.longitude || 0, area: data.address.area || '' } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  headerArea: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: Spacing.xl },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.massive },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  backBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.background, marginRight: Spacing.md },
  backBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  nextBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.primary, marginLeft: Spacing.md },
  nextBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textInverse },
  submitBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.success, marginLeft: Spacing.md },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textInverse },
  fieldLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  sectionLabel: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  helperText: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  infoBox: { backgroundColor: Colors.infoBg, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.xl },
  infoText: { fontSize: FontSizes.sm, color: Colors.infoDark, lineHeight: 20 },
  securityNote: { backgroundColor: Colors.successBg, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.xl },
  securityText: { fontSize: FontSizes.sm, color: Colors.successDark },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  sliderLabel: { fontSize: FontSizes.sm, color: Colors.textTertiary },
  sliderTrack: { flex: 1, height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  sliderButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  addedList: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight },
  addedTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  addedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  addedName: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  addedMeta: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.errorBg, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: Colors.error, fontWeight: FontWeights.bold, fontSize: 14 },
  addItemBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  addItemBtnText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  uploadBox: {
    backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.lg,
  },
  uploadEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  uploadTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: 4 },
  uploadHint: { fontSize: FontSizes.sm, color: Colors.textTertiary, marginBottom: Spacing.md },
  uploadBtn: { backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  uploadBtnText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  reviewSection: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  reviewCheck: { fontSize: 16 },
  reviewTitle: { flex: 1, fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  reviewEdit: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.bold },
  reviewContent: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginLeft: 28 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: Colors.textInverse, fontSize: 14, fontWeight: FontWeights.bold },
  checkboxLabel: { fontSize: FontSizes.md, color: Colors.textSecondary, flex: 1 },
});
