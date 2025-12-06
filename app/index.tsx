import { StyleSheet, Text, View, Pressable, Animated, ScrollView } from 'react-native';
import { useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, SkipForward, Flame, Clock, Target } from 'lucide-react-native';
import { useTimer } from '@/contexts/TimerContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function FocusTimerScreen() {
  const {
    timeLeft,
    isRunning,
    sessionType,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    progress,
    getTodayFocusTime,
    getTodaySessions,
    stats,
  } = useTimer();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, pulseAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const progressValue = progress();

  return (
    <LinearGradient
      colors={sessionType === 'focus' ? ['#0f172a', '#1e293b', '#334155'] : ['#14532d', '#166534', '#15803d']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.sessionBadge}>
            <Timer size={16} color="#fff" />
            <Text style={styles.sessionText}>
              {sessionType === 'focus' ? 'FOCUS SESSION' : 'BREAK TIME'}
            </Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Animated.View style={[styles.circleContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.progressCircle}>
              <View style={styles.progressBackground} />
              <View 
                style={[
                  styles.progressBar,
                  {
                    transform: [{ rotate: `${(progressValue / 100) * 360}deg` }],
                  }
                ]}
              >
                <View style={[
                  styles.progressHalf,
                  { backgroundColor: sessionType === 'focus' ? '#3b82f6' : '#22c55e' }
                ]} />
              </View>
              <View style={styles.innerCircle}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerLabel}>
                  {sessionType === 'focus' ? 'Stay Focused' : 'Take a Break'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.controls}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={isRunning ? pauseTimer : startTimer}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.mainButton, { backgroundColor: sessionType === 'focus' ? '#3b82f6' : '#22c55e' }]}
              >
                {isRunning ? (
                  <Pause size={32} color="#fff" fill="#fff" />
                ) : (
                  <Play size={32} color="#fff" fill="#fff" />
                )}
              </Pressable>
            </Animated.View>

            <View style={styles.secondaryControls}>
              <Pressable onPress={resetTimer} style={styles.secondaryButton}>
                <RotateCcw size={20} color="#94a3b8" />
              </Pressable>
              <Pressable onPress={skipSession} style={styles.secondaryButton}>
                <SkipForward size={20} color="#94a3b8" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{getTodayFocusTime()}</Text>
            <Text style={styles.statLabel}>Minutes Today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Target size={24} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>{getTodaySessions()}</Text>
            <Text style={styles.statLabel}>Sessions Done</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Flame size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sessionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circleContainer: {
    marginBottom: 40,
  },
  progressCircle: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBar: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
  },
  progressHalf: {
    width: 150,
    height: 300,
    borderTopLeftRadius: 150,
    borderBottomLeftRadius: 150,
  },
  innerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '500',
  },
  controls: {
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
});
