import { useShop } from '@/contexts/ShopContext';
import { colors, spacing } from '@/theme/theme';
import { router } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Icon,
  Surface,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FooterProps {
  showQuickLinks?: boolean;
  showContact?: boolean;
  showSocial?: boolean;
  showProducts?: boolean;
  showPayments?: boolean;
  showSchools?: boolean;
}

export default function Footer({
  showQuickLinks = true,
  showContact = true,
  showSocial = true,
  showProducts = true,
  showPayments = true,
  showSchools = true,
}: FooterProps) {
  const { setActiveTab } = useShop();
  const insets = useSafeAreaInsets();

  const handleProductClick = (tabValue: string) => {
    setActiveTab(tabValue);
    router.push('/shop' as any);
  };

  const handleCall = async () => {
    try {
      await Linking.openURL('tel:917702800800');
    } catch (error) {
      console.error('Error opening phone:', error);
    }
  };

  const handleEmail = async () => {
    try {
      await Linking.openURL('mailto:epistemo@shopschool.in');
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const handleMap = async () => {
    try {
      const mapUrl = 'https://www.google.com/maps/dir//Aparna+Cyber+Life,+Plot+%23B4,+Nallagandla+Residential+Complex,+opposite+Lane,+HUDA+Layout,+Nallagandla,+Telangana+500019/@17.4681805,78.2220739,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3bcb92d9bfaa8c15:0xdd3f82e04631f8f9!2m2!1d78.3044757!2d17.4681975?entry=ttu&g_ep=EgoyMDI1MDMxOS4yIKXMDSoASAFQAw%3D%3D';
      await Linking.openURL(mapUrl);
    } catch (error) {
      console.error('Error opening map:', error);
    }
  };

  const handleSocialLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening social link:', error);
    }
  };

  const contactLinks = [
    {
      text: '+91 7702 800 800',
      icon: 'phone',
      onPress: handleCall,
    },
    {
      text: 'epistemo@shopschool.in',
      icon: 'email-outline',
      onPress: handleEmail,
    },
    {
      text: 'Plot #B4, Nallagandla Residential Complex, HUDA Layout, Aparna Cyber Life Opposite Lane, Nallagandla, Serilingampally, Hyderabad, Telangana 500019',
      icon: 'map-marker-outline',
      onPress: handleMap,
    },
  ];

  const quickLinks = [
    { title: 'Privacy Policy', route: '/privacy-policy' },
    { title: 'Terms & Conditions', route: '/terms-conditions' },
    { title: 'Return & Refund Policy', route: '/return-refund-policy' },
    { title: 'FAQs', route: '/faqs' },
    { title: 'Contact Us', route: '/contact-us' },
    { title: 'About Us', route: '/about-us' },
  ];

  const productLinks = [
    {
      title: 'Books and Stationery Kits',
      onPress: () => handleProductClick('kits'),
    },
    {
      title: 'Uniforms',
      onPress: () => handleProductClick('uniforms'),
    },
  ];

  const paymentLinks = [
    { title: 'Credit Card', route: '/credit-card' },
    { title: 'Debit Card', route: '/debit-card' },
    { title: 'Net Banking', route: '/net-banking' },
  ];

  const schoolLinks = [
    {
      title: 'Epistemo Vikas Leadership School, Nallagandla',
      url: 'https://epistemo.in/',
    },
    {
      title: 'Vikas The Concept School, Bachupally', 
      url: 'https://vikasconcept.com/',
    },
  ];

  const socialLinks = [
    { icon: 'phone', url: 'tel:917702800800' },
    { icon: 'email', url: 'mailto:admissions@epistemo.in' },
    { icon: 'facebook', url: 'https://www.facebook.com/epistemoschool' },
    { icon: 'twitter', url: 'https://www.twitter.com/epistemoschool' },
    { icon: 'instagram', url: 'https://www.instagram.com/epistemoschool' },
    { icon: 'linkedin', url: 'https://www.linkedin.com/school/epistemo' },
    { icon: 'youtube', url: 'https://www.youtube.com/epistemoschool' },
  ];

  const ContactItem = ({ contact }: { contact: typeof contactLinks[0] }) => (
    <TouchableOpacity onPress={contact.onPress} style={styles.contactItem}>
      <Icon source={contact.icon} size={20} color={colors.primary} />
      <Text style={styles.contactText} variant="bodyMedium">
        {contact.text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Blue divider line */}
      <View style={styles.topDivider} />
      
      <Surface style={[styles.footer, { paddingBottom: insets.bottom }]} elevation={0}>
        <View style={styles.container}>
          
          {/* Main Content Grid */}
          <View style={styles.mainGrid}>
            
            {/* Contact Us Section */}
            {showContact && (
              <View style={styles.gridItem}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Contact Us
                </Text>
                <View style={styles.blueDivider} />
                <View style={styles.contactContainer}>
                  {contactLinks.map((contact, index) => (
                    <ContactItem key={index} contact={contact} />
                  ))}
                </View>
              </View>
            )}

            {/* Quick Links Section */}
            {showQuickLinks && (
              <View style={styles.gridItem}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Quick Links
                </Text>
                <View style={styles.blueDivider} />
                <View style={styles.linksContainer}>
                  {quickLinks.map((link, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => router.push(link.route as any)}
                      style={styles.linkItem}
                    >
                      <Text style={styles.linkText} variant="bodyMedium">
                        {link.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Product List Section */}
            {showProducts && (
              <View style={styles.gridItem}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Product List
                </Text>
                <View style={styles.blueDivider} />
                <View style={styles.linksContainer}>
                  {productLinks.map((link, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={link.onPress}
                      style={styles.linkItem}
                    >
                      <Text style={styles.linkText} variant="bodyMedium">
                        {link.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Payment Method Section */}
            {showPayments && (
              <View style={styles.gridItem}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Payment Method
                </Text>
                <View style={styles.blueDivider} />
                <View style={styles.linksContainer}>
                  {paymentLinks.map((link, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => router.push(link.route as any)}
                      style={styles.linkItem}
                    >
                      <Text style={styles.linkText} variant="bodyMedium">
                        {link.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Our Campuses Section */}
          {showSchools && (
            <View style={styles.campusesSection}>
              <Text style={styles.sectionTitle} variant="titleMedium">
                Our Campuses
              </Text>
              <View style={styles.blueDivider} />
              <View style={styles.campusesContainer}>
                {schoolLinks.map((school, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSocialLink(school.url)}
                    style={styles.campusItem}
                  >
                    <Text style={styles.linkText} variant="bodyMedium">
                      {school.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </Surface>

      {/* Social Media Footer */}
      {showSocial && (
        <Surface style={styles.socialFooter} elevation={0}>
          <View style={styles.socialContainer}>
            <View style={styles.copyrightContainer}>
              <Text style={styles.copyrightText} variant="bodyMedium">
                © 2025 ShopSchool.in
              </Text>
            </View>
            
            <View style={styles.socialIconsContainer}>
              {socialLinks.map((social, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSocialLink(social.url)}
                  style={styles.socialButton}
                >
                  <Icon source={social.icon} size={20} color="#fff" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Surface>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topDivider: {
    height: 5,
    backgroundColor: '#36bbeb',
    width: '100%',
  },
  footer: {
    backgroundColor: colors.surface,
  },
  container: {
    padding: spacing.lg,
  },
  mainGrid: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  gridItem: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  blueDivider: {
    height: 2,
    backgroundColor: '#36bbeb',
    width: 50,
    marginBottom: spacing.md,
  },
  contactContainer: {
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactText: {
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  linksContainer: {
    gap: spacing.sm,
  },
  linkItem: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  campusesSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  campusesContainer: {
    gap: spacing.sm,
  },
  campusItem: {
    paddingVertical: spacing.xs,
  },
  socialFooter: {
    backgroundColor: '#25273c',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.md,
  },
  copyrightContainer: {
    flex: 1,
  },
  copyrightText: {
    color: '#fff',
    fontWeight: '500',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  socialButton: {
    padding: spacing.xs,
  },
});
