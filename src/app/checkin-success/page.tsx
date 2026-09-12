"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { conj, type Gender } from "@/lib/grammar";

export default function CheckinSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
            </div>
        }>
            <CheckinSuccessContent />
        </Suspense>
    );
}

function CheckinSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showConfetti, setShowConfetti] = useState(false);
    const streak = Number(searchParams.get("streak") ?? 1) || 1;
    const buddyName = searchParams.get("buddy");
    const buddyGender = searchParams.get("buddyGender") as Gender;
    const meGender = searchParams.get("meGender") as Gender;

    useEffect(() => {
        const t = setTimeout(() => setShowConfetti(true), 100);
        return () => clearTimeout(t);
    }, []);

    const confettiEmojis = ["🎉", "✨", "🎊", "💚", "⭐", "🏆", "💪", "🔥"];

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                {/* Header */}
                <header className="px-6 py-5 flex items-center gap-2">
                    <span className="text-xl">💚</span>
                    <span className="font-bold text-gray-900">Health Buddy</span>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    {/* Confetti emojis */}
                    <div className="relative w-full mb-6">
                        {confettiEmojis.map((emoji, i) => (
                            <span
                                key={i}
                                className={`absolute text-2xl transition-all duration-700 ${showConfetti ? "opacity-100" : "opacity-0"
                                    }`}
                                style={{
                                    left: `${10 + i * 11}%`,
                                    top: `${Math.sin(i) * 20}px`,
                                    transform: `rotate(${(i - 4) * 15}deg)`,
                                    transitionDelay: `${i * 80}ms`,
                                }}
                            >
                                {emoji}
                            </span>
                        ))}
                        <div className="h-12"></div>
                    </div>

                    {/* Main celebration */}
                    <div
                        className={`transform transition-all duration-700 ${showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"
                            } w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-200 mb-6`}
                    >
                        <span className="text-5xl">✅</span>
                    </div>

                    <h1
                        className={`text-3xl font-black text-gray-900 mb-2 transition-all duration-700 delay-300 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        Brawo! 🎉
                    </h1>

                    <p
                        className={`text-gray-500 text-lg mb-8 transition-all duration-700 delay-400 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        {buddyName ? `${buddyName} ${conj(buddyGender, "został powiadomiony", "została powiadomiona", "został/-a powiadomiony/-a")}. Tak trzymać! 💪` : "Tak trzymać! 💪"}
                    </p>

                    {/* Streak card */}
                    <div
                        className={`w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 mb-6 shadow-lg shadow-green-200 transition-all duration-700 delay-500 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <p className="text-green-100 text-sm font-semibold mb-2">Twoja aktualna seria</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-5xl">🔥</span>
                            <div>
                                <p className="text-white font-black text-5xl">{streak}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-white font-bold text-lg">dzień</p>
                                <p className="text-green-200 text-sm">Kontynuuj jutro!</p>
                            </div>
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mt-5">
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-2 rounded-full transition-all duration-300 ${i < streak ? "bg-white" : "bg-green-400/40"
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-green-200 text-xs mt-2 text-center">Cel: 7 dni z rzędu</p>
                    </div>

                    {/* Buddy notification */}
                    {buddyName && (
                        <div
                            className={`w-full bg-gray-50 rounded-2xl p-4 mb-6 transition-all duration-700 delay-500 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                                    {buddyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 text-sm">{buddyName} {conj(buddyGender, "dostał", "dostała", "dostał/-a")} powiadomienie! 🔔</p>
                                    <p className="text-xs text-gray-500">Wie, że się {conj(meGender, "zameldowałeś", "zameldowałaś", "zameldowałeś/-aś")} dziś</p>
                                </div>
                                <span className="ml-auto text-xl">👍</span>
                            </div>
                        </div>
                    )}

                    {/* Motivation quote */}
                    <div
                        className={`w-full bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 transition-all duration-700 delay-600 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <p className="text-sm text-green-700 font-medium italic">
                            &ldquo;Sukces to suma małych wysiłków powtarzanych dzień po dniu.&rdquo;
                        </p>
                        <p className="text-xs text-green-500 mt-1">— Robert Collier</p>
                    </div>

                    {/* CTA */}
                    <div
                        className={`w-full space-y-3 transition-all duration-700 delay-700 ${showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-green-200 transition-all duration-200"
                        >
                            Wróć do panelu głównego
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full text-gray-400 hover:text-gray-600 font-medium text-sm py-2 transition-colors"
                        >
                            Strona główna
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
