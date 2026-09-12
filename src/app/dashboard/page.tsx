"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import UpgradePrompt from "@/components/UpgradePrompt";
import type { SubscriptionTier } from "@/lib/stripe";
import { getById } from "@/lib/habits";
import { conj, toInstrumental, type Gender } from "@/lib/grammar";

interface BuddyInfo {
    name: string; age: number | null; streak: number;
    checkin_time: string | null; habits: string[]; gender: Gender;
}

interface FeedEntry { date: string; note: string | null; completed: boolean; }

const CHECKIN_LABELS: Record<string, string> = {
    morning: "🌅 Rano", afternoon: "☀️ Południe", evening: "🌙 Wieczór",
};

type Tab = "home" | "profile" | "settings";

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();

    const [activeTab, setActiveTab] = useState<Tab>("home");
    const [myStreak, setMyStreak] = useState(0);
    const [userName, setUserName] = useState("");
    const [userGender, setUserGender] = useState<Gender>(null);
    const [userEmail, setUserEmail] = useState("");
    const [clerkUserId, setClerkUserId] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
    const [checkinDone, setCheckinDone] = useState(false);
    const [totalCheckins, setTotalCheckins] = useState(0);
    const [note, setNote] = useState("");
    const [buddy, setBuddy] = useState<BuddyInfo | null>(null);
    const [feed, setFeed] = useState<FeedEntry[]>([]);
    const [nudgeState, setNudgeState] = useState<"idle" | "sending" | "sent" | "unavailable" | "error">("idle");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeToast, setShowUpgradeToast] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [nameSaving, setNameSaving] = useState(false);
    const [userHabits, setUserHabits] = useState<string[]>([]);
    const [checkedHabits, setCheckedHabits] = useState<Set<string>>(new Set());
    const [notifBuddy, setNotifBuddy] = useState(true);
    const [notifStreak, setNotifStreak] = useState(true);
    const [notifNews, setNotifNews] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Init dark mode from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('darkMode') === 'true';
        setDarkMode(saved);
        document.documentElement.classList.toggle('dark', saved);
    }, []);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [buddyChange, setBuddyChange] = useState<{ hasBuddy: boolean; canChange: boolean; daysLeft: number } | null>(null);
    const [changingBuddy, setChangingBuddy] = useState(false);
    const [changeError, setChangeError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { router.push("/sign-in"); return; }

        const loadData = async () => {
            const uid = user.id;
            setClerkUserId(uid);
            setUserEmail(user.primaryEmailAddress?.emailAddress ?? "");

            const profileRes = await fetch("/api/profile/me");
            if (profileRes.ok) {
                const { profile } = await profileRes.json();
                if (profile) {
                    setMyStreak(profile.streak ?? 0);
                    setUserName(profile.name ?? "");
                    setUserGender((profile.gender as Gender) ?? null);
                    setNameInput(profile.name ?? "");
                    setSubscriptionTier((profile.subscription_tier as SubscriptionTier) ?? "free");
                    setUserHabits((profile.habits as string[]) ?? []);
                }
            }

            // Check today's checkin via API (uses UUID internally)
            const checkinRes = await fetch('/api/checkin');
            if (checkinRes.ok) {
                const { checkinDone: done, totalCheckins: total } = await checkinRes.json();
                if (done) setCheckinDone(true);
                setTotalCheckins(total ?? 0);
            }

            // Real buddy (replaces the old mocked buddy)
            const statusRes = await fetch('/api/matching/status');
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.status === 'matched' && statusData.buddy) {
                    setBuddy({
                        name: statusData.buddy.name ?? '',
                        age: statusData.buddy.age ?? null,
                        streak: statusData.buddy.streak ?? 0,
                        checkin_time: statusData.buddy.checkin_time ?? null,
                        habits: (statusData.buddy.habits as string[]) ?? [],
                        gender: (statusData.buddy.gender as Gender) ?? null,
                    });
                }
            }

            // Real activity feed (buddy's recent check-ins)
            const feedRes = await fetch('/api/buddy/feed');
            if (feedRes.ok) {
                const { feed: feedData } = await feedRes.json();
                setFeed(feedData ?? []);
            }

            setLoading(false);
        };

        loadData();

        // Check buddy change eligibility
        fetch('/api/buddy/change')
            .then(r => r.json())
            .then(data => setBuddyChange(data))
            .catch(() => {});

        if (searchParams.get("upgraded") === "true") {
            setShowUpgradeToast(true);
            setTimeout(() => setShowUpgradeToast(false), 5000);
        }
    }, [isLoaded, isSignedIn, user, searchParams, router]);

    const handleCheckin = async (success: boolean) => {
        if (!success) { setCheckinDone(true); return; }
        setSaving(true); setSaveError(null);

        const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                note: note.trim() || null,
                checkedHabits: [...checkedHabits],
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            setSaveError(`Błąd zapisu meldunku: ${data.error ?? 'Nieznany błąd'}`);
            setSaving(false); return;
        }

        const params = new URLSearchParams();
        params.set('streak', String(data.streak ?? myStreak));
        if (buddy?.name) params.set('buddy', buddy.name);
        if (buddy?.gender) params.set('buddyGender', buddy.gender);
        if (userGender) params.set('meGender', userGender);
        router.push(`/checkin-success?${params.toString()}`);
    };

    const handleSaveName = async () => {
        if (!clerkUserId || !nameInput.trim()) return;
        setNameSaving(true);
        await fetch("/api/profile/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nameInput.trim() }),
        });
        setUserName(nameInput.trim()); setEditingName(false); setNameSaving(false);
    };

    const handleLogout = async () => { await signOut(); router.push("/"); };

    const handleNudge = async () => {
        setNudgeState("sending");
        try {
            const res = await fetch('/api/buddy/nudge', { method: 'POST' });
            if (res.ok) {
                setNudgeState("sent");
                setTimeout(() => setNudgeState("idle"), 3000);
            } else if (res.status === 501) {
                setNudgeState("unavailable");
                setTimeout(() => setNudgeState("idle"), 3000);
            } else {
                setNudgeState("error");
                setTimeout(() => setNudgeState("idle"), 3000);
            }
        } catch {
            setNudgeState("error");
            setTimeout(() => setNudgeState("idle"), 3000);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/profile/export');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'health-buddy-dane.json';
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch('/api/profile/delete', { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                setDeleteError(data.error ?? 'Nie udało się usunąć konta');
                setDeleting(false);
                return;
            }
            await signOut();
            router.push("/");
        } catch {
            setDeleteError('Błąd sieci — spróbuj ponownie');
            setDeleting(false);
        }
    };

    const tierLabel = subscriptionTier === "pro" ? "Pro 🚀" : subscriptionTier === "premium" ? "Premium ⭐" : "Free";
    const tierColor = subscriptionTier === "pro" ? "bg-purple-100 text-purple-700"
        : subscriptionTier === "premium" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500";
    const avatarInitials = userName
        ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

    const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
        <button onClick={onToggle}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? "bg-green-500" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
    );

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center">
                <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                    <header className="bg-white px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2"><span className="text-xl">💚</span><span className="font-bold text-gray-900">Health Buddy</span></div>
                            <div className="w-20 h-7 bg-gray-100 rounded-full animate-pulse" />
                        </div>
                        <div className="w-48 h-6 bg-gray-100 rounded-xl animate-pulse mt-1" />
                    </header>
                    <main className="flex-1 px-4 py-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                <div className="h-4 bg-gray-100 rounded-lg animate-pulse mb-2 w-3/4" />
                                <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                            </div>
                        ))}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white px-6 py-5 border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💚</span>
                            <span className="font-bold text-gray-900">Health Buddy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierColor}`}>
                                {subscriptionTier === "premium" ? "PREMIUM ⭐" : subscriptionTier === "pro" ? "PRO 🚀" : "FREE"}
                            </span>
                            <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1.5">
                                <span>🔥</span>
                                <span className="font-bold text-orange-600 text-sm">{myStreak} dni</span>
                            </div>
                            <UserButton />
                        </div>
                    </div>
                    {activeTab === "home" && <h1 className="text-xl font-black text-gray-900 mt-1">Cześć{user?.firstName ? `, ${user.firstName}` : userName ? `, ${userName}` : ""}!{buddy ? ` Dzień z ${toInstrumental(buddy.name)} 🔥` : " 👋"}</h1>}
                    {activeTab === "profile" && <h1 className="text-xl font-black text-gray-900 mt-1">Mój profil 👤</h1>}
                    {activeTab === "settings" && <h1 className="text-xl font-black text-gray-900 mt-1">Ustawienia ⚙️</h1>}
                    {showUpgradeToast && (
                        <div className="mt-3 bg-green-500 text-white rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in shadow-lg shadow-green-200">
                            <span className="text-xl">🎉</span>
                            <div>
                                <p className="font-bold text-sm">Plan ulepszony!</p>
                                <p className="text-xs text-green-100">Witaj w {subscriptionTier === "pro" ? "Pro 🚀" : "Premium ⭐"}!</p>
                            </div>
                        </div>
                    )}
                </header>

                {/* HOME TAB */}
                {activeTab === "home" && (
                    <main className="flex-1 px-4 py-4 space-y-4 pb-6">
                        <div className="grid grid-cols-2 gap-3">
                            {[{ label: "Moja seria", streak: myStreak }, { label: "Seria Buddy", streak: buddy?.streak ?? 0 }].map((s) => (
                                <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🔥</span>
                                        <span className="text-3xl font-black text-gray-900">{s.streak}</span>
                                        <span className="text-sm text-gray-400 font-medium">dni</span>
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                        {[...Array(7)].map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < s.streak ? "bg-green-500" : "bg-gray-100"}`} />)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            {buddy ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow">
                                            {buddy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{buddy.name}{buddy.age ? `, ${buddy.age}` : ""}</p>
                                            <p className="text-xs text-green-600 font-medium">
                                                {buddy.checkin_time ? `${CHECKIN_LABELS[buddy.checkin_time] ?? buddy.checkin_time} meldunek` : conj(buddy.gender, "Aktywny", "Aktywna", "Aktywny/-a")}
                                            </p>
                                        </div>
                                        <button onClick={handleNudge} disabled={nudgeState === "sending"}
                                            className={`ml-auto text-sm font-bold px-3 py-1.5 rounded-xl transition-all duration-200 disabled:opacity-60 ${nudgeState === "sent" ? "bg-green-100 text-green-600" : "bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600"}`}>
                                            {nudgeState === "sending" ? "Wysyłam…" : nudgeState === "sent" ? "✓ Wysłano!" : nudgeState === "unavailable" ? "Wkrótce dostępne" : nudgeState === "error" ? "Błąd, spróbuj ponownie" : "Popchnij 👋"}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {buddy.habits.map((habitId) => {
                                            const habit = getById(habitId);
                                            return habit ? <span key={habitId} className="text-xs bg-green-50 border border-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">{habit.icon} {habit.name}</span> : null;
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-lg">🤝</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">Nie masz jeszcze Buddy&apos;ego</p>
                                        <p className="text-xs text-gray-400">Znajdź partnera do wspólnych nawyków</p>
                                    </div>
                                    <button onClick={() => router.push("/matching")} className="text-sm font-bold px-3 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">Szukaj</button>
                                </div>
                            )}
                            {/* Zmień Buddy */}
                            {buddyChange?.hasBuddy && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    {buddyChange.canChange ? (
                                        <div>
                                            {changeError && <p className="text-xs text-red-500 mb-2">{changeError}</p>}
                                            <button
                                                onClick={async () => {
                                                    setChangingBuddy(true); setChangeError(null);
                                                    const res = await fetch('/api/buddy/change', { method: 'POST' });
                                                    const data = await res.json();
                                                    setChangingBuddy(false);
                                                    if (!res.ok) { setChangeError(data.error ?? 'Błąd'); return; }
                                                    router.push('/matching');
                                                }}
                                                disabled={changingBuddy}
                                                className="w-full text-sm font-bold py-2.5 rounded-xl border-2 border-orange-200 text-orange-600 hover:bg-orange-50 active:scale-95 transition-all duration-200 disabled:opacity-50"
                                            >
                                                {changingBuddy ? 'Szukam nowego…' : '🔄 Zmień Buddy'}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center">
                                            🕐 Zmiana Buddy dostępna za <span className="font-bold text-gray-600">{buddyChange.daysLeft} dni</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!checkinDone ? (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-fade-in">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Dzisiejszy meldunek</p>
                                </div>
                                <h2 className="text-lg font-black text-gray-900 mb-4">Które nawyki {conj(userGender, "zrealizowałeś", "zrealizowałaś", "zrealizowałeś/-aś")} dziś? 🎯</h2>
                                {userHabits.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {userHabits.map((habitId) => {
                                            const habit = getById(habitId);
                                            if (!habit) return null;
                                            const isChecked = checkedHabits.has(habitId);
                                            return (
                                                <button key={habitId}
                                                    onClick={() => setCheckedHabits((prev) => { const next = new Set(prev); if (next.has(habitId)) next.delete(habitId); else next.add(habitId); return next; })}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 text-left ${isChecked ? "border-green-400 bg-green-50" : "border-gray-100 hover:border-green-200 hover:bg-green-50/40"}`}>
                                                    <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-all ${isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent"}`}>✓</span>
                                                    <span className="text-lg flex-shrink-0">{habit.icon}</span>
                                                    <span className={`text-sm font-semibold ${isChecked ? "text-green-800 line-through decoration-green-400" : "text-gray-700"}`}>{habit.name}</span>
                                                </button>
                                            );
                                        })}
                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(checkedHabits.size / userHabits.length) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">{checkedHabits.size}/{userHabits.length}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Notatka (opcjonalnie, max 100 znaków)</label>
                                        <input type="text" value={note} onChange={(e) => setNote(e.target.value.slice(0, 100))} placeholder="Jak minął twój dzień?"
                                            className="w-full border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors" />
                                        <p className="text-xs text-gray-300 mt-1 text-right">{note.length}/100</p>
                                    </div>
                                )}
                                {saveError && <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><p className="text-sm text-red-600 font-medium">❌ {saveError}</p></div>}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleCheckin(true)} disabled={saving || (userHabits.length > 0 && checkedHabits.size === 0)}
                                        className="bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-md shadow-green-200 flex items-center justify-center gap-2">
                                        <span className="text-xl">✅</span>
                                        <span>{saving ? "Zapisuję…" : checkedHabits.size === userHabits.length && userHabits.length > 0 ? "Ideał! 🏆" : "Zamelduj"}</span>
                                    </button>
                                    <button onClick={() => handleCheckin(false)} disabled={saving}
                                        className="bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-60 text-gray-700 font-bold py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2">
                                        <span className="text-xl">😔</span><span>Nie tym razem</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 animate-fade-in">
                                <p className="font-bold text-green-800 mb-1">✅ Zameldowano!</p>
                                <p className="text-sm text-green-700">Świetna robota! Twój Buddy widzi, że dziś {conj(userGender, "dałeś", "dałaś", "dałeś/-aś")} z siebie wszystko. 💪</p>
                            </div>
                        )}

                        {buddy && (
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>📋</span> Ostatnie aktywności Buddy</h3>
                                {feed.length > 0 ? (
                                    <div className="space-y-3">
                                        {feed.map((entry, i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <div className={`mt-0.5 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${entry.completed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>{entry.completed ? "✓" : "✗"}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-400 font-semibold mb-0.5">{entry.date}</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{entry.note || `${conj(buddy?.gender, "Zameldował się", "Zameldowała się", "Zameldował/-a się")} bez notatki`}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Brak jeszcze żadnej aktywności.</p>
                                )}
                            </div>
                        )}

                        {subscriptionTier === "free" ? (
                            <UpgradePrompt feature="Szczegółowe statystyki i wykresy 📊" requiredTier="premium" />
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:border-green-300 hover:bg-green-50 transition-all"><span className="text-2xl block mb-1">💬</span><span className="text-sm font-semibold text-gray-700">Napisz wiadomość</span></button>
                                <button className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:border-green-300 hover:bg-green-50 transition-all"><span className="text-2xl block mb-1">📊</span><span className="text-sm font-semibold text-gray-700">Statystyki</span></button>
                            </div>
                        )}

                        {subscriptionTier === "free" && (
                            <div onClick={() => router.push("/pricing")} className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-green-200 active:scale-95 transition-all duration-200">
                                <span className="text-2xl">⭐</span>
                                <div className="flex-1"><p className="font-bold text-white text-sm">Ulepsz do Premium</p><p className="text-green-100 text-xs">Odblokuj filtry, statystyki i więcej</p></div>
                                <span className="text-white font-bold text-sm">29 zł →</span>
                            </div>
                        )}
                    </main>
                )}

                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                    <main className="flex-1 px-4 py-4 space-y-4 pb-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-green-200">{avatarInitials}</div>
                            {!editingName ? (
                                <>
                                    <div className="text-center"><p className="text-xl font-black text-gray-900">{userName || "Brak nazwy"}</p><p className="text-sm text-gray-400">{userEmail}</p></div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${tierColor}`}>{tierLabel}</span>
                                    <button onClick={() => setEditingName(true)} className="text-sm text-green-600 font-semibold hover:text-green-700 transition-colors">✏️ Edytuj imię</button>
                                </>
                            ) : (
                                <div className="w-full space-y-2">
                                    <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value.slice(0, 30))} placeholder="Twoje imię" autoFocus
                                        className="w-full border-2 border-green-300 focus:border-green-500 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none text-center font-bold" />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveName} disabled={nameSaving} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60">{nameSaving ? "Zapisuję…" : "Zapisz"}</button>
                                        <button onClick={() => { setEditingName(false); setNameInput(userName); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-all">Anuluj</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[{ label: "Seria", value: `${myStreak} 🔥`, sub: "dni" }, { label: "Meldunki", value: `${totalCheckins}`, sub: "łącznie" }, { label: "Buddy", value: buddyChange?.hasBuddy ? "1" : "0", sub: buddyChange?.hasBuddy ? "aktywny" : "brak" }].map((s) => (
                                <div key={s.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-gray-900">{s.value}</p>
                                    <p className="text-xs text-gray-400">{s.sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>🎯</span> Moje nawyki</h3>
                            <div className="space-y-2">
                                {userHabits.length > 0 ? userHabits.map((habitId) => {
                                    const habit = getById(habitId);
                                    if (!habit) return null;
                                    return (
                                        <div key={habitId} className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5">
                                            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                                            <span className="text-sm font-medium text-gray-700">{habit.icon} {habit.name}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-gray-400">Brak wybranych nawyków.</p>
                                )}
                            </div>
                            {subscriptionTier === "free" && <p className="text-xs text-gray-400 text-center mt-3">Max 2 nawyki w planie Free.{" "}<button onClick={() => router.push("/pricing")} className="text-green-600 font-semibold">Ulepsz →</button></p>}
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>💳</span> Subskrypcja</h3>
                            <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${subscriptionTier === "pro" ? "bg-purple-50" : subscriptionTier === "premium" ? "bg-green-50" : "bg-gray-50"}`}>
                                <div>
                                    <p className={`font-bold text-sm ${subscriptionTier === "pro" ? "text-purple-700" : subscriptionTier === "premium" ? "text-green-700" : "text-gray-700"}`}>Plan {tierLabel}</p>
                                    <p className="text-xs text-gray-400">{subscriptionTier === "free" ? "Zacznij za darmo" : "Aktywna subskrypcja"}</p>
                                </div>
                                {subscriptionTier === "free" ? (
                                    <button onClick={() => router.push("/pricing")} className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">Ulepsz</button>
                                ) : (
                                    <button onClick={() => router.push("/pricing")} className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">Zarządzaj →</button>
                                )}
                            </div>
                        </div>

                        <button onClick={handleLogout} className="w-full py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2">
                            <span>🚪</span> Wyloguj się
                        </button>
                    </main>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <main className="flex-1 px-4 py-4 space-y-4 pb-6">
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>🔔</span> Powiadomienia</h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Przypomnienie od Buddy", sub: "Gdy Twój Buddy się zamelduje", enabled: notifBuddy, toggle: () => setNotifBuddy((v) => !v) },
                                    { label: "Ostrzeżenie o serii", sub: "Gdy grozi Ci utrata serii", enabled: notifStreak, toggle: () => setNotifStreak((v) => !v) },
                                    { label: "Nowości i wskazówki", sub: "Tips i aktualizacje Health Buddy", enabled: notifNews, toggle: () => setNotifNews((v) => !v) },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div><p className="text-sm font-semibold text-gray-800">{item.label}</p><p className="text-xs text-gray-400">{item.sub}</p></div>
                                        <Toggle enabled={item.enabled} onToggle={item.toggle} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>🎨</span> Wygląd</h3>
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm font-semibold text-gray-800">Tryb ciemny</p><p className="text-xs text-gray-400">Zmniejsza zmęczenie oczu wieczorem</p></div>
                                <Toggle enabled={darkMode} onToggle={() => {
                                    const next = !darkMode;
                                    setDarkMode(next);
                                    document.documentElement.classList.toggle('dark', next);
                                    localStorage.setItem('darkMode', String(next));
                                }} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span>🔐</span> Konto</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm text-gray-700 font-medium">E-mail</span>
                                    <span className="text-sm text-gray-400 truncate max-w-[180px]">{userEmail || "—"}</span>
                                </div>
                                <div className="h-px bg-gray-100" />
                                <Link href="/pricing" className="w-full text-left text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors py-1 flex items-center justify-between">
                                    <span>Zarządzaj subskrypcją</span><span className="text-gray-300">›</span>
                                </Link>
                                <div className="h-px bg-gray-100" />
                                <button onClick={handleExport} disabled={exporting} className="w-full text-left text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors py-1 flex items-center justify-between disabled:opacity-60">
                                    <span>{exporting ? "Przygotowuję…" : "Eksportuj moje dane"}</span><span className="text-gray-300">›</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm">
                            <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2"><span>⚠️</span> Strefa niebezpieczna</h3>
                            {!showDeleteConfirm ? (
                                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-400 font-semibold hover:text-red-600 transition-colors">Usuń konto…</button>
                            ) : (
                                <div className="bg-red-50 rounded-xl p-3 space-y-3">
                                    <p className="text-sm text-red-700 font-medium">Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.</p>
                                    {deleteError && <p className="text-xs text-red-600 font-medium">❌ {deleteError}</p>}
                                    <div className="flex gap-2">
                                        <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-lg text-sm hover:bg-red-600 transition-colors disabled:opacity-60">{deleting ? "Usuwam…" : "Tak, usuń konto"}</button>
                                        <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-60">Anuluj</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-center py-2">
                            <p className="text-xs text-gray-300 font-medium">Health Buddy v1.0.0</p>
                            <p className="text-xs text-gray-300">Made with 💚 in Poland</p>
                        </div>
                    </main>
                )}

                {/* Bottom nav */}
                <nav className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around sticky bottom-0 z-10">
                    <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-green-500" : "text-gray-400"}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                        <span className="text-xs font-semibold">Główna</span>
                    </button>
                    <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "profile" ? "text-green-500" : "text-gray-400"}`}>
                        <svg className="w-5 h-5" fill={activeTab === "profile" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-xs font-semibold">Profil</span>
                    </button>
                    <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "settings" ? "text-green-500" : "text-gray-400"}`}>
                        <svg className="w-5 h-5" fill={activeTab === "settings" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-xs font-semibold">Ustawienia</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}
