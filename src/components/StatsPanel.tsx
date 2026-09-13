"use client";

import { useEffect, useState } from "react";
import { getById } from "@/lib/habits";

interface CheckinDay { date: string; completed: boolean; checked_habits: string[] }
interface StatsData { last30Days: CheckinDay[]; habitCounts: Record<string, number> }

export default function StatsPanel() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/profile/stats")
            .then((r) => (r.ok ? r.json() : null))
            .then(setStats)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-40 animate-pulse" />;
    }

    if (!stats) {
        return <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center text-sm text-gray-400 shadow-sm">Brak danych do statystyk.</div>;
    }

    const byDate = new Map(stats.last30Days.map((d) => [d.date, d.completed]));
    const days: { date: string; completed: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        days.push({ date: key, completed: byDate.get(key) ?? false });
    }

    const topHabits = Object.entries(stats.habitCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxCount = Math.max(1, ...topHabits.map(([, c]) => c));

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-5">
            <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>📊</span> Ostatnie 30 dni</h3>
                <div className="grid grid-cols-10 gap-1">
                    {days.map((d) => (
                        <div key={d.date} title={d.date}
                            className={`aspect-square rounded-sm ${d.completed ? "bg-green-500" : "bg-gray-100"}`} />
                    ))}
                </div>
            </div>

            {topHabits.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>🏆</span> Najczęstsze nawyki</h3>
                    <div className="space-y-2">
                        {topHabits.map(([habitId, count]) => {
                            const habit = getById(habitId);
                            return (
                                <div key={habitId} className="flex items-center gap-2">
                                    <span className="text-sm w-6 flex-shrink-0">{habit?.icon ?? "🎯"}</span>
                                    <span className="text-xs text-gray-500 w-24 flex-shrink-0 truncate">{habit?.name ?? habitId}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 w-5 text-right flex-shrink-0">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
