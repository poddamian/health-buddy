# Health Buddy — stan aplikacji i dalsze kroki

Aktualizacja: 2026-09-12. Aplikacja jest **live na produkcji**: https://health-buddy-plum.vercel.app
Repo: `github.com/poddamian/health-buddy`. Supabase: projekt `soenomaktdfxrisdvkyl`. Stripe: konto **"Health-Buddy-App"** (zmienione z „Aplikacje finn”), tryb testowy, `acct_1T7H3C93fCbPzUVA`.

### 2. ✅ Sprawdzone 2026-09-12 — Clerk/Stripe, oba mają realne blokery, decyzja: zostajemy na razie w trybie testowym

**Clerk → produkcja: zablokowane brakiem domeny.** Sprawdzone w Clerk Dashboardzie: projekt jest w trybie **Development** (limit userów, banner „Development mode” na ekranach logowania). Przejście na Production wymaga **własnej domeny z dostępem do DNS** (CNAME, do 48h propagacji) + własnych danych OAuth zamiast współdzielonych kluczy testowych Google/Facebook/Apple. Sprawdzone w Vercelu: projekt nie ma żadnej podpiętej domeny, tylko darmowe `health-buddy-plum.vercel.app`.
→ **Decyzja (2026-09-12): zostajemy w Development** na czas zamkniętego testu ze znajomymi (patrz punkt 3C). Wrócić do tego przy zakupie własnej domeny / przed publicznym startem.

**Stripe → tryb Live: zablokowane weryfikacją tożsamości, utknęło.** Sprawdzone w Stripe Dashboardzie (`Settings → Account status`): zadanie „Verify Damian Podbielski's identity” ma status **„In review”**, **wypłaty (Payouts) wstrzymane od 13 lipca 2026**. Płatności testowe działają normalnie (stąd nasze udane testy), ale realne pieniądze nie trafiłyby na konto do czasu zakończenia weryfikacji. Stripe standardowo obiecuje 2–3 dni — u nas trwa to **prawie 2 miesiące**.
→ **Do zrobienia (tylko Ty, wymaga Twoich danych osobowych):** skontaktuj się ze wsparciem Stripe (dashboard.stripe.com → Help → Contact support) i zapytaj o status weryfikacji — możliwe, że czekają na dodatkowy dokument, którego nie widać w dashboardzie.
→ Reszta kroków Live (nowe produkty/ceny, nowy webhook, `sk_live_...`/`whsec_...`/`pk_live_...` w Vercel) ma sens dopiero po odblokowaniu wypłat.

### 3. Jak zapewnić, że appka faktycznie działa, gdy wejdą pierwsi prawdziwi użytkownicy (obecnie tylko konta testowe)

Wirtualni/testowi userzy sprawdzają *funkcje*, ale nie sprawdzają *rzeczywistości*: prawdziwe opóźnienia sieciowe, prawdziwe błędy płatności, ludzi porzucających formularz w połowie, prawdziwe adresy e-mail z literówkami. Żeby to złapać przed/podczas startu:

**A. Widoczność błędów (zanim user napisze "appka nie działa")**
- Podłącz error tracking (np. Sentry — darmowy plan wystarczy na start) do Next.js, żeby wyjątki na froncie i w API routes lądowały w jednym miejscu z stack trace, zamiast ginąć w konsoli przeglądarki użytkownika
- Włącz Vercel Log Drains / sprawdzaj `Runtime Logs` w Vercel Dashboardzie regularnie na starcie — tam już teraz widać 500-ki z API routes
- Dodaj alert (Stripe Dashboard → Developers → Webhooks → sprawdzaj tab "Failed" ręcznie na start, albo email alert) na nieudane dostarczenia webhooków — jeśli webhook przestanie działać, ludzie zapłacą i zostaną na Free, a Ty się nie dowiesz bez tego

**B. Monitoring podstawowego zdrowia**
- Jest już `/api/health` — podłącz do niego darmowy uptime monitor (UptimeRobot, Better Uptime) z alertem na e-mail/SMS, żeby wiedzieć o wywrotce zanim powie Ci user

**C. Kontrolowany start zamiast "puszczenia w świat"**
- Zacznij od zamkniętej grupy (znajomi, 10–20 osób) zanim zrobisz publiczny post/reklamę — łatwiej naprawić błąd zgłoszony przez 5 osób niż przez 500
- Poproś tę grupę o realną ścieżkę: rejestracja własnym mailem, prawdziwe imię, prawdziwa płeć, prawdziwy check-in kilka dni z rzędu — to jedyny sposób, żeby złapać np. literówki w odmianie, dziwne przypadki brzegowe w matchingu (0 kandydatów, wszyscy o tej samej porze), realny czas ładowania

**D. Dane i backup**
- Zrób pierwszy ręczny backup Supabase (Dashboard → Database → Backups) zanim pojawią się prawdziwe dane — plan Free robi backupy rzadziej niż Pro
- Sprawdź RLS jeszcze raz po dodaniu kolumny `gender` (migracja nie zmienia polityk, ale zawsze warto zerknąć po migracji)

**E. Zgodność prawna (RODO/UODO — polska aplikacja z danymi zdrowotnymi/osobowymi)**
- Habits/goals mogą być traktowane jako dane wrażliwe (dot. zdrowia) — sprawdź czy potrzebujesz polityki prywatności i zgody na przetwarzanie danych zdrowotnych przed pierwszym prawdziwym userem, nie po
- „Eksportuj moje dane” i „Usuń konto” już działają — to dobrze pokrywa prawo do przenoszenia i bycia zapomnianym

**F. Obciążenie**
- Free plan Supabase: 500 MB, Free plan Vercel: limity funkcji — dla pierwszych dziesiątek/setek userów wystarczy z zapasem, nie ma potrzeby nic zmieniać teraz; wróć do tego dopiero gdy zaczniesz zbliżać się do limitów (Supabase Dashboard pokazuje % wykorzystania)

Nie trzeba robić tego wszystkiego na raz — punkty A i C (error tracking + mała zamknięta grupa testowa) dają największy zwrot najmniejszym kosztem i warto zrobić je pierwsze.

### 4. Rzeczy odłożone (nie blokują startu)

- `STRIPE_WEBHOOK_SECRET` w Vercel to sekret z prawdziwego zarejestrowanego endpointu testowego — OK dla trybu testowego, do podmiany przy przejściu na Live (patrz punkt 2)
- Stare konta testowe (Kasia/Ania/Antek/Marek) zostają w bazie z `gender = NULL` — nieszkodliwe, ale warto je usunąć przed realnym startem, żeby nie mieszały się w matchingu z prawdziwymi userami

