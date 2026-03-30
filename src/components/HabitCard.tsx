"use client";

import type { Habit } from "@/lib/habits";
import { FREQUENCY_LABELS, DIFFICULTY_CONFIG } from "@/lib/habits";

interface HabitCardProps {
    habit: Habit;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}

export default function HabitCard({ habit, selected, disabled = false, onClick }: HabitCardProps) {
    const diff = DIFFICULTY_CONFIG[habit.difficulty];
    const freq = FREQUENCY_LABELS[habit.frequency];

    return (
        <button
            onClick={onClick}
            disabled={disabled && !selected}
            className={`
                relative w-full text-left rounded-2xl border-2 p-3.5 transition-all duration-200
                ${selected
                    ? "border-green-500 bg-green-50 shadow-md shadow-green-100 scale-[1.02]"
                    : disabled
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 active:scale-[0.98]"
                }
            `}
        >
            {/* Selected checkmark */}
            {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                </span>
            )}

            {/* Icon */}
            <span className="text-2xl block mb-2">{habit.icon}</span>

            {/* Name */}
            <p className={`font-bold text-sm leading-tight mb-1 ${selected ? "text-green-800" : "text-gray-900"}`}>
                {habit.name}
            </p>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-snug mb-2.5 line-clamp-2">
                {habit.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selected ? "bg-green-200 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {freq}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${selected ? "bg-green-200 text-green-800" : "bg-gray-100"}`}>
                    <span>{diff.dot}</span>
                    <span className={selected ? "text-green-800" : diff.text}>{diff.label}</span>
                </span>
            </div>
        </button>
    );
}
