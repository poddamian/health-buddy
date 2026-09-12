"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import type { SubscriptionTier } from "@/lib/stripe";

const PLANS = [
    {
        id: "free" as SubscriptionTier,
        name: "Free",
        price: "0 zł",
        period: "",
        desc: "Na dobry początek",
        badge: null,
        priceId: null,
        color: "border-gray-200",
        buttonClass: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        features: [
            { label: "1 Buddy na raz", ok: true },
            { label: "Max 2 nawyki", ok: true },
            { label: "Podstawowy dashboard", ok: true },
            { label: "Filtry buddich", ok: false },
            { label: "Wiadomości głosowe", ok: false },
            { label: "Szczegółowe statystyki", ok: false },
            { label: "Grupy (do 5 osób)", ok: false },
            { label: "AI Buddy Coach", ok: false },
            { label: "Eksport PDF", ok: false },
        ],
        comingSoon: [] as string[],
    },
    {
        id: "premium" as SubscriptionTier,
        name: "Premium",
        price: "29 zł",
        period: "/mies.",
        desc: "Dla poważnych",
        badge: "Najpopularniejszy",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
        color: "border-green-400 ring-2 ring-green-200",
        buttonClass: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200",
        features: [
            { label: "Nieograniczone nawyki", ok: true },
            { label: "Filtry buddich", ok: false },
            { label: "Wiadomości głosowe (30 sek)", ok: false },
            { label: "Szczegółowe statystyki i wykresy", ok: false },
            { label: "Grupy (do 5 osób)", ok: false },
            { label: "AI Buddy Coach", ok: false },
            { label: "Eksport PDF", ok: false },
        ],
        comingSoon: ["Filtry buddich", "Wiadomości głosowe", "Szczegółowe statystyki i wykresy"],
    },
    {
        id: "pro" as SubscriptionTier,
        name: "Pro",
        price: "59 zł",
        period: "/mies.",
        desc: "Pełna moc",
        badge: null,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        color: "border-gray-200",
        buttonClass: "bg-gray-900 text-white hover:bg-gray-800",
        features: [
            { label: "Wszystko z Premium", ok: true },
            { label: "Grupy do 5 osób", ok: false },
            { label: "AI Buddy Coach (codzienne wskazówki)", ok: false },
            { label: "Eksport postępów PDF", ok: false },
        ],
        comingSoon: ["Grupy do 5 osób", "AI Buddy Coach", "Eksport postępów PDF"],
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { user, isLoaded, isSignedIn } = useUser();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;
        const load = async () => {
            setUserId(user.id);
            setUserEmail(user.primaryEmailAddress?.emailAddress ?? "");
            const res = await fetch("/api/profile/me");
            if (res.ok) {
                const { profile } = await res.json();
                setCurrentTier((profile?.subscription_tier as SubscriptionTier) ?? "free");
            }
        };
        load();
    }, [isLoaded, isSignedIn, user]);

    const handleChoosePlan = async (plan: typeof PLANS[number]) => {
        if (!plan.priceId) return; // free plan – do nothing
        if (!userId) { router.push("/sign-in"); return; }
        if (currentTier === plan.id) return;

        setLoading(plan.id);
        try {
            const res = await fetch("/api/stripe/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId: plan.priceId, email: userEmail }),
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch {
            setLoading(null);
        }
    };

    const handleManagePortal = async () => {
        if (!userId) return;
        setLoading("portal");
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const { url } = await res.json();
        if (url) window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            <div className="w-full max-w-[430px] flex flex-col min-h-screen">
                {/* Header */}
                <header className="px-6 py-5 flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Strona główna
                    </Link>
                    <Link href="/" className="flex items-center gap-2 ml-auto">
                        <span className="text-xl">💚</span>
                        <span className="font-bold text-gray-900">Health Buddy</span>
                    </Link>
                    {currentTier && currentTier !== "free" && (
                        <button
                            onClick={handleManagePortal}
                            disabled={loading === "portal"}
                            className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {loading === "portal" ? "Ładowanie…" : "Zarządzaj subskrypcją →"}
                        </button>
                    )}
                </header>

                <main className="flex-1 px-4 pb-10 animate-fade-in">
                    {/* Hero */}
                    <div className="text-center px-2 mb-8">
                        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-green-700">Wybierz swój plan</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">
                            Inwestuj w{" "}
                            <span className="text-green-500">swoje nawyki</span>
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Zacznij za darmo. Ulepsz gdy będziesz gotowy.
                        </p>
                    </div>

                    {/* Plan cards */}
                    <div className="space-y-4">
                        {PLANS.map((plan) => {
                            const isCurrent = currentTier === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-3xl border-2 p-5 transition-all duration-200 ${plan.color} ${isCurrent ? "bg-green-50/30" : ""}`}
                                >
                                    {/* Badge */}
                                    {plan.badge && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md shadow-green-200">
                                                {plan.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Plan header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-black text-xl text-gray-900">{plan.name}</h2>
                                                {isCurrent && (
                                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                        Twój plan
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{plan.desc}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                                            <span className="text-sm text-gray-400">{plan.period}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-5">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className={`text-sm flex-shrink-0 ${f.ok ? "text-green-500" : "text-gray-300"}`}>
                                                    {f.ok ? "✅" : "❌"}
                                                </span>
                                                <span className={`text-sm ${f.ok ? "text-gray-700" : "text-gray-400"}`}>
                                                    {f.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {plan.comingSoon.length > 0 && (
                                        <p className="text-xs text-gray-400 mb-5 -mt-3">
                                            🚧 {plan.comingSoon.join(", ")} — już wkrótce
                                        </p>
                                    )}

                                    {/* CTA Button */}
                                    {isCurrent ? (
                                        <div className="w-full py-3 rounded-2xl bg-green-50 border border-green-200 text-center text-sm font-bold text-green-600">
                                            ✓ Aktywny plan
                                        </div>
                                    ) : plan.id === "free" ? (
                                        <button
                                            onClick={() => router.push(userId ? "/dashboard" : "/zarejestruj-sie")}
                                            className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all duration-200 ${plan.buttonClass}`}
                                        >
                                            {userId ? "Pozostań na Free" : "Zacznij za darmo"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleChoosePlan(plan)}
                                            disabled={loading === plan.id}
                                            className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 disabled:opacity-60 transition-all duration-200 ${plan.buttonClass}`}
                                        >
                                            {loading === plan.id
                                                ? "Przenoszę do płatności…"
                                                : plan.id === "premium"
                                                    ? "Przejdź na Premium"
                                                    : "Przejdź na Pro"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust note */}
                    <p className="text-center text-xs text-gray-400 mt-6 px-4">
                        🔒 Płatności obsługuje Stripe. Możesz anulować w dowolnym momencie.
                    </p>
                </main>
            </div>
        </div>
    );
}
