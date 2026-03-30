"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { getById } from "@/lib/habits";
import type { SubscriptionTier } from "@/lib/stripe";

type Phase = "checking" | "searching" | "matched" | "queued" | "rematch_limit" | "error";

interface BuddyData {
    id: string; name: string; age: number | null;
    habits: string[]; shared_habits: string[];
    checkin_time: string | null; streak: number; member_since: string | null;
}

const CHECKIN_LABELS: Record<string, string> = {
    morning: "🌅 Rano", afternoon: "☀️ Południe", evening: "🌙 Wieczór",
};

export default function MatchingPage() {
    const router = useRouter();
    const { user, isLoaded, isSignedIn } = useUser();
    const [phase, setPhase] = useState<Phase>("checking");
    const [dots, setDots] = useState("");
    const [buddy, setBuddy] = useState<BuddyData | null>(null);
    const [score, setScore] = useState(0);
    const [queuePos, setQueuePos] = useState<number>(1);
    const [userId, setUserId] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
    const [rematchDaysLeft, setRematchDaysLeft] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");
    const [rematching, setRematching] = useState(false);

    useEffect(() => {
        if (phase !== "searching") return;
        const interval = setInterval(() => setDots((p) => (p.length >= 3 ? "" : p + ".")), 400);
        return () => clearInterval(interval);
    }, [phase]);

    const callFind = useCallback(async (uid: string) => {
        try {
            const res = await fetch("/api/matching/find", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
            });
            const data = await res.json();
            if (data.status === "matched") { setBuddy(data.buddy); setScore(data.score); setPhase("matched"); }
            else if (data.status === "queued") { setQueuePos(data.position); setPhase("queued"); }
            else { setErrorMsg(data.error ?? "Nieznany błąd"); setPhase("error"); }
        } catch { setErrorMsg("Błąd sieci — sprawdź połączenie."); setPhase("error"); }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { router.push("/sign-in"); return; }

        const init = async () => {
            const uid = user.id;
            setUserId(uid);

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await supabase.from("profiles").update({ timezone: tz }).eq("clerk_user_id", uid);

            const { data: profile } = await supabase
                .from("profiles").select("subscription_tier").eq("clerk_user_id", uid).single();
            setSubscriptionTier((profile?.subscription_tier as SubscriptionTier) ?? "free");

            const statusRes = await fetch(`/api/matching/status?userId=${uid}`);
            const statusData = await statusRes.json();

            if (statusData.status === "matched") { setBuddy(statusData.buddy); setScore(statusData.score ?? 0); setPhase("matched"); }
            else if (statusData.status === "queued") { setQueuePos(statusData.position); setPhase("queued"); }
            else { setPhase("searching"); setTimeout(() => callFind(uid), 3000); }
        };
        init();
    }, [isLoaded, isSignedIn, user, router, callFind]);

    const handleRematch = async () => {
        if (!userId) return;
        setRematching(true);
        try {
            const res = await fetch("/api/matching/rematch", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (res.status === 403 && data.code === "rematch_limit") { setRematchDaysLeft(data.days_left); setPhase("rematch_limit"); }
            else if (data.status === "matched") { setBuddy(data.buddy); setScore(data.score); setPhase("matched"); }
            else if (data.status === "queued") { setQueuePos(data.position); setPhase("queued"); }
            else { setErrorMsg(data.error ?? "Nieznany błąd"); setPhase("error"); }
        } catch { setErrorMsg("Błąd sieci — sprawdź połączenie."); setPhase("error"); }
        finally { setRematching(false); }
    };

    const handleRecheck = async () => {
        if (!userId) return;
        setPhase("searching");
        setTimeout(() => callFind(userId), 2000);
    };

    const avatarInitials = buddy?.name
        ? buddy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                <header className="px-6 py-5 flex items-center gap-2">
                    <span className="text-xl">💚</span>
                    <span className="font-bold text-gray-900">Health Buddy</span>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
                    {phase === "checking" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
                            <p className="text-gray-400 font-medium text-sm">Sprawdzamy twój status…</p>
                        </div>
                    )}

                    {phase === "searching" && (
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="relative w-28 h-28 mb-8">
                                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75" />
                                <div className="absolute inset-2 rounded-full bg-green-200 animate-ping opacity-50" style={{ animationDelay: "0.3s" }} />
                                <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200"><span className="text-5xl">🔍</span></div>
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Szukamy twojego Buddiego{dots}</h1>
                            <p className="text-gray-500 text-base mb-10">Analizujemy nawyki i preferencje, aby znaleźć idealne dopasowanie.</p>
                            <div className="space-y-3 w-full">
                                {["Wspólne nawyki 🎯", "Pora meldunków ⏰", "Strefa czasowa 🌍"].map((label, i) => (
                                    <div key={i} className="w-full bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-sm font-medium text-gray-600">{label}</span>
                                        <span className="ml-auto text-xs text-gray-400">Dopasowywanie…</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {phase === "matched" && buddy && (
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="text-5xl mb-3">🎉</div>
                            <h1 className="text-2xl font-black text-gray-900 mb-1">Znaleziono Buddiego!</h1>
                            <p className="text-gray-500 mb-6">Jesteś {buddy ? `sparowany/-a z ${buddy.name}` : "już sparowany/-a"}! Zacznijcie razem już dziś.</p>
                            <div className="w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-6 border border-green-100 shadow-xl shadow-green-100 mb-5">
                                <div className="mb-5">
                                    <div className="flex justify-center mb-3"><div className="bg-green-500 text-white font-black text-sm px-4 py-1.5 rounded-full shadow">✨ {score}% zgodności</div></div>
                                    <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${score}%` }} /></div>
                                </div>
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-black text-white text-3xl shadow-lg">{avatarInitials}</div>
                                        <div className="absolute bottom-0 right-0 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center"><span className="text-xs text-white font-bold">✓</span></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <div>
                                        <p className="font-black text-gray-900 text-xl">{buddy.name}{buddy.age ? `, ${buddy.age}` : ""}</p>
                                        <p className="text-sm text-gray-500">{buddy.checkin_time ? CHECKIN_LABELS[buddy.checkin_time] ?? buddy.checkin_time : "Aktywny/-a użytkownik/-czka"}</p>
                                    </div>
                                    {buddy.streak > 0 && (
                                        <div className="flex items-center gap-1 bg-orange-100 rounded-full px-3 py-1.5"><span>🔥</span><span className="font-bold text-orange-600">{buddy.streak}</span></div>
                                    )}
                                </div>
                                {buddy.shared_habits && buddy.shared_habits.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Wspólne nawyki ({buddy.shared_habits.length})</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {buddy.shared_habits.map((habitId) => { const habit = getById(habitId); return habit ? <span key={habitId} className="text-sm bg-white border border-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-full shadow-sm">{habit.icon} {habit.name}</span> : null; })}
                                        </div>
                                    </div>
                                )}
                                <div className="h-px bg-green-100 my-4" />
                                <p className="text-sm text-gray-500 italic text-center">&ldquo;Razem możemy zbudować nawyki, które zmienią nasze życie! 💪&rdquo;</p>
                            </div>
                            <button onClick={() => router.push("/dashboard")} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-green-200 transition-all duration-200 mb-3">Zacznijcie razem przygodę ✨</button>
                            <button onClick={handleRematch} disabled={rematching} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium py-2 disabled:opacity-50">{rematching ? "Szukam nowego…" : "Szukaj innego dopasowania"}</button>
                            {subscriptionTier === "free" && <p className="text-xs text-gray-300 mt-1">Plan Free: 1 rematch na miesiąc</p>}
                        </div>
                    )}

                    {phase === "queued" && (
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl mb-6">⏳</div>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Na liście oczekujących</h1>
                            <p className="text-gray-500 mb-6">Jesteś na pozycji <span className="font-black text-amber-600">#{queuePos}</span>. Powiadomimy Cię gdy znajdziemy dopasowanie! 🔔</p>
                            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                                <p className="text-sm font-semibold text-amber-800 mb-1">Szacowany czas oczekiwania</p>
                                <p className="text-xs text-amber-600">{queuePos <= 3 ? "Krótko — kilka minut" : queuePos <= 10 ? "Do kilku godzin" : "Do 24 godzin"}</p>
                            </div>
                            <button onClick={handleRecheck} className="w-full bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 mb-3">Sprawdź ponownie 🔄</button>
                            <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Przejdź do dashboardu →</button>
                        </div>
                    )}

                    {phase === "rematch_limit" && (
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-4xl mb-6">🔒</div>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Limit rematchu</h1>
                            <p className="text-gray-500 mb-6">Plan Free pozwala na 1 rematch na miesiąc. Następny rematch możliwy za <span className="font-bold text-orange-600">{rematchDaysLeft} dni</span>.</p>
                            <button onClick={() => router.push("/pricing")} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-200 transition-all duration-200 mb-3">Odblokuj Premium — nieograniczone rematche ⭐</button>
                            <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">Wróć do dashboardu →</button>
                        </div>
                    )}

                    {phase === "error" && (
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl mb-6">❌</div>
                            <h1 className="text-2xl font-black text-gray-900 mb-2">Coś poszło nie tak</h1>
                            <p className="text-gray-500 mb-6">{errorMsg}</p>
                            <button onClick={() => { setPhase("searching"); if (userId) setTimeout(() => callFind(userId), 1000); }} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl transition-all duration-200">Spróbuj ponownie</button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
