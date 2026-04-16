import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface FormInputProps {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  maxLength?: number;
  leftIcon?: React.ReactNode;
  textAlign?: 'left' | 'center' | 'right';
  secureTextEntry?: boolean;
}

export function FormInput({
  label, placeholder, value, onChangeText, onBlur,
  error, keyboardType = 'default', maxLength, leftIcon, textAlign = 'left',
  secureTextEntry,
}: FormInputProps) {
  return (
    <View style={s.wrapper}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputRow, error && s.inputError]}>
        {leftIcon && <View style={s.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[s.input, { textAlign }]}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: {
    fontSize: 13, fontWeight: '700', color: '#475569',
    marginBottom: 8, letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputError: { borderColor: '#EF4444' },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14,
    fontSize: 16, fontWeight: '600', color: '#0F172A',
  },
  error: {
    color: '#EF4444', fontSize: 12, fontWeight: '500', marginTop: 6,
  },
});
