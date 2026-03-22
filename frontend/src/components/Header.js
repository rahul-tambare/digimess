import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../utils/api';

const LOGO = require('../../assets/logo.png');

const Header = ({ navigation, showProfile = true, showBack = false, style, noTopInset = false }) => {
  const insets = useSafeAreaInsets();
  const paddingTop = noTopInset ? 16 : insets.top + 16;
  const isFocused = useIsFocused();
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (isFocused && showProfile) {
      api.get('/user/profile')
         .then(res => setHasSubscription(res.data.hasActiveSubscription))
         .catch(() => null);
    }
  }, [isFocused, showProfile]);

  return (
    <View style={[styles.header, { paddingTop }, style]}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
        ) : (
          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
        )}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.iconText}>🔔</Text>
          <View style={styles.badge} />
        </TouchableOpacity>

        {showProfile && (
          <TouchableOpacity 
            style={[styles.profileAvatar, hasSubscription && { borderColor: '#1b6d24' }]} 
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarPlaceholder}>
               <Image 
                  source={{uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0MHt330f6dP8v6udqhFKlWjmcb7s6OJa7p8gDSv0-pzxgTA9aMhOVx4-6Sd5idRKmff3obZHktQtEtdQ5X6534rJgvOd206ODnLUfFoG2G9Gj21-xJEeQ8Q4pkkuGfSMBNwx4LcbwzzGw3FA-_INheY6bBoeU-fs5L1hGBUbetADm052dagzx_IQss8NvKu-DdsS66556q7ezBrFlR-VDU0Kct7eh2xzCxwTfp7l4xhbLZ34JKvVe4Ns0dm_GMI8la_sg-r551HA'}} 
                  style={styles.avatarImage} 
                />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // Premium soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 99,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backIconText: {
    fontSize: 28,
    color: '#f26d21',
    fontWeight: '600',
  },
  logoImg: {
    height: 40,
    width: 110,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f3f2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#f26d21', // Profile pop
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

export default Header;
