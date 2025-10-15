/**
 * Insights Screen
 * AI-powered insights and analytics for daily check-ins
 *
 * Features:
 * - Weekly AI summary
 * - Pattern detection
 * - Correlations analysis
 * - Mood predictions
 * - Early warning system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { ShareModal } from '../components/ShareModal';

interface TabOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const tabs: TabOption[] = [
  { id: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { id: 'patterns', label: 'Patterns', icon: 'sparkles-outline' },
  { id: 'correlations', label: 'Correlations', icon: 'analytics-outline' },
  { id: 'predictions', label: 'Predictions', icon: 'trending-up-outline' },
  { id: 'warnings', label: 'Warnings', icon: 'warning-outline' },
];

export default function InsightsScreen() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [activeTab]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      switch (activeTab) {
        case 'weekly':
          result = await api.insights.getWeekly();
          console.log('Weekly data:', result);
          break;
        case 'patterns':
          result = await api.insights.getPatterns(30);
          console.log('Patterns data:', result);
          break;
        case 'correlations':
          result = await api.insights.getCorrelations(30);
          console.log('Correlations data:', result);
          break;
        case 'predictions':
          result = await api.insights.getPredictions();
          console.log('Predictions data:', result);
          break;
        case 'warnings':
          result = await api.insights.getWarnings();
          console.log('Warnings data:', result);
          break;
        default:
          result = null;
      }

      setData(result);
    } catch (error: any) {
      console.error('Error loading insights:', error);
      setError(error.message || 'Failed to load insights');
      // Set empty data to show empty state instead of white screen
      setData(activeTab === 'weekly' ? {} : []);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const renderWeeklyInsights = () => {
    if (!data) return null;

    return (
      <View style={styles.contentContainer}>
        {/* Mood Trend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={
                data.moodTrend.direction === 'improving'
                  ? 'trending-up'
                  : data.moodTrend.direction === 'declining'
                  ? 'trending-down'
                  : 'remove'
              }
              size={24}
              color={
                data.moodTrend.direction === 'improving'
                  ? '#10b981'
                  : data.moodTrend.direction === 'declining'
                  ? '#ef4444'
                  : '#6b7280'
              }
            />
            <Text style={styles.cardTitle}>Mood Trend</Text>
          </View>
          <Text style={styles.trendValue}>
            {data.moodTrend.averageMood.toFixed(1)}/10
          </Text>
          <Text style={styles.trendChange}>
            {data.moodTrend.changePercent !== null && data.moodTrend.changePercent !== undefined
              ? `${data.moodTrend.changePercent > 0 ? '+' : ''}${data.moodTrend.changePercent.toFixed(1)}% from last week`
              : 'First week - no comparison data'}
          </Text>
        </View>

        {/* AI Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={24} color="#fbbf24" />
              <Text style={styles.cardTitle}>Highlights</Text>
            </View>
            {data.highlights.map((highlight: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.listItemText}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>
            {data.recommendations.map((rec: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="arrow-forward-circle" size={20} color="#8b5cf6" />
                <Text style={styles.listItemText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPatterns = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="sparkles-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No patterns detected yet</Text>
          <Text style={styles.emptySubtext}>
            Complete more check-ins to see patterns
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {data.map((pattern: any, index: number) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={
                  pattern.type === 'gratitude'
                    ? 'heart'
                    : pattern.type === 'challenge'
                    ? 'alert-circle'
                    : pattern.type === 'behavior'
                    ? 'fitness'
                    : 'star'
                }
                size={24}
                color={
                  pattern.type === 'gratitude'
                    ? '#ec4899'
                    : pattern.type === 'challenge'
                    ? '#ef4444'
                    : '#3b82f6'
                }
              />
              <Text style={styles.cardTitle}>{pattern.name}</Text>
            </View>
            <Text style={styles.patternFrequency}>
              Frequency: {pattern.frequency} times
            </Text>
            {pattern.examples && pattern.examples.length > 0 && (
              <View style={styles.examplesContainer}>
                {pattern.examples.map((example: string, idx: number) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{example}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCorrelations = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Not enough data for correlations</Text>
          <Text style={styles.emptySubtext}>
            Need at least 7 days of check-ins
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {data.map((correlation: any, index: number) => (
          <View key={index} style={styles.card}>
            <View style={styles.correlationHeader}>
              <Text style={styles.factorA}>{correlation.factorA}</Text>
              <Ionicons
                name={
                  correlation.direction === 'positive'
                    ? 'arrow-forward'
                    : 'arrow-back'
                }
                size={20}
                color={
                  correlation.strength === 'strong'
                    ? '#10b981'
                    : correlation.strength === 'moderate'
                    ? '#f59e0b'
                    : '#6b7280'
                }
              />
              <Text style={styles.factorB}>{correlation.factorB}</Text>
            </View>
            <View style={styles.strengthBadge}>
              <Text
                style={[
                  styles.strengthText,
                  {
                    color:
                      correlation.strength === 'strong'
                        ? '#10b981'
                        : correlation.strength === 'moderate'
                        ? '#f59e0b'
                        : '#6b7280',
                  },
                ]}
              >
                {(correlation.strength || 'WEAK').toUpperCase()} CORRELATION
              </Text>
            </View>
            <Text style={styles.interpretationText}>
              {correlation.interpretation}
            </Text>
            <Text style={styles.dataPointsText}>
              Based on {correlation.dataPoints} data points
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPredictions = () => {
    if (!data || !data.nextSevenDays || data.nextSevenDays.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Not enough data for predictions</Text>
          <Text style={styles.emptySubtext}>
            Need more check-in history
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Trend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={
                data.trend === 'improving'
                  ? 'trending-up'
                  : data.trend === 'declining'
                  ? 'trending-down'
                  : 'remove'
              }
              size={24}
              color={
                data.trend === 'improving'
                  ? '#10b981'
                  : data.trend === 'declining'
                  ? '#ef4444'
                  : '#6b7280'
              }
            />
            <Text style={styles.cardTitle}>Predicted Trend</Text>
          </View>
          <Text style={styles.trendBig}>
            {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
          </Text>
          <Text style={styles.accuracyText}>
            Prediction accuracy: {data.accuracy}%
          </Text>
          <Text style={styles.recommendationText}>{data.recommendation}</Text>
        </View>

        {/* Daily Predictions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-Day Forecast</Text>
          {data.nextSevenDays.map((day: any, index: number) => (
            <View key={index} style={styles.predictionRow}>
              <Text style={styles.dayText}>
                Day {index + 1}
              </Text>
              <View style={styles.moodBar}>
                <View
                  style={[
                    styles.moodBarFill,
                    { width: `${(day.predictedMood / 10) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.moodValue}>
                {day.predictedMood.toFixed(1)}/10
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWarnings = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.emptyTextGood}>All Clear!</Text>
          <Text style={styles.emptySubtext}>
            No warnings detected in your recent check-ins
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {data.map((warning: any, index: number) => (
          <View
            key={index}
            style={[
              styles.card,
              {
                borderLeftWidth: 4,
                borderLeftColor:
                  warning.severity === 'critical'
                    ? '#dc2626'
                    : warning.severity === 'high'
                    ? '#f59e0b'
                    : warning.severity === 'moderate'
                    ? '#3b82f6'
                    : '#6b7280',
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name={warning.urgent ? 'warning' : 'alert-circle'}
                size={24}
                color={
                  warning.severity === 'critical'
                    ? '#dc2626'
                    : warning.severity === 'high'
                    ? '#f59e0b'
                    : '#3b82f6'
                }
              />
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color:
                      warning.severity === 'critical'
                        ? '#dc2626'
                        : warning.severity === 'high'
                        ? '#f59e0b'
                        : '#1f2937',
                  },
                ]}
              >
                {warning.message}
              </Text>
            </View>
            <Text style={styles.warningDetails}>{warning.details}</Text>
            {warning.recommendations && warning.recommendations.length > 0 && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>What to do:</Text>
                {warning.recommendations.map((rec: string, idx: number) => (
                  <View key={idx} style={styles.listItem}>
                    <Ionicons name="arrow-forward" size={16} color="#6b7280" />
                    <Text style={styles.recommendationItem}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Analyzing your data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'weekly':
        return renderWeeklyInsights();
      case 'patterns':
        return renderPatterns();
      case 'correlations':
        return renderCorrelations();
      case 'predictions':
        return renderPredictions();
      case 'warnings':
        return renderWarnings();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareModal(true)}
          >
            <Ionicons name="share-social" size={20} color="#ffffff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? '#ffffff' : '#6b7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        reportType="comprehensive"
        days={30}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B5FA8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    height: 32,
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 13,
    marginLeft: 4,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  trendValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  trendChange: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
  },
  patternFrequency: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  factorA: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  factorB: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  strengthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  interpretationText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  dataPointsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  accuracyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayText: {
    fontSize: 14,
    color: '#6b7280',
    width: 50,
  },
  moodBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  moodBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  moodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    width: 50,
    textAlign: 'right',
  },
  warningDetails: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: 300,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyTextGood: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
