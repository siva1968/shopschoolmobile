import { useAuth } from '@/contexts/AuthContext';
import { reconstructEmail } from '@/lib/utils';
import { colors, spacing, typography } from '@/theme/theme';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Divider,
  IconButton,
  Surface,
  Text,
  useTheme
} from 'react-native-paper';

// Extended user type for student details
interface ExtendedUser {
  student_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  student_profile?: {
    father_name?: string;
    mother_phone?: string;
    mother_email?: string;
    class?: {
      name?: string;
    };
    section?: {
      name?: string;
    };
    second_language?: {
      name?: string;
    };
    third_language?: {
      name?: string;
    };
    fourth_language?: {
      name?: string;
    };
    academic?: {
      id?: string;
    };
  };
}

interface StudentDetailsProps {
  expanded?: boolean;
  onToggle?: () => void;
}

export default function StudentDetails({ 
  expanded = false, 
  onToggle 
}: StudentDetailsProps) {
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Cast user to extended type
  const extendedUser = user as ExtendedUser;

  // Extract student information from user data
  const studentName = extendedUser.student_name || null;
  const parentName = extendedUser.student_profile?.father_name || null;
  const studentClass = extendedUser.student_profile?.class?.name || null;
  const sectionName = extendedUser.student_profile?.section?.name || null;
  const secondLanguage = extendedUser.student_profile?.second_language?.name || null;
  const thirdLanguage = extendedUser.student_profile?.third_language?.name || null;
  const fourthLanguage = extendedUser.student_profile?.fourth_language?.name || null;
  const phone = extendedUser.student_profile?.mother_phone || extendedUser.phone || null;
  const email = reconstructEmail(extendedUser.email as string) || null;

  const DetailRow = ({ label, value }: { label: string; value: string | null }) => (
    <View style={styles.detailRow}>
      <Text variant="bodyMedium" style={styles.label}>
        {label}:
      </Text>
      <Text variant="bodyMedium" style={styles.value}>
        {value || '-'}
      </Text>
    </View>
  );

  return (
    <Surface style={styles.container} elevation={2}>
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.basicInfo}>
            <Text variant="bodyMedium" style={styles.headerText} numberOfLines={1}>
              <Text style={styles.headerLabel}>Name:</Text> {studentName || '-'}
            </Text>
            <Text variant="bodyMedium" style={styles.headerText} numberOfLines={1}>
              <Text style={styles.headerLabel}>Parent:</Text> {parentName || '-'}
            </Text>
          </View>
          
          {onToggle && (
            <IconButton
              icon={expanded ? "chevron-up" : "chevron-down"}
              iconColor={colors.surface}
              size={20}
              onPress={onToggle}
            />
          )}
        </View>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          <Divider style={styles.divider} />
          
          <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
            <DetailRow label="Class" value={studentClass} />
            
            {sectionName && (
              <DetailRow label="Section" value={sectionName} />
            )}
            
            <DetailRow label="II Language" value={secondLanguage} />
            <DetailRow label="III Language" value={thirdLanguage} />
            
            {fourthLanguage && (
              <DetailRow label="IV Language" value={fourthLanguage} />
            )}
            
            <View style={styles.contactSection}>
              <View style={styles.contactRow}>
                <Text variant="bodyMedium" style={styles.contactIcon}>📞</Text>
                <View style={styles.contactInfo}>
                  <Text variant="bodyMedium" style={styles.label}>Phone:</Text>
                  <Text variant="bodyMedium" style={styles.value}>{phone || '-'}</Text>
                </View>
              </View>
              
              <View style={styles.contactRow}>
                <Text variant="bodyMedium" style={styles.contactIcon}>✉️</Text>
                <View style={styles.contactInfo}>
                  <Text variant="bodyMedium" style={styles.label}>Email:</Text>
                  <Text variant="bodyMedium" style={[styles.value, styles.emailText]} numberOfLines={2}>
                    {email || '-'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.text.secondary,
    borderRadius: 0,
  },
  header: {
    backgroundColor: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  basicInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  headerText: {
    color: colors.surface,
    ...typography.body2,
  },
  headerLabel: {
    fontWeight: 'bold',
  },
  expandedContent: {
    backgroundColor: colors.text.secondary,
  },
  divider: {
    backgroundColor: colors.surface,
    opacity: 0.3,
  },
  detailsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 200, // Limit height for scrolling
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    color: colors.surface,
    flex: 0.4,
    fontWeight: 'bold',
    fontSize: 14,
  },
  value: {
    color: colors.surface,
    flex: 0.6,
    textAlign: 'right',
    ...typography.body2,
  },
  contactSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  contactIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emailText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
