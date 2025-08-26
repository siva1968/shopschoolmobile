import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3', // Blue color for active tabs
        tabBarInactiveTintColor: '#757575', // Gray color for inactive tabs
        tabBarStyle: {
          backgroundColor: 'white', // White background
          borderBottomWidth: 18,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          height: 85,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="store" 
              size={26} 
              color={focused ? '#2196F3' : '#757575'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="receipt-long" 
              size={26} 
              color={focused ? '#2196F3' : '#757575'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="account-circle" 
              size={26} 
              color={focused ? '#2196F3' : '#757575'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="help-outline" 
              size={26} 
              color={focused ? '#2196F3' : '#757575'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
