import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';
import Theme from '@/constants/theme';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  height?: number;
}

export default function TradingViewChart({ 
  symbol = 'NASDAQ:AAPL', 
  interval = '1D', 
  height = 500 
}: TradingViewChartProps) {
  const [isLoading, setIsLoading] = useState(true);

  // TradingView widget HTML
  const tradingViewWidget = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: 100%;
          width: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .tradingview-widget-container {
          height: 100%;
          width: 100%;
          position: relative;
          min-height: 250px;
        }
        #tradingview_widget {
          height: 100%;
          width: 100%;
          min-height: 250px;
        }
      </style>
    </head>
    <body>
      <div class="tradingview-widget-container">
        <div id="tradingview_widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
          window.onload = function() {
            new TradingView.widget({
              "width": "100%",
              "height": "100%",
              "symbol": "${symbol}",
              "interval": "${interval}",
              "timezone": "Etc/UTC",
              "theme": "light",
              "style": "1",
              "locale": "en",
              "toolbar_bg": "#f1f3f6",
              "enable_publishing": false,
              "hide_top_toolbar": false,
              "hide_legend": false,
              "hide_side_toolbar": false,
              "save_image": false,
              "allow_symbol_change": true,
              "show_popup_button": true,
              "popup_width": "1000",
              "popup_height": "650",
              "no_referral_id": true,
              "container_id": "tradingview_widget"
            });
          };
        </script>
      </div>
    </body>
    </html>
  `;

  // For web, we'll use a different approach since WebView might not work well
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.webFallback}>
          <Text style={styles.symbolText}>{symbol}</Text>
          <Text style={styles.fallbackText}>
            TradingView charts are optimized for the mobile app.
          </Text>
          <Text style={styles.fallbackSubtext}>
            Please use the mobile app for the best experience.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      )}
      
      <WebView
        source={{ html: tradingViewWidget }}
        style={styles.webview}
        onLoad={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 0,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    zIndex: 1,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: Colors.secondaryText,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  symbolText: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  fallbackText: {
    fontSize: Theme.typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  fallbackSubtext: {
    fontSize: Theme.typography.sizes.sm,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});