import { colors, spacing, typography } from '@/theme/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({
  title,
  showBack = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* Left - Back Arrow or Logo */}
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={showBack ? handleBackPress : undefined}
          disabled={!showBack}
        >
          {showBack ? (
            <MaterialIcons name="arrow-back" size={28} color="white" />
          ) : (
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>

        {/* Center - Title */}
        <Text style={styles.headerTitle}>
          {title || 'ShopSchool'}
        </Text>

        {/* Right - Cart Icon */}
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="shopping-cart" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  header: {
    backgroundColor: colors.primary,
    height: 60,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.surface,
    ...typography.h6,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: spacing.sm,
  },
  testText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    margin: 5,
  },
  iconButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)', // Debug: very subtle background
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)', // Debug: very subtle background
  },
  menuButton: {
    marginLeft: -spacing.xs,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    backgroundColor: 'rgba(255,255,255,0.1)', // Debug: semi-transparent background
  },
  menuIcon: {
    margin: 0,
    minWidth: 48,
    minHeight: 48,
  },
  menuIconText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  loginButton: {
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  logoContainer: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', // Debug: semi-transparent background
  },
  logo: {
    width: 32,
    height: 32,
  },
  cartContainer: {
    position: 'relative',
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    backgroundColor: 'rgba(255,255,255,0.1)', // Debug: semi-transparent background
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
    backgroundColor: colors.secondary,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  userContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarLabel: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  menuAvatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  menuAvatarLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  userEmail: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  divider: {
    backgroundColor: colors.text.disabled,
  },
  menuItemTitle: {
    color: colors.text.primary,
    ...typography.body1,
  },
  logoutText: {
    color: colors.error,
  },
});
