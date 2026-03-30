"use client";

import { useRouter } from "next/navigation";

interface UpgradePromptProps {
    feature: string;
    requiredTier: "premium" | "pro";
}

export default function UpgradePrompt({ feature, requiredTier }: UpgradePromptProps) {
    const router = useRouter();
    const isPremium = requiredTier === "premium";
    const price = isPremium ? "29 zł/mies." : "59 zł/mies.";
    const tierLabel = isPremium ? "Premium ⭐" : "Pro 🚀";

    return (
        <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Blurred mock content behind */}
            <div className="p-5 blur-sm select-none pointer-events-none opacity-60">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-24 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-2xl mb-4">
                    🔒
                </div>
                <p className="font-black text-gray-900 text-base mb-1">
                    {feature}
                </p>
                <p className="text-sm text-gray-500 mb-5">
                    Ta funkcja wymaga planu{" "}
                    <span className="font-semibold text-gray-700">{tierLabel}</span>
                </p>
                <button
                    onClick={() => router.push("/pricing")}
                    className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-green-200 transition-all duration-200"
                >
                    Odblokuj za {price}
                </button>
            </div>
        </div>
    );
}
