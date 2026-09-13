# Health Buddy — do zrobienia

Aktualizacja: 2026-09-13. Aplikacja **live na produkcji**: https://health-buddy-plum.vercel.app (docelowo `healthbuddy.pl`)
Repo: `github.com/poddamian/health-buddy`. Supabase: projekt `soenomaktdfxrisdvkyl`. Stripe: konto "Health-Buddy-App", `acct_1T7H3C93fCbPzUVA` — **weryfikacja tożsamości zakończona, wypłaty odblokowane**.

## W toku — przejście Stripe na tryb Live

Kod (checkout/webhook/portal w `src/app/api/stripe/*`, `src/lib/stripe.ts`) korzysta wyłącznie ze zmiennych środowiskowych, nie wymagał zmian.

- [x] Produkty/ceny Premium (29 zł, `price_1UFGzyQ8QTeeawRtmnLD2BY0`) i Pro (59 zł, `price_1UFGzzQ8QTeeawRt0t0GMn0k`) utworzone w trybie Live
- [x] Webhook Live na `/api/stripe/webhook` utworzony (`we_1UFGzzQ8QTeeawRtWrHq9Aq3`)
- [x] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` ustawione w Vercel dla środowiska Production (Preview zostaje na test mode celowo, żeby podglądy PR nie robiły prawdziwych obciążeń)
- [x] Redeploy produkcji wykonany 2026-09-13 (`dpl_9QRHknfzPDM3hNS3Msa1TWPRu7Dq`, zaaliasowany na healthbuddy.pl) — od teraz działa Stripe Live
- [x] Test pełnej ścieżki płatności na produkcji prawdziwą kartą — udany (Premium), po drodze wypłynęły i zostały naprawione 2 buga: stary `stripe_customer_id` z trybu testowego w Supabase powodował 500 na checkout; import `FEATURES` do klienckiego dashboardu ciągnął cały serwerowy Stripe SDK do bundla przeglądarki (`new Stripe(...)` bez klucza w przeglądarce crashował każdą stronę) — wydzielone do `src/lib/features.ts`

## Zgłoszone, naprawione (do potwierdzenia po deployu)

- **Przyciski nie wyglądały klikalnie** — Tailwind v4 resetuje `button { cursor: default }` w całej apce, więc żaden przycisk (w tym ikonka wylogowania w nagłówku dashboardu) nie pokazywał kursora "łapki". Dodano globalną regułę `cursor: pointer` dla przycisków w `src/app/globals.css`, a ikonkę wylogowania obudowano widocznym tłem (koło, hover na czerwono), żeby było wiadomo że to przycisk.

## Znany limit — matching czasem nie znajduje buddy'ego

Dla konta testowego poddamian@gmail.com (profil "Ania") matching nie znalazł pary — **to nie bug, tylko efekt małej bazy profili**. Diagnoza: jedyny dostępny kandydat to "Antek" (profil testowy), wynik dopasowania Ania↔Antek = 30/100 (brak wspólnych nawyków, różne pory check-inu, różnica wieku 22 lata), a próg `MIN_MATCH_SCORE` w `src/lib/matching.ts` to 40 — więc trafia do kolejki (`matching_queue`) zamiast dostać buddy'ego. Algorytm działa zgodnie z założeniem, po prostu obecna pula profili (głównie konta testowe: Kasia/Ania/Antek/Marek/Testowa3) jest za mała i niekompatybilna.

Do decyzji przed realnym startem:
- Obniżyć `MIN_MATCH_SCORE` (mniej trafne dopasowania, ale mniej osób utknie w kolejce przy małej bazie)
- Dodać widoczny fallback w UI, gdy user wisi w kolejce dłużej niż X dni (np. "poszerzyliśmy kryteria")
- Nic nie zmieniać — przy realnych użytkownikach (szersza baza) problem sam zniknie; potraktować jako spodziewane zachowanie na etapie testów

## Do zrobienia po propagacji domeny

- **Clerk → Production** — wymaga własnej domeny z DNS (teraz będzie gotowa) + własnych danych OAuth zamiast współdzielonych kluczy testowych Google/Facebook/Apple (obecnie w trybie Development, limit userów, banner na ekranach logowania)
- Skonfigurować Universal Links (iOS) / App Links (Android) pod domeną, jeśli/gdy powstanie appka mobilna (patrz sekcja niżej) — potrzebne pliki weryfikacyjne hostowane na `healthbuddy.pl`

## Appka mobilna (Android / może iOS) — decyzja architektoniczna do podjęcia

Plan: użytkownicy mają docelowo korzystać z appki, nie przeglądarki. Domena i backend (obecny Next.js/API) zostają potrzebne niezależnie (patrz uzasadnienie w historii rozmowy) — do ustalenia jest **jak** zbudować appkę:
- natywna appka (React Native / Flutter) korzystająca z tych samych `/api/*` co teraz, czy
- WebView-wrapper (Capacitor) opakowujący obecny Next.js

Do ustalenia przed startem prac nad appką. Wersja przeglądarkowa może zostać jako landing/marketing + polityka prywatności (wymagana przez App Store/Google Play) — nie trzeba jej "ukrywać", naturalnie przestanie być głównym kanałem gdy powstanie appka.

## Przed prawdziwym startem (realni użytkownicy, nie testowi)

**Widoczność błędów**
- Error tracking (Sentry — free plan wystarczy) do Next.js, żeby wyjątki nie ginęły w konsoli użytkownika
- Alert na nieudane webhooki Stripe (Dashboard → Developers → Webhooks → tab "Failed")
- Uptime monitor (UptimeRobot/Better Uptime) podpięty pod istniejący `/api/health`

**Kontrolowany start**
- Zacząć od zamkniętej grupy (znajomi, 10-20 osób) z realną ścieżką (własny mail, prawdziwe dane) zanim pójdzie publiczny post — łatwiej złapać błędy na 5 osobach niż na 500

**Dane**
- Pierwszy ręczny backup Supabase (Dashboard → Database → Backups) zanim pojawią się prawdziwe dane
- Usunąć stare konta testowe (Kasia/Ania/Antek/Marek, `gender = NULL`) przed realnym startem, żeby nie mieszały się w matchingu

**Zgodność prawna (RODO/UODO)**
- Szkielet gotowy w `docs/legal-podstawa.md` (czego wymaga polityka prywatności i regulamin dla tej appki — dane o nawykach jako potencjalnie wrażliwe, matching jako profilowanie, lista procesorów Clerk/Supabase/Stripe/Vercel) — do przepisania na właściwe dokumenty (iubenda / prawnik)
- Brak osobnej zgody (checkbox) na przetwarzanie danych zdrowotnych przy rejestracji — do dodania w onboardingu
- Research domen/konkurencji w `docs/research-domeny-konkurencja.md`

**Obciążenie** — nie wymaga akcji teraz, wrócić dopiero przy zbliżaniu się do limitów Free (Supabase Dashboard pokazuje % wykorzystania)
