import { QuizModePage } from './quiz-mode-data';
import { quizModePages } from './quiz-mode-data';

/**
 * Get all quiz pages available for the user based on their completed subtopics
 */
export function getAvailableQuizPages(completedSubtopics: string[]): QuizModePage[] {
  return quizModePages.filter((quiz) => completedSubtopics.includes(quiz.subtopicSlug));
}

/**
 * Check if user has enough quizzes available (at least 3)
 */
export function hasEnoughQuizzes(completedSubtopics: string[]): boolean {
  const available = getAvailableQuizPages(completedSubtopics);
  return available.length >= 3;
}

/**
 * Get count of available quizzes
 */
export function getAvailableQuizCount(completedSubtopics: string[]): number {
  return getAvailableQuizPages(completedSubtopics).length;
}

/**
 * Randomly select N quiz pages from completed subtopics
 * Returns empty array if not enough quizzes available
 */
export function getRandomQuizPages(
  completedSubtopics: string[],
  count: number = 3,
): QuizModePage[] {
  const available = getAvailableQuizPages(completedSubtopics);

  if (available.length < count) {
    return [];
  }

  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
