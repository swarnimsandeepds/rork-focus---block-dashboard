import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

type SessionType = 'focus' | 'break';

interface TimerStats {
  totalFocusTime: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionDate: string | null;
}

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const STORAGE_KEY = 'timer_stats';

export const [TimerProvider, useTimer] = createContextHook(() => {
  const [timeLeft, setTimeLeft] = useState<number>(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [stats, setStats] = useState<TimerStats>({
    totalFocusTime: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    lastSessionDate: null,
  });
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statsQuery = useQuery({
    queryKey: ['timer-stats'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as TimerStats;
      }
      return {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        currentStreak: 0,
        lastSessionDate: null,
      };
    },
  });

  const { mutate: saveMutation } = useMutation({
    mutationFn: async (newStats: TimerStats) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      return newStats;
    },
  });

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
  }, [statsQuery.data]);

  const handleSessionComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const today = new Date().toISOString().split('T')[0];
    let newStreak = stats.currentStreak;
    
    if (sessionType === 'focus') {
      const lastDate = stats.lastSessionDate;
      if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === today) {
          newStreak = stats.currentStreak;
        } else if (lastDate === yesterdayStr) {
          newStreak = stats.currentStreak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newStats = {
        totalFocusTime: stats.totalFocusTime + FOCUS_DURATION,
        sessionsCompleted: stats.sessionsCompleted + 1,
        currentStreak: newStreak,
        lastSessionDate: today,
      };
      
      setStats(newStats);
      saveMutation(newStats);
    }

    setIsRunning(false);
    
    if (sessionType === 'focus') {
      setSessionType('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setSessionType('focus');
      setTimeLeft(FOCUS_DURATION);
    }
  }, [sessionType, stats, saveMutation]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleSessionComplete]);

  const startTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    setSessionType('focus');
    setTimeLeft(FOCUS_DURATION);
  };

  const skipSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    
    if (sessionType === 'focus') {
      setSessionType('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setSessionType('focus');
      setTimeLeft(FOCUS_DURATION);
    }
  };

  const getTodayFocusTime = () => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastSessionDate === today) {
      return Math.floor(stats.totalFocusTime / 60);
    }
    return 0;
  };

  const getTodaySessions = () => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastSessionDate === today) {
      return stats.sessionsCompleted;
    }
    return 0;
  };

  const progress = () => {
    const total = sessionType === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    return ((total - timeLeft) / total) * 100;
  };

  return {
    timeLeft,
    isRunning,
    sessionType,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    progress,
    getTodayFocusTime,
    getTodaySessions,
    focusDuration: FOCUS_DURATION,
    breakDuration: BREAK_DURATION,
  };
});
