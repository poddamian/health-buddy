"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { HABITS, CATEGORIES, getByCategory } from "@/lib/habits";
import type { HabitCategory } from "@/lib/habits";
import type { SubscriptionTier } from "@/lib/stripe";
import HabitCard from "@/components/HabitCard";
import UpgradePrompt from "@/components/UpgradePrompt";

const TIMES = [
    { id: "morning", emoji: "🌅", label: "Rano", time: "6:00–10:00" },
    { id: "afternoon", emoji: "☀️", label: "Południe", time: "12:00–16:00" },
    { id: "evening", emoji: "🌙", label: "Wieczór", time: "18:00–22:00" },
];

const FREE_LIMIT = 2;

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoaded, isSignedIn } = useUser();
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState<"m" | "k" | "">("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<HabitCategory | "all">("all");
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { router.push("/sign-in"); return; }

        const load = async () => {
            const res = await fetch("/api/profile/me");
            if (res.ok) {
                const { profile } = await res.json();
                if (profile?.name) {
                    router.push("/dashboard");
                    return;
                }
                if (profile?.subscription_tier) {
                    setSubscriptionTier(profile.subscription_tier as SubscriptionTier);
                }
            }
        };
        load();
    }, [isLoaded, isSignedIn, user, router]);

    const maxHabits = subscriptionTier === "free" ? FREE_LIMIT : Infinity;
    const filteredHabits = getByCategory(activeCategory);

    const toggleHabit = (id: string) => {
        setShowUpgradePrompt(false);
        setSelectedHabits((prev) => {
            if (prev.includes(id)) return prev.filter((h) => h !== id);
            if (subscriptionTier === "free" && prev.length >= FREE_LIMIT) {
                setShowUpgradePrompt(true);
                return prev;
            }
            return [...prev, id];
        });
    };

    const canProceedStep1 = name.trim().length >= 2 && age.length > 0 && gender !== "";
    const canProceedStep2 = selectedHabits.length >= 1;
    const canProceedStep3 = selectedTime !== "";

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarError(null);
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) { setAvatarError(data.error ?? "Nie udało się wgrać zdjęcia"); return; }
            setAvatarUrl(data.url);
        } catch {
            setAvatarError("Błąd sieci — spróbuj ponownie");
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleNext = async () => {
        if (step < 3) { setStep(step + 1); return; }
        if (!isSignedIn || !user) { setSaveError("Sesja wygasła. Odśwież stronę."); return; }

        setSaving(true);
        setSaveError(null);

        const res = await fetch("/api/profile/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name.trim(),
                age: parseInt(age, 10),
                gender,
                avatar_url: avatarUrl,
                habits: selectedHabits,
                goals: selectedHabits,
                checkin_time: selectedTime,
                streak: 0,
                subscription_tier: "free",
                created_at: new Date().toISOString(),
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            console.error("Profile upsert error:", data);
            setSaveError(`Błąd zapisu: ${data.error ?? "Nieznany błąd"}`);
            setSaving(false);
            return;
        }

        router.push("/matching");
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                <header className="px-6 py-5 flex items-center gap-3">
                    {step > 1 && (
                        <button onClick={() => { setStep(step - 1); setShowUpgradePrompt(false); }}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center gap-2"><span className="text-xl">💚</span><span className="font-bold text-gray-900">Health Buddy</span></div>
                </header>

                <div className="px-6 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-green-600">Krok {step} z 3</span>
                        <span className="text-xs text-gray-400 ml-auto">{step === 1 ? "Kim jesteś?" : step === 2 ? "Twoje nawyki" : "Pora meldunków"}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
                    </div>
                </div>

                <main className="flex-1 px-6 animate-fade-in overflow-hidden">
                    {/* STEP 1 */}
                    {step === 1 && (
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 mb-1">Cześć! 👋</h1>
                            <p className="text-gray-500 mb-6">Powiedz nam coś o sobie, byśmy mogli dobrać idealnego partnera.</p>

                            <div className="flex flex-col items-center mb-6">
                                <label className="relative cursor-pointer group">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 group-hover:border-green-400 flex items-center justify-center overflow-hidden transition-colors">
                                        {avatarUploading ? (
                                            <div className="w-6 h-6 rounded-full border-2 border-green-200 border-t-green-500 animate-spin" />
                                        ) : avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarUrl} alt="Twoje zdjęcie profilowe" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl">📷</span>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} className="sr-only" />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">{avatarUrl ? "Zmień zdjęcie (opcjonalnie)" : "Dodaj zdjęcie (opcjonalnie)"}</p>
                                {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Twoje imię</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Marek"
                                        className="w-full border-2 border-gray-200 focus:border-green-500 rounded-2xl px-4 py-3.5 text-gray-900 font-medium outline-none transition-colors text-base" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Twój wiek</label>
                                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="np. 28" min="13" max="100"
                                        className="w-full border-2 border-gray-200 focus:border-green-500 rounded-2xl px-4 py-3.5 text-gray-900 font-medium outline-none transition-colors text-base" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Płeć</label>
                                    <p className="text-xs text-gray-400 mb-2">Używamy tego wyłącznie do poprawnej polskiej odmiany (np. &bdquo;zrobiłaś&rdquo; / &bdquo;zrobiłeś&rdquo;).</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[{ id: "k", label: "Kobieta" }, { id: "m", label: "Mężczyzna" }].map((g) => (
                                            <button key={g.id} type="button" onClick={() => setGender(g.id as "m" | "k")}
                                                className={`rounded-2xl px-4 py-3.5 font-semibold border-2 transition-colors ${gender === g.id ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-gray-700 hover:border-green-300"}`}>
                                                {g.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-4">
                                <p className="text-sm text-green-700 font-medium">🔒 Twoje dane są bezpieczne. Udostępniamy partnerowi tylko imię i wybrane cele.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-1">
                                <h1 className="text-2xl font-black text-gray-900">Twoje nawyki 🎯</h1>
                                {subscriptionTier === "free" && (
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedHabits.length >= FREE_LIMIT ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>{selectedHabits.length}/{FREE_LIMIT}</span>
                                )}
                                {subscriptionTier !== "free" && selectedHabits.length > 0 && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{selectedHabits.length} wybranych</span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mb-3">{subscriptionTier === "free" ? `Wybierz do ${FREE_LIMIT} nawyków – sparujemy Cię z kimś o podobnych celach.` : "Wybierz dowolną liczbę nawyków – sparujemy Cię z kimś o podobnych celach."}</p>

                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                                {CATEGORIES.map((cat) => (
                                    <button key={cat.id} onClick={() => setActiveCategory(cat.id as HabitCategory | "all")}
                                        className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 ${activeCategory === cat.id ? "bg-green-500 text-white shadow-sm shadow-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>

                            {showUpgradePrompt && (
                                <div className="mb-3 animate-fade-in"><UpgradePrompt feature="Nieograniczone nawyki 💪" requiredTier="premium" /></div>
                            )}

                            <div className="overflow-y-auto flex-1 -mx-1 px-1">
                                <div className="grid grid-cols-2 gap-2.5 pb-4">
                                    {filteredHabits.map((habit) => {
                                        const isSelected = selectedHabits.includes(habit.id);
                                        const isDisabled = subscriptionTier === "free" && selectedHabits.length >= FREE_LIMIT && !isSelected;
                                        return <HabitCard key={habit.id} habit={habit} selected={isSelected} disabled={isDisabled} onClick={() => toggleHabit(habit.id)} />;
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 mb-1">Kiedy się meldujesz? ⏰</h1>
                            <p className="text-gray-500 mb-6">Dobierzemy partnera, który melduje się o podobnej porze dnia.</p>
                            <div className="space-y-3">
                                {TIMES.map((t) => {
                                    const isSelected = selectedTime === t.id;
                                    return (
                                        <button key={t.id} onClick={() => setSelectedTime(t.id)}
                                            className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 border-2 ${isSelected ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" : "bg-white border-gray-200 text-gray-800 hover:border-green-300 hover:bg-green-50"}`}>
                                            <span className="text-3xl">{t.emoji}</span>
                                            <div>
                                                <p className={`font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>{t.label}</p>
                                                <p className={`text-sm ${isSelected ? "text-green-100" : "text-gray-400"}`}>{t.time}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="ml-auto w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-6 bg-gray-50 rounded-2xl p-4">
                                <p className="text-sm text-gray-500 font-medium">🔔 Będziesz otrzymywać przypomnienia o wybranej porze. Możesz to zmienić w ustawieniach.</p>
                            </div>
                        </div>
                    )}
                </main>

                <div className="px-6 py-5">
                    {saveError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                            <p className="text-sm text-red-600 font-medium">❌ {saveError}</p>
                        </div>
                    )}
                    <button onClick={handleNext}
                        disabled={saving || (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3)}
                        className={`w-full font-bold text-lg py-4 rounded-2xl transition-all duration-200 ${((step === 1 && canProceedStep1) || (step === 2 && canProceedStep2) || (step === 3 && canProceedStep3))
                            ? "bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-60 text-white shadow-lg shadow-green-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                        {saving ? "Zapisywanie…" : step === 3 ? "Znajdź mojego Buddiego 🚀" : "Dalej →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
