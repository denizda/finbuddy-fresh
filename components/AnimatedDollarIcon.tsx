import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/colors';

export default function AnimatedDollarIcon() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.7);

  // For web compatibility, we'll use conditional rendering
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Scale animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    // Rotation animation (only on native)
    if (!isWeb) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1, // Infinite repeat
        false // Don't reverse
      );
    }

    // Opacity animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        ...(isWeb ? [] : [{ rotateZ: `${rotation.value}deg` }]),
      ],
      opacity: opacity.value,
  }) as ViewStyle);

  return (
    <View style={styles.container}>
      <View style={styles.iconBackground}>
        {isWeb ? (
          <View style={styles.iconWrapper}>
            <Icon name="dollar-sign" size={24} color={Colors.primary} />
          </View>
        ) : (
          <Animated.View style={[styles.iconWrapper, animatedStyle]}>
            <Icon name="dollar-sign" size={24} color={Colors.primary} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(51, 102, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});