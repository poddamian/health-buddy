export type HabitCategory =
    | "fitness"
    | "diet"
    | "sleep"
    | "mental"
    | "detox"
    | "productivity";

export type HabitFrequency = "daily" | "weekly_3" | "weekly_1";
export type HabitDifficulty = "easy" | "medium" | "hard";

export interface Habit {
    id: string;
    category: HabitCategory;
    icon: string;
    name: string;
    description: string;
    frequency: HabitFrequency;
    difficulty: HabitDifficulty;
}

export const HABITS: Habit[] = [
    // 🏃 Ruch i fitness
    {
        id: "running",
        category: "fitness",
        icon: "🏃",
        name: "Codzienny bieg",
        description: "Minimum 20 minut biegu na świeżym powietrzu",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "gym",
        category: "fitness",
        icon: "💪",
        name: "Trening siłowy",
        description: "Ćwiczenia siłowe minimum 3x w tygodniu",
        frequency: "weekly_3",
        difficulty: "hard",
    },
    {
        id: "walking",
        category: "fitness",
        icon: "🚶",
        name: "10 000 kroków",
        description: "Dzienna norma aktywności fizycznej",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "cycling",
        category: "fitness",
        icon: "🚴",
        name: "Jazda na rowerze",
        description: "Minimum 30 minut jazdy na rowerze",
        frequency: "weekly_3",
        difficulty: "medium",
    },
    {
        id: "stretching",
        category: "fitness",
        icon: "🤸",
        name: "Rozciąganie",
        description: "15 minut stretchingu każdego dnia",
        frequency: "daily",
        difficulty: "easy",
    },

    // 💧 Dieta i nawodnienie
    {
        id: "water",
        category: "diet",
        icon: "💧",
        name: "Pij 2L wody",
        description: "Minimalne dzienne nawodnienie organizmu",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "no_sugar",
        category: "diet",
        icon: "🚫",
        name: "Bez cukru",
        description: "Eliminacja cukrów prostych i słodyczy",
        frequency: "daily",
        difficulty: "hard",
    },
    {
        id: "vegetables",
        category: "diet",
        icon: "🥗",
        name: "Warzywa każdego dnia",
        description: "Minimum 5 porcji warzyw i owoców",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "no_alcohol",
        category: "diet",
        icon: "🍺",
        name: "Bez alkoholu",
        description: "Całkowita abstynencja od alkoholu",
        frequency: "daily",
        difficulty: "hard",
    },
    {
        id: "meal_prep",
        category: "diet",
        icon: "🍱",
        name: "Meal prep",
        description: "Przygotowanie zdrowych posiłków na cały tydzień",
        frequency: "weekly_1",
        difficulty: "medium",
    },

    // 😴 Sen i regeneracja
    {
        id: "sleep_8h",
        category: "sleep",
        icon: "😴",
        name: "Sen 8 godzin",
        description: "Kładzenie się spać przed 23:00",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "no_phone_bed",
        category: "sleep",
        icon: "📵",
        name: "Telefon przed snem",
        description: "Odkładanie telefonu 1h przed snem",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "morning_routine",
        category: "sleep",
        icon: "🌅",
        name: "Poranna rutyna",
        description: "Wstawanie o stałej porze bez drzemek",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "nap",
        category: "sleep",
        icon: "💤",
        name: "Drzemka regeneracyjna",
        description: "20-minutowa drzemka po południu",
        frequency: "daily",
        difficulty: "easy",
    },

    // 🧘 Zdrowie psychiczne
    {
        id: "meditation",
        category: "mental",
        icon: "🧘",
        name: "Medytacja",
        description: "Minimum 10 minut medytacji lub mindfulness",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "journaling",
        category: "mental",
        icon: "📔",
        name: "Dziennik wdzięczności",
        description: "Zapisanie 3 rzeczy za które jesteś wdzięczny",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "reading",
        category: "mental",
        icon: "📚",
        name: "Czytanie książek",
        description: "Minimum 20 stron dobrej książki dziennie",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "therapy",
        category: "mental",
        icon: "🛋️",
        name: "Terapia / coaching",
        description: "Regularne sesje terapeutyczne",
        frequency: "weekly_1",
        difficulty: "medium",
    },
    {
        id: "digital_detox",
        category: "mental",
        icon: "🔕",
        name: "Digital detox",
        description: "Godzina bez mediów społecznościowych dziennie",
        frequency: "daily",
        difficulty: "hard",
    },

    // 🚭 Używki i detoks
    {
        id: "no_smoking",
        category: "detox",
        icon: "🚭",
        name: "Rzuć palenie",
        description: "Każdy dzień bez papierosa się liczy",
        frequency: "daily",
        difficulty: "hard",
    },
    {
        id: "no_coffee",
        category: "detox",
        icon: "☕",
        name: "Ogranicz kawę",
        description: "Maksymalnie 1 kawa dziennie",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "no_fastfood",
        category: "detox",
        icon: "🍔",
        name: "Bez fast foodów",
        description: "Eliminacja przetworzonej żywności",
        frequency: "daily",
        difficulty: "hard",
    },

    // ⚡ Produktywność zdrowotna
    {
        id: "cold_shower",
        category: "productivity",
        icon: "🚿",
        name: "Zimny prysznic",
        description: "Zakończenie prysznica zimną wodą przez 30 sekund",
        frequency: "daily",
        difficulty: "hard",
    },
    {
        id: "supplements",
        category: "productivity",
        icon: "💊",
        name: "Suplementacja",
        description: "Codzienne przyjmowanie witamin i suplementów",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "sunlight",
        category: "productivity",
        icon: "☀️",
        name: "Słońce rano",
        description: "10 minut na słońcu w ciągu pierwszej godziny po wstaniu",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "no_snooze",
        category: "productivity",
        icon: "⏰",
        name: "Bez drzemki budzika",
        description: "Wstawanie przy pierwszym dzwonieniu budzika",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "breathing",
        category: "productivity",
        icon: "🌬️",
        name: "Ćwiczenia oddechowe",
        description: "5 minut świadomego oddychania (np. metoda Wima Hofa)",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "posture",
        category: "productivity",
        icon: "🪑",
        name: "Poprawna postawa",
        description: "Godzinna przerwa od siedzenia i ćwiczenia postawy",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "steps_5k",
        category: "fitness",
        icon: "👟",
        name: "5 000 kroków minimum",
        description: "Lżejsza wersja aktywności dla zapracowanych",
        frequency: "daily",
        difficulty: "easy",
    },
    {
        id: "plank",
        category: "fitness",
        icon: "🏋️",
        name: "Codzienna deska",
        description: "Minimum 60 sekund planku dziennie",
        frequency: "daily",
        difficulty: "medium",
    },
    {
        id: "intermittent_fasting",
        category: "diet",
        icon: "⏱️",
        name: "Post przerywany (16:8)",
        description: "Jedzenie tylko w oknie 8 godzin",
        frequency: "daily",
        difficulty: "hard",
    },
];

export const CATEGORIES: { id: HabitCategory | "all"; label: string; icon: string }[] = [
    { id: "all", label: "Wszystkie", icon: "✨" },
    { id: "fitness", label: "Fitness", icon: "🏃" },
    { id: "diet", label: "Dieta", icon: "💧" },
    { id: "sleep", label: "Sen", icon: "😴" },
    { id: "mental", label: "Mental", icon: "🧘" },
    { id: "detox", label: "Detoks", icon: "🚭" },
    { id: "productivity", label: "Produktywność", icon: "⚡" },
];

export const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
    daily: "Codziennie",
    weekly_3: "3x w tygodniu",
    weekly_1: "1x w tygodniu",
};

export const DIFFICULTY_CONFIG: Record<
    HabitDifficulty,
    { label: string; dot: string; text: string }
> = {
    easy: { label: "Łatwy", dot: "🟢", text: "text-green-600" },
    medium: { label: "Średni", dot: "🟡", text: "text-yellow-600" },
    hard: { label: "Trudny", dot: "🔴", text: "text-red-500" },
};

export function getById(id: string): Habit | undefined {
    return HABITS.find((h) => h.id === id);
}

export function getByCategory(category: HabitCategory | "all"): Habit[] {
    if (category === "all") return HABITS;
    return HABITS.filter((h) => h.category === category);
}
