import { useAuth } from '@/contexts/AuthContext';
import { reconstructEmail } from '@/lib/utils';
import { colors, spacing, typography } from '@/theme/theme';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Divider,
    Portal,
    Surface,
    Text
} from 'react-native-paper';

interface UserMenuProps {
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    student_name?: string;
    metadata?: Record<string, unknown>;
  };
  visible: boolean;
  onDismiss: () => void;
  anchorPosition?: {
    x: number;
    y: number;
  };
}

export default function UserMenu({ 
  user, 
  visible, 
  onDismiss,
  anchorPosition 
}: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onDismiss();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Generate initials for avatar
  const getInitials = () => {
    if (user?.student_name) {
      const names = user.student_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.student_name.substring(0, 2).toUpperCase();
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (user?.student_name) {
      return user.student_name;
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return 'User';
  };

  const getUserEmail = () => {
    return reconstructEmail(user?.email as string) || 'No email available';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onDismiss}
        >
          <View 
            style={[
              styles.menuContainer,
              anchorPosition && {
                position: 'absolute',
                top: anchorPosition.y + 10,
                right: 20,
              }
            ]}
          >
            <Surface style={styles.menu} elevation={4}>
              {/* User Info Section */}
              <View style={styles.userInfoSection}>
                <View style={styles.userInfoRow}>
                  <Avatar.Text 
                    size={40}
                    label={getInitials()}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                  <View style={styles.userTextInfo}>
                    <Text 
                      variant="titleMedium" 
                      style={styles.userName}
                      numberOfLines={2}
                    >
                      {getUserDisplayName()}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={styles.userEmail}
                      numberOfLines={2}
                    >
                      {getUserEmail()}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Menu Actions */}
              <View style={styles.actionsSection}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    onDismiss();
                    // Navigate to profile or handle profile action
                  }}
                >
                  <Text variant="bodyLarge" style={styles.menuItemText}>
                    Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    onDismiss();
                    // Navigate to orders or handle orders action
                  }}
                >
                  <Text variant="bodyLarge" style={styles.menuItemText}>
                    My Orders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    onDismiss();
                    // Navigate to settings or handle settings action
                  }}
                >
                  <Text variant="bodyLarge" style={styles.menuItemText}>
                    Settings
                  </Text>
                </TouchableOpacity>
              </View>

              <Divider style={styles.divider} />

              {/* Logout Button */}
              <View style={styles.logoutSection}>
                <Button
                  mode="text"
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                  icon={isLoggingOut ? undefined : "logout"}
                  labelStyle={styles.logoutButtonLabel}
                  style={styles.logoutButton}
                >
                  {isLoggingOut ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.error} />
                      <Text variant="bodyMedium" style={styles.logoutText}>
                        Logging out...
                      </Text>
                    </View>
                  ) : (
                    'Logout'
                  )}
                </Button>
              </View>
            </Surface>
          </View>
        </TouchableOpacity>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: 60,
    marginRight: spacing.md,
    minWidth: 240,
    maxWidth: 280,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    elevation: 8,
  },
  userInfoSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userTextInfo: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  userName: {
    color: colors.text.primary,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  userEmail: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  divider: {
    backgroundColor: colors.text.disabled,
    marginVertical: spacing.xs,
  },
  actionsSection: {
    paddingVertical: spacing.xs,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    color: colors.text.primary,
    ...typography.body1,
  },
  logoutSection: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoutButton: {
    justifyContent: 'flex-start',
  },
  logoutButtonLabel: {
    color: colors.error,
    ...typography.body1,
  },
  logoutText: {
    color: colors.error,
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
