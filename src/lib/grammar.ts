// Polish grammar helpers, driven by the user's stored gender ('m' | 'k' | null).

export type Gender = "m" | "k" | null | undefined;

// Picks the grammatically correct form; falls back to the "/-a" placeholder
// when gender is unknown (older profiles, or users who skipped the question).
export function conj(gender: Gender, masculine: string, feminine: string, neutral: string): string {
    if (gender === "m") return masculine;
    if (gender === "k") return feminine;
    return neutral;
}

// ponytail: heuristic Polish instrumental case (declension) for first names.
// Covers the common -a ending (most Polish female names: Kasia -> Kasią) and
// -ek ending (Marek -> Markiem, Tomek -> Tomkiem); anything else falls back
// to appending "em", which is right more often than not but not guaranteed.
// Upgrade path: swap in a real declension library if names diverge more.
export function toInstrumental(name: string): string {
    if (!name) return name;
    if (/a$/.test(name)) return name.slice(0, -1) + "ą";
    if (/ek$/i.test(name)) return name.slice(0, -2) + "kiem";
    return name + "em";
}
