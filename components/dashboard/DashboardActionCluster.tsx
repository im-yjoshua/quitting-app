import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette, GlassBlur } from '../../constants/theme';

interface DashboardActionClusterProps {
  onPressPanic: () => void;
  onPressEmergency: () => void;
  onPressRelapse: () => void;
}

interface ScaleButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  hapticStyle?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  isNotification?: boolean;
}

const ScaleButton: React.FC<ScaleButtonProps> = ({
  onPress,
  children,
  style,
  hapticStyle,
  isNotification,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (isNotification && hapticStyle) {
      Haptics.notificationAsync(hapticStyle as Haptics.NotificationFeedbackType);
    } else if (hapticStyle) {
      Haptics.impactAsync(hapticStyle as Haptics.ImpactFeedbackStyle);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={style}
    >
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export const DashboardActionCluster: React.FC<DashboardActionClusterProps> = ({
  onPressPanic,
  onPressEmergency,
  onPressRelapse,
}) => {
  return (
    <View style={styles.container}>
      {/* Row 1: Urgent Intervention Pair (Panic & Emergency) */}
      <View style={styles.primaryRow}>
        {/* Panic Button */}
        <ScaleButton
          onPress={onPressPanic}
          isNotification={true}
          hapticStyle={Haptics.NotificationFeedbackType.Warning}
          style={styles.primaryButtonWrapper}
        >
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.primaryGlassButton}
          >
            <View style={styles.primaryContent}>
              <View style={[styles.iconCircle, styles.panicIconCircle]}>
                <Ionicons name="flame" size={18} color={Palette.signalAlert} />
              </View>
              <View style={styles.textStack}>
                <Text style={styles.titleText}>Panic</Text>
                <Text style={styles.buttonSubtitle}>Feeling an urge?</Text>
              </View>
            </View>
          </BlurView>
        </ScaleButton>

        {/* Emergency Button */}
        <ScaleButton
          onPress={onPressEmergency}
          hapticStyle={Haptics.ImpactFeedbackStyle.Heavy}
          style={styles.primaryButtonWrapper}
        >
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.primaryGlassButton}
          >
            <View style={styles.primaryContent}>
              <View style={[styles.iconCircle, styles.emergencyIconCircle]}>
                <Ionicons name="scan" size={18} color={Palette.signalCold} />
              </View>
              <View style={styles.textStack}>
                <Text style={styles.titleText}>Emergency</Text>
                <Text style={styles.buttonSubtitle}>Ground yourself</Text>
              </View>
            </View>
          </BlurView>
        </ScaleButton>
      </View>

      {/* Row 2: Clear Relapse / Reset Button */}
      <View>
        <ScaleButton
          onPress={onPressRelapse}
          hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
          style={styles.relapseWrapper}
        >
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.relapseGlassButton}
          >
            <View style={styles.relapseContent}>
              <View style={styles.relapseIconCircle}>
                <Ionicons name="refresh-circle-outline" size={20} color={Palette.signalWarning} />
              </View>
              <View style={styles.relapseTextStack}>
                <Text style={styles.titleText}>I Slipped Up</Text>
                <Text style={styles.relapseSubtitle}>Start fresh & log what happened</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Palette.textSecondary} />
            </View>
          </BlurView>
        </ScaleButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryGlassButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicIconCircle: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  emergencyIconCircle: {
    backgroundColor: 'rgba(100, 210, 255, 0.15)',
  },
  textStack: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  buttonSubtitle: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  // Relapse Button
  relapseWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  relapseGlassButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  relapseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  relapseIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relapseTextStack: {
    flex: 1,
  },
  relapseSubtitle: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 1,
  },
});
