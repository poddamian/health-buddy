import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateScore, MIN_MATCH_SCORE, type MatchProfile } from "./matching.ts";

function profile(overrides: Partial<MatchProfile>): MatchProfile {
    return {
        id: "id",
        name: "Name",
        age: 30,
        habits: [],
        checkin_time: null,
        timezone: null,
        streak: 0,
        created_at: null,
        ...overrides,
    };
}

test("full match scores 100", () => {
    const me = profile({ habits: ["water", "running"], checkin_time: "morning", timezone: "Europe/Warsaw", age: 30, streak: 3 });
    const other = profile({ habits: ["water", "running"], checkin_time: "morning", timezone: "Europe/Warsaw", age: 32, streak: 1 });
    const result = calculateScore(me, other);
    assert.equal(result.score, 100);
    assert.deepEqual(result.shared_habits.sort(), ["running", "water"]);
});

test("no overlap scores 0 and stays below the match threshold", () => {
    const me = profile({ habits: ["water"], age: 20, streak: 0 });
    const other = profile({ habits: ["running"], age: 60, streak: 0 });
    const result = calculateScore(me, other);
    assert.equal(result.score, 0);
    assert.ok(result.score < MIN_MATCH_SCORE);
});

test("habits score is proportional to overlap, not just shared count", () => {
    const me = profile({ habits: ["a", "b"] });
    const other = profile({ habits: ["a", "c", "d"] });
    // shared = {a} = 1, union = {a,b,c,d} = 4 → round(1/4 * 40) = 10
    const result = calculateScore(me, other);
    assert.equal(result.breakdown.habits, 10);
});

test("age difference over 10 years does not score age points", () => {
    const me = profile({ age: 20 });
    const other = profile({ age: 35 });
    const result = calculateScore(me, other);
    assert.equal(result.breakdown.age, 0);
});
