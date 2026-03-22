import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MessProfileScreen from '../screens/MessProfileScreen';
import ConfirmSubscriptionScreen from '../screens/ConfirmSubscriptionScreen';
import MultiMessBundleScreen from '../screens/MultiMessBundleScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import WalletTopUpScreen from '../screens/WalletTopUpScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import SelectAddressScreen from '../screens/SelectAddressScreen';
import CartScreen from '../screens/CartScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import MySubscriptionsScreen from '../screens/MySubscriptionsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#a14000',
  outline: '#8c7166'
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.outline,
        tabBarStyle: {
          backgroundColor: '#faf9f8',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>🏠</Text> }}
      />
      <Tab.Screen 
        name="Mess" 
        component={ExploreScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>🍽️</Text> }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>💳</Text> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MessProfile" component={MessProfileScreen} />
        <Stack.Screen name="ConfirmSubscription" component={ConfirmSubscriptionScreen} options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="MultiMessBundle" component={MultiMessBundleScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="WalletTopUp" component={WalletTopUpScreen} options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="SelectAddress" component={SelectAddressScreen} options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
