import Question from '../models/Question';
import User from '../models/User';

/**
 * TRUSTED BADGE CRITERIA:
 * - At least 10 total answers
 * - At least 70% helpful rate (helpfulCount / totalAnswers >= 0.7)
 * - Active in the last 30 days
 */
const TRUSTED_CRITERIA = {
    MIN_ANSWERS: 10,
    MIN_HELPFUL_RATE: 0.7,
    ACTIVITY_DAYS: 30
};

export const calculateTrustedBadge = async (userId: string): Promise<boolean> => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Get all questions with this user's answers
        const questions = await Question.find({
            'answers.responderId': userId
        });

        let totalAnswers = 0;
        let totalHelpful = 0;
        let hasRecentActivity = false;
        const thirtyDaysAgo = new Date(Date.now() - TRUSTED_CRITERIA.ACTIVITY_DAYS * 24 * 60 * 60 * 1000);

        // Count answers and helpful votes
        questions.forEach(question => {
            question.answers.forEach(answer => {
                if (answer.responderId.toString() === userId) {
                    totalAnswers++;
                    totalHelpful += answer.helpfulBy?.length || 0;

                    // Check if answer is recent
                    if (new Date(answer.createdAt) > thirtyDaysAgo) {
                        hasRecentActivity = true;
                    }
                }
            });
        });

        // Calculate helpful rate
        const helpfulRate = totalAnswers > 0 ? totalHelpful / totalAnswers : 0;

        // Determine if user qualifies for trusted badge
        const isTrusted =
            totalAnswers >= TRUSTED_CRITERIA.MIN_ANSWERS &&
            helpfulRate >= TRUSTED_CRITERIA.MIN_HELPFUL_RATE &&
            hasRecentActivity;

        // Update user's reputation and badge status
        await User.findByIdAndUpdate(userId, {
            isTrusted,
            reputation: {
                totalAnswers,
                helpfulCount: totalHelpful,
                lastCalculated: new Date()
            }
        });

        return isTrusted;
    } catch (error) {
        console.error('Error calculating trusted badge:', error);
        return false;
    }
};

/**
 * Recalculate trusted badge for a user after they receive a helpful vote
 */
export const updateTrustedBadgeOnAction = async (userId: string) => {
    // Only recalculate if last calculation was more than 1 hour ago
    const user = await User.findById(userId);
    if (!user) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.reputation?.lastCalculated && new Date(user.reputation.lastCalculated) > oneHourAgo) {
        return; // Skip to avoid excessive calculations
    }

    await calculateTrustedBadge(userId);
};
