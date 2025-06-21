import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Linking, StatusBar } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';
// import { getCompanyById } from '@/mocks/companies';
// import { getCompanyProfile, getCompanyIndicators, getCompanyNews } from '@/mocks/company-details';

type TabType = 'profile' | 'indicators' | 'news';

export default function KeyDataScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // const company = getCompanyById(id || '1');
  // const profile = getCompanyProfile(id || '1');
  // const indicators = getCompanyIndicators(id || '1');
  // const news = getCompanyNews(id || '1');

  // if (!company) {
  //   return (
  //     <View style={styles.errorContainer}>
  //       <Text style={styles.errorText}>Company not found</Text>
  //       <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
  //         <Text style={styles.backButtonText}>Go Back</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <View style={styles.profileHeader}>
              {/* <Image 
                source={{ uri: profile.logoUrl }} 
                style={styles.companyLogo} 
                resizeMode="contain"
              /> */}
              <View style={styles.profileHeaderInfo}>
                {/* <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companySymbol}>{company.symbol}</Text>
                <View style={styles.sectorContainer}>
                  <Text style={styles.sectorText}>{company.sector} • {company.industry}</Text>
                </View> */}
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Current Price</Text>
              <View style={styles.priceRow}>
                {/* <Text style={styles.priceValue}>${company.price.toFixed(2)}</Text> */}
                <View style={[
                  styles.changeContainer, 
                  // { backgroundColor: company.changePercentage >= 0 ? 'rgba(0, 208, 156, 0.1)' : 'rgba(255, 92, 92, 0.1)' }
                ]}>
                  {/* <Text style={[
                    styles.changeText, 
                    { color: company.changePercentage >= 0 ? Colors.secondary : Colors.negative }
                  ]}>
                    {company.changePercentage >= 0 ? '+' : ''}{company.change.toFixed(2)} ({company.changePercentage >= 0 ? '+' : ''}{company.changePercentage.toFixed(2)}%)
                  </Text> */}
                </View>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>About</Text>
              {/* <Text style={styles.descriptionText}>{profile.description}</Text> */}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.sectionTitle}>Company Info</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CEO</Text>
                {/* <Text style={styles.infoValue}>{profile.ceo}</Text> */}
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Founded</Text>
                {/* <Text style={styles.infoValue}>{profile.founded}</Text> */}
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Headquarters</Text>
                {/* <Text style={styles.infoValue}>{profile.headquarters}</Text> */}
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employees</Text>
                {/* <Text style={styles.infoValue}>{profile.employees.toLocaleString()}</Text> */}
              </View>
              
              {/* <TouchableOpacity 
                style={styles.websiteButton}
                onPress={() => Linking.openURL(profile.website)}
              >
                <Icon name="globe" size={16} color={Colors.primary} />
                <Text style={styles.websiteButtonText}>Visit Website</Text>
                <Icon name="external-link" size={14} color={Colors.primary} />
              </TouchableOpacity> */}
            </View>
          </View>
        );
      
      case 'indicators':
        return (
          <View style={styles.tabContent}>
            <View style={styles.indicatorsContainer}>
              <Text style={styles.sectionTitle}>Valuation Metrics</Text>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Market Cap</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.marketCap}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>P/E Ratio</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.peRatio}</Text> */}
                </View>
              </View>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>EPS (TTM)</Text>
                  {/* <Text style={styles.indicatorValue}>${indicators.eps}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Dividend Yield</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.dividendYield}%</Text> */}
                </View>
              </View>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Beta</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.beta}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>52-Week Range</Text>
                  {/* <Text style={styles.indicatorValue}>${indicators.fiftyTwoWeekLow} - ${indicators.fiftyTwoWeekHigh}</Text> */}
                </View>
              </View>
            </View>
            
            <View style={styles.indicatorsContainer}>
              <Text style={styles.sectionTitle}>Financial Highlights</Text>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Revenue (TTM)</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.revenue}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Revenue Growth</Text>
                  {/* <Text style={[
                    styles.indicatorValue,
                    { color: parseFloat(indicators.revenueGrowth) >= 0 ? Colors.secondary : Colors.negative }
                  ]}>
                    {indicators.revenueGrowth}%
                  </Text> */}
                </View>
              </View>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Profit Margin</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.profitMargin}%</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>ROE</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.roe}%</Text> */}
                </View>
              </View>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Debt to Equity</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.debtToEquity}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Current Ratio</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.currentRatio}</Text> */}
                </View>
              </View>
            </View>
            
            <View style={styles.indicatorsContainer}>
              <Text style={styles.sectionTitle}>Trading Information</Text>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Average Volume</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.averageVolume}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Shares Outstanding</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.sharesOutstanding}</Text> */}
                </View>
              </View>
              
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Next Earnings</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.nextEarningsDate}</Text> */}
                </View>
                <View style={styles.indicatorItem}>
                  <Text style={styles.indicatorLabel}>Ex-Dividend Date</Text>
                  {/* <Text style={styles.indicatorValue}>{indicators.exDividendDate}</Text> */}
                </View>
              </View>
            </View>
          </View>
        );
      
      case 'news':
        return (
          <View style={styles.tabContent}>
            {/* {news.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.newsItem}
                onPress={() => Linking.openURL(item.url)}
              >
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.newsImage} 
                  resizeMode="cover"
                />
                <View style={styles.newsContent}>
                  <Text style={styles.newsSource}>{item.source} • {item.date}</Text>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                  <View style={styles.newsReadMore}>
                    <Text style={styles.newsReadMoreText}>Read more</Text>
                    <Icon name="external-link" size={12} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))} */}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          // headerTitle: `${company.symbol} - Key Data`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Icon name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]} 
            onPress={() => setActiveTab('profile')}
          >
            <Icon name="globe" size={18} color={activeTab === 'profile' ? Colors.primary : Colors.secondaryText} />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'indicators' && styles.activeTabButton]} 
            onPress={() => setActiveTab('indicators')}
          >
            <Icon name="bar-chart" size={18} color={activeTab === 'indicators' ? Colors.primary : Colors.secondaryText} />
            <Text style={[styles.tabText, activeTab === 'indicators' && styles.activeTabText]}>Key Indicators</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'news' && styles.activeTabButton]} 
            onPress={() => setActiveTab('news')}
          >
            <Icon name="newspaper" size={18} color={activeTab === 'news' ? Colors.primary : Colors.secondaryText} />
            <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>Latest News</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderTabContent()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBackButton: {
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  errorText: {
    fontSize: Theme.typography.sizes.lg,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  backButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
  },
  backButtonText: {
    color: Colors.background,
    fontWeight: Theme.typography.weights.medium as any,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Theme.typography.weights.medium as any,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xl,
  },
  tabContent: {
    padding: Theme.spacing.md,
  },
  
  // Profile tab styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.md,
    backgroundColor: Colors.card,
  },
  profileHeaderInfo: {
    flex: 1,
  },
  priceContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.small,
  },
  priceLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeContainer: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  descriptionContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.small,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  infoContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
  },
  
  // Indicators tab styles
  indicatorsContainer: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.small,
  },
  indicatorRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  indicatorItem: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
  },
  indicatorLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  
  // News tab styles
  newsItem: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    ...Theme.shadows.small,
  },
  newsImage: {
    width: '100%',
    height: 160,
  },
  newsContent: {
    padding: Theme.spacing.md,
  },
  newsSource: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.xs,
  },
  newsTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
  },
  newsSummary: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    marginBottom: Theme.spacing.sm,
  },
  newsReadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsReadMoreText: {
    fontSize: Theme.typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Theme.typography.weights.medium as any,
  },
});