import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Stats
      streakDays: 4,
      flashcardsLearned: 0,
      quizzesTaken: 0,
      accuracy: 85,
      totalQuestionsAnswered: 0,
      correctQuestionsAnswers: 0,
      
      // Activity
      recentActivity: [],
      studyActivityLog: {}, // { 'YYYY-MM-DD': count }
      quizResults: [], // { topic, score, total, date }

      // Actions
      addQuizResult: (score, total, topic, questions = [], subject = 'General') => set((state) => {
        const newTotal = state.totalQuestionsAnswered + total;
        const newCorrect = state.correctQuestionsAnswers + score;
        const newAccuracy = Math.round((newCorrect / newTotal) * 100);
        const today = new Date().toISOString().split('T')[0];
        
        return {
          quizzesTaken: state.quizzesTaken + 1,
          totalQuestionsAnswered: newTotal,
          correctQuestionsAnswers: newCorrect,
          accuracy: newAccuracy,
          quizResults: [
            ...state.quizResults, 
            { topic, score, total, date: new Date().toISOString(), questions, subject }
          ],
          studyActivityLog: {
            ...state.studyActivityLog,
            [today]: (state.studyActivityLog[today] || 0) + 1
          },
          recentActivity: [
            { type: 'Quiz', title: topic, score: `${score}/${total}`, date: 'Just now' },
            ...state.recentActivity.slice(0, 4)
          ]
        };
      }),

      addFlashcardsReviewed: (count, topic) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          flashcardsLearned: state.flashcardsLearned + count,
          studyActivityLog: {
            ...state.studyActivityLog,
            [today]: (state.studyActivityLog[today] || 0) + 1
          },
          recentActivity: [
            { type: 'Flashcards', title: topic, score: `${count} cards`, date: 'Just now' },
            ...state.recentActivity.slice(0, 4)
          ]
        };
      }),

      addVideoProcessed: (title) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          studyActivityLog: {
            ...state.studyActivityLog,
            [today]: (state.studyActivityLog[today] || 0) + 1
          },
          recentActivity: [
            { type: 'Video Notes', title, score: 'Completed', date: 'Just now' },
            ...state.recentActivity.slice(0, 4)
          ]
        };
      }),

      addAiTutorSession: (topic) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          studyActivityLog: {
            ...state.studyActivityLog,
            [today]: (state.studyActivityLog[today] || 0) + 1
          },
          recentActivity: [
            { type: 'RAG Tutor', title: topic, score: 'Session', date: 'Just now' },
            ...state.recentActivity.slice(0, 4)
          ]
        };
      }),

      // Store Decks for Spaced Repetition (array of objects { id, name, cards })
      decks: [],
      addDeck: (deck) => set((state) => ({ decks: [...state.decks, deck] })),
      updateDeck: (id, updatedDeck) => set((state) => ({
        decks: state.decks.map(d => d.id === id ? updatedDeck : d)
      })),

      // Pomodoro State
      pomodoro: {
        timeLeft: 25 * 60,
        isRunning: false,
        mode: 'focus', // 'focus' | 'break' | 'longBreak'
        focusDuration: 25,
        breakDuration: 5,
        sessionCount: 0,
        isVisible: false,
      },
      updatePomodoro: (updates) => set((state) => ({
        pomodoro: { ...state.pomodoro, ...updates }
      })),
      addPomodoroSession: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        return {
          pomodoro: {
            ...state.pomodoro,
            sessionCount: state.pomodoro.sessionCount + 1
          },
          studyActivityLog: {
            ...state.studyActivityLog,
            [today]: (state.studyActivityLog[today] || 0) + 1
          }
        };
      }),

      // Planner State
      studyProfile: null,
      studyPlan: null,
      completedSessions: [],
      setStudyProfile: (profile) => set({ studyProfile: profile }),
      setStudyPlan: (plan) => set({ studyPlan: plan }),
      toggleSessionComplete: (sessionKey) => set((state) => {
        const isCompleted = state.completedSessions.includes(sessionKey);
        return {
          completedSessions: isCompleted 
            ? state.completedSessions.filter(k => k !== sessionKey)
            : [...state.completedSessions, sessionKey]
        };
      }),

    }),
    {
      name: 'ai-companion-storage', // name of the item in the storage (must be unique)
    }
  )
);
