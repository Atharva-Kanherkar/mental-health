/**
 * ShareModal Component
 * Modal for sharing mental health reports with therapists
 * Shows QR code, link, and password for easy sharing
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../services/api';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  reportType?: 'weekly' | 'monthly' | 'comprehensive';
  days?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  reportType = 'comprehensive',
  days = 30,
}) => {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    password: string;
    expiresAt: string;
    reportType: string;
  } | null>(null);

  useEffect(() => {
    if (visible && !shareData) {
      generateShareLink();
    }
  }, [visible]);

  const generateShareLink = async () => {
    try {
      setLoading(true);
      const data = await api.share.createLink(reportType, 30, days);
      setShareData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate share link');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const shareViaSystem = async () => {
    if (!shareData) return;

    const message = `
Mental Health Report

Link: ${shareData.shareUrl}
Password: ${shareData.password}

Expires: ${new Date(shareData.expiresAt).toLocaleDateString()}

Please keep this information confidential.
    `.trim();

    try {
      await Share.share({
        message,
        title: 'Mental Health Report',
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClose = () => {
    setShareData(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Share with Therapist</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B5FA8" />
                <Text style={styles.loadingText}>Generating report...</Text>
              </View>
            ) : shareData ? (
              <>
                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={shareData.shareUrl}
                    size={200}
                    backgroundColor="white"
                    color="#6B5FA8"
                  />
                  <Text style={styles.qrLabel}>Scan to view report</Text>
                </View>

                {/* Report Type */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Report Type</Text>
                  <Text style={styles.infoValue}>
                    {shareData.reportType.charAt(0).toUpperCase() + shareData.reportType.slice(1)}
                  </Text>
                </View>

                {/* Link */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Link</Text>
                  <View style={styles.valueContainer}>
                    <Text style={styles.cardValue} numberOfLines={1}>
                      {shareData.shareUrl}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(shareData.shareUrl, 'Link')}
                  >
                    <Text style={styles.copyButtonText}>Copy Link</Text>
                  </TouchableOpacity>
                </View>

                {/* Password */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <Text style={styles.passwordText}>{shareData.password}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(shareData.password, 'Password')}
                  >
                    <Text style={styles.copyButtonText}>Copy Password</Text>
                  </TouchableOpacity>
                </View>

                {/* Expiry */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Expires</Text>
                  <Text style={styles.infoValue}>{formatDate(shareData.expiresAt)}</Text>
                </View>

                {/* Important Notice */}
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeIcon}>⚠️</Text>
                  <Text style={styles.noticeText}>
                    Both link and password are required to view the report. Share them securely with your therapist only.
                  </Text>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareViaSystem}
                >
                  <Text style={styles.shareButtonText}>Share via SMS/Email</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B5FA8',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  qrLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  card: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  valueContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 14,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passwordContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  passwordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B5FA8',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#6B5FA8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noticeCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  noticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: '#6B5FA8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6B5FA8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  downloadButtonText: {
    color: '#6B5FA8',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonText: {
    color: '#6B5FA8',
    fontSize: 16,
    fontWeight: '600',
  },
});
