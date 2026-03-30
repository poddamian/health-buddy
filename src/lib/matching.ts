// Matching score algorithm (server-side only)

export interface MatchProfile {
    id: string;
    name: string;
    age: number | null;
    habits: string[];
    checkin_time: string | null;
    timezone: string | null;
    streak: number;
    created_at: string | null;
}

export interface MatchResult {
    profile: MatchProfile;
    score: number;
    shared_habits: string[];
    breakdown: {
        habits: number;
        checkin_time: number;
        timezone: number;
        age: number;
        streak: number;
    };
}

export function calculateScore(me: MatchProfile, candidate: MatchProfile): MatchResult {
    const breakdown = { habits: 0, checkin_time: 0, timezone: 0, age: 0, streak: 0 };

    // +40: shared habits (proportional)
    const myHabits = new Set(me.habits ?? []);
    const theirHabits = new Set(candidate.habits ?? []);
    const shared_habits = [...myHabits].filter((h) => theirHabits.has(h));
    const total = new Set([...myHabits, ...theirHabits]).size;
    if (total > 0) {
        breakdown.habits = Math.round((shared_habits.length / total) * 40);
    }

    // +20: same check-in time
    if (me.checkin_time && me.checkin_time === candidate.checkin_time) {
        breakdown.checkin_time = 20;
    }

    // +20: same timezone
    if (me.timezone && me.timezone === candidate.timezone) {
        breakdown.timezone = 20;
    }

    // +10: similar age (within 10 years)
    if (me.age && candidate.age && Math.abs(me.age - candidate.age) <= 10) {
        breakdown.age = 10;
    }

    // +10: both have streak > 0
    if ((me.streak ?? 0) > 0 && (candidate.streak ?? 0) > 0) {
        breakdown.streak = 10;
    }

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { profile: candidate, score, shared_habits, breakdown };
}

export const MIN_MATCH_SCORE = 40;
