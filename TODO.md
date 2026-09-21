# Health Buddy — do zrobienia

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
