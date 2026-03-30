"use client";

import Link from "next/link";

export default function LandingPage() {
  const steps = [
    {
      number: "01",
      emoji: "🎯",
      title: "Ustaw swój cel",
      desc: "Wybierz 1–3 cele zdrowotne, które chcesz osiągnąć. Od nawodnienia po medytację.",
    },
    {
      number: "02",
      emoji: "🤝",
      title: "Znajdź partnera",
      desc: "Sparujemy Cię z kimś o podobnych celach i porze zameldowań.",
    },
    {
      number: "03",
      emoji: "🔥",
      title: "Melduj się codziennie",
      desc: "Razem budujcie serię – nie zrywaj łańcucha i nie zawiedź swojego partnera!",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Mobile container */}
      <div className="w-full max-w-[430px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💚</span>
            <span className="font-bold text-xl text-gray-900">Health Buddy</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cennik"
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cennik
            </Link>
            <Link
              href="/zarejestruj-sie"
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Rejestracja
            </Link>
            <Link
              href="/logowanie"
              className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Logowanie
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 px-6">
          <div className="pt-8 pb-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-green-700">Ponad 2 400 aktywnych par</span>
            </div>

            <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
              Nie zrywaj łańcucha.{" "}
              <span className="text-green-500">Nie zawiedź przyjaciela.</span>
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Health Buddy paruje Cię z kimś o podobnych celach zdrowotnych. Razem meldujecie się każdego dnia i budujecie nawyki, które zostają na zawsze.
            </p>

            <Link
              href="/onboarding"
              className="block w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white text-center font-bold text-lg py-4 rounded-2xl shadow-lg shadow-green-200 transition-all duration-200"
            >
              Znajdź swojego Buddiego 🚀
            </Link>

            <p className="text-center text-xs text-gray-400 mt-3">
              Bezpłatnie · Bez karty kredytowej · Po polsku
            </p>
          </div>

          {/* Floating buddy preview */}
          <div className="relative my-6 animate-slide-up delay-200">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-5 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-lg shadow-md">
                  AN
                </div>
                <div>
                  <p className="font-bold text-gray-900">Anna, 32</p>
                  <p className="text-xs text-green-600 font-medium">✅ Zameldowana dziś</p>
                </div>
                <div className="ml-auto flex items-center gap-1 bg-orange-100 rounded-full px-3 py-1">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-bold text-orange-600 text-sm">7</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["💧 Woda", "🏃 Ruch", "😴 Sen"].map((goal) => (
                  <span
                    key={goal}
                    className="text-xs bg-white border border-green-200 text-green-700 font-medium px-3 py-1 rounded-full"
                  >
                    {goal}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-600 italic">
                &ldquo;Wypiłam 2l wody i poszłam na bieg! 🏃&rdquo;
              </p>
            </div>

            {/* Notification bubble */}
            <div className="absolute -top-3 -right-3 bg-white border border-gray-100 rounded-2xl shadow-xl px-3 py-2 animate-bounce-slow">
              <p className="text-xs font-semibold text-gray-700">Twoja kolej! 👋</p>
            </div>
          </div>

          {/* How it works */}
          <section className="mt-4 mb-8 animate-slide-up delay-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Jak to działa?</h2>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
                    {step.number}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-0.5">
                      {step.emoji} {step.title}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Social proof */}
          <div className="bg-green-500 rounded-3xl p-6 mb-8 text-center animate-slide-up delay-500">
            <p className="text-white font-bold text-2xl mb-1">94%</p>
            <p className="text-green-100 text-sm">użytkowników utrzymuje cel dłużej niż 30 dni, gdy ma Buddiego</p>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Health Buddy · Made with 💚</p>
        </footer>
      </div>
    </div>
  );
}
