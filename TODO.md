# Health Buddy — przegląd stanu aplikacji i lista rzeczy do zrobienia

Przegląd wykonany 2026-09-05. Stack: Next.js 16 (App Router, Turbopack) + Clerk (auth) + Supabase (dane) + Stripe (płatności). `npm install` + `npm run build` przechodzą bez błędów.

## Priorytet naprawy

Wszystkie punkty 1–13 zostały zaadresowane w kodzie. Poniżej dokładna instrukkcja, co zrobić dalej, żeby to wszystko zaczęło działać na żywo.

Projekt Supabase: `soenomaktdfxrisdvkyl` (z `NEXT_PUBLIC_SUPABASE_URL`). Repo: `github.com/poddamian/health-buddy` (poprzednio `damianpod/health-buddy` — to konto stracone, brak dostępu do powiązanego maila; zmieniono remote 2026-09-12).

### 1. Uruchom migrację SQL na Supabase

Migracja `supabase/migrations/0001_init.sql` musi zostać wykonana na bazie — bez tego RLS, kolumna `checked_habits` i tabela `nudges` nie zaczną działać naprawdę (nudge dalej będzie zwracał 501, a check-in będzie chodził na fallbacku).

**Opcja A — przez Dashboard (najprostsza, zalecana):**
1. Wejdź na `https://supabase.com/dashboard/project/soenomaktdfxrisdvkyl/sql/new`.
2. Otwórz lokalnie plik `supabase/migrations/0001_init.sql`, zaznacz całość, skopiuj.
3. Wklej do SQL Editora w Dashboardzie i kliknij **Run**.
4. Sprawdź na dole, że nie ma błędów (powinno pokazać „Success. No rows returned”).

**Opcja B — przez Supabase CLI:**
```
npx supabase login
npx supabase link --project-ref soenomaktdfxrisdvkyl
npx supabase db push
```
Przy `login` otworzy się przeglądarka do autoryzacji; przy `push` CLI samo znajdzie plik w `supabase/migrations/` i go zaaplikuje.

**Uwaga o bezpieczeństwie tej migracji:** `CREATE TABLE IF NOT EXISTS` nic nie nadpisze — jeśli tabele `profiles`/`buddies`/`checkins`/`matching_queue` już istnieją z danymi, migracja tylko doda brakujące elementy (kolumnę `checked_habits`, tabelę `nudges`, funkcję `increment_streak`, RLS). Nie kasuje danych. Mimo to: **zrób wcześniej snapshot/backup bazy** (Dashboard → Database → Backups) na wszelki wypadek, zwłaszcza przed włączeniem RLS.

### 2. Zweryfikuj RLS po migracji

Migracja włącza `ROW LEVEL SECURITY` na wszystkich tabelach **bez żadnych polityk** dla `anon`/`authenticated` — celowo, bo cała aplikacja po poprawkach czyta/pisze wyłącznie przez API routes kluczem `service_role` (który i tak omija RLS).

1. W Dashboardzie: **Authentication → Policies** (lub Table Editor → wybierz tabelę → zakładka RLS) — sprawdź, że każda z tabel (`profiles`, `buddies`, `checkins`, `matching_queue`, `nudges`) ma RLS **enabled** i **0 polityk**.
2. Jeśli klucz `anon` jest gdziekolwiek indziej używany bezpośrednio do tych tabel (inna aplikacja, skrypt, integracja zewnętrzna) — przestanie to działać po tej migracji. W obecnym kodzie repo nic już tak nie robi, ale warto się upewnić, że nie ma zewnętrznych zależności.

### 3. Zbackfilluj `is_available_for_matching` dla istniejących userów

Migracja ustawia `default true` tylko dla **nowych** wierszy. Jeśli w tabeli `profiles` są już realni userzy sprzed tej poprawki, mogli utknąć z `is_available_for_matching = false`/`null` i nigdy nie zostaną wzięci pod uwagę w matchingu.

W SQL Editorze uruchom (osobno, po migracji):
```sql
update profiles
set is_available_for_matching = true
where is_available_for_matching is not true
  and id not in (
    select user1_id from buddies where status = 'active'
    union
    select user2_id from buddies where status = 'active'
  );
```
To ustawi `true` wszystkim, którzy **nie mają** aktualnie aktywnego buddy'ego (użytkownicy z aktywnym buddym mają `false` celowo — tak działa logika matchingu).

### 4. Sprawdź zmienne środowiskowe

Nic nowego nie jest wymagane (żadne nowe zmienne `.env` nie zostały dodane), ale `DELETE /api/profile/delete` korzysta z `CLERK_SECRET_KEY` do usuwania konta w Clerku — upewnij się, że ten klucz ma uprawnienia administracyjne (domyślny **Secret Key** z Clerk Dashboardu ma je z automatu, więc jeśli logowanie/rejestracja już działają, to również zadziała).

### 5. Stripe — zarejestruj webhook (KRYTYCZNE, blokuje realne płatności)

Sprawdziłem stan konta Stripe bezpośrednio przez API kluczem z `.env.local`:
- Konto `acct_1T7H3C93fCbPzUVA`, tryb **testowy** (`sk_test_...`), płatności włączone.
- Obie ceny istnieją i są aktywne: **Premium** `price_1TG2iZ93fCbPzUVANiDCQ8lB` = 29 zł/mies., **Pro** `price_1TG2jO93fCbPzUVAw16BgMsb` = 59 zł/mies. — zgadza się z `pricing/page.tsx`.
- **Zero zarejestrowanych webhook endpointów.** `STRIPE_WEBHOOK_SECRET` w `.env.local` to najpewniej sekret z lokalnego `stripe listen` (dev), a nie z realnego endpointu.

**Skutek, jeśli tego nie naprawisz:** ktoś zapłaci prawdziwą (lub testową) kartą przez `create-checkout`, Stripe pobierze pieniądze, ale `/api/stripe/webhook` nigdy nie zostanie wywołany przez Stripe → `subscription_tier` w Supabase nigdy się nie zaktualizuje → użytkownik zapłacił, a zostaje na planie Free.

**Co zrobić:**
1. Wejdź na `https://dashboard.stripe.com/test/webhooks` (tryb testowy — bo tam są Twoje obecne klucze/ceny).
2. Kliknij **Add endpoint**.
3. Endpoint URL: `https://<twoja-domena-produkcyjna>/api/stripe/webhook` (albo tymczasowo URL z Vercel preview, jeśli jeszcze nie masz własnej domeny).
4. Wybierz zdarzenia nasłuchiwane przez kod (`src/app/api/stripe/webhook/route.ts`): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. Po utworzeniu Stripe pokaże **Signing secret** (`whsec_...`) — skopiuj go i ustaw jako `STRIPE_WEBHOOK_SECRET` **w Vercelu** (Project Settings → Environment Variables), nie tylko lokalnie.
6. Do testów lokalnych użyj Stripe CLI zamiast realnego endpointu:
   ```
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   CLI wypisze osobny `whsec_...` do wklejenia w `.env.local` na czas testów lokalnych (to jest inny sekret niż ten z Dashboardu dla produkcji — każdy endpoint ma swój).
7. Zrób pełny testowy zakup: `/pricing` → wybierz Premium → na stronie Stripe Checkout użyj testowej karty `4242 4242 4242 4242`, dowolna przyszła data ważności, dowolny CVC → po powrocie na `/dashboard?upgraded=true` sprawdź w Supabase (`profiles.subscription_tier`), że faktycznie zmieniło się na `premium`.
8. Sprawdź też anulowanie: w `https://dashboard.stripe.com/test/subscriptions` znajdź testową subskrypcję i anuluj → sprawdź, że webhook `customer.subscription.deleted` przestawił `subscription_tier` z powrotem na `free` w Supabase.

**Przed realnym uruchomieniem (prawdziwe pieniądze):** to wszystko jest w **trybie testowym** Stripe. Gdy będziesz gotowy na prawdziwe płatności, trzeba powtórzyć ten sam proces w trybie **Live** (`https://dashboard.stripe.com/webhooks`, bez `/test/`): nowe produkty/ceny w trybie Live (inne ID niż testowe!), nowy webhook endpoint, nowe klucze `sk_live_...`/`whsec_...`/`pk_live_...` w zmiennych środowiskowych produkcji.

**Dodatkowo:** `NEXT_PUBLIC_APP_URL` nie jest ustawione w `.env.local` (jest tylko w `.env.example`). Kod ma fallback na `http://localhost:3000` (`src/app/api/stripe/create-checkout/route.ts`, `src/app/api/stripe/portal/route.ts`) — jeśli ta zmienna zabraknie też na Vercelu, użytkownik po płatności lub w portalu rozliczeniowym zostanie przekierowany na `localhost` zamiast na Twoją domenę. Ustaw `NEXT_PUBLIC_APP_URL=https://<twoja-domena>` w Vercel Environment Variables.

### 6. Przetestuj lokalnie przed wdrożeniem

```
npm run build
npm test
npm run dev
```
Otwórz `http://localhost:3000` i przejdź realną ścieżką na **testowym koncie** (nie na głównym, bo test obejmuje usuwanie konta):
1. Rejestracja → onboarding (imię, nawyki, pora meldunku) → powinno przekierować do `/matching`.
2. `/matching` → jeśli nie ma jeszcze drugiego usera do dopasowania, powinieneś trafić do „queued” (a nie zawiesić się w nieskończoność — to był efekt punktu 4 z listy błędów wyżej).
3. Załóż **drugie** konto testowe z podobnymi nawykami/porą → powinno dopasować obu użytkowników.
4. `/dashboard` → sprawdź: prawdziwe imię buddy'ego (nie „Anna”), przycisk „Popchnij” (na świeżo zmigrowanej bazie z tabelą `nudges` powinien pokazać „✓ Wysłano”, a nie „Wkrótce dostępne”).
5. Zrób check-in z zaznaczonymi nawykami → `/checkin-success` powinien pokazać prawdziwy streak i imię buddy'ego w URL-u (`?streak=1&buddy=...`).
6. Wróć do dashboardu, zakładka „Profil” → sprawdź, że „Meldunki” pokazuje realną liczbę, a nie „21”.
7. Zakładka „Ustawienia” → kliknij „Eksportuj moje dane” → powinien pobrać się plik `health-buddy-dane.json` z realnymi danymi.
8. Na koncie **testowym** kliknij „Usuń konto” → potwierdź → sprawdź, że nastąpiło wylogowanie i przekierowanie na `/`, a w Clerk Dashboardzie ten user faktycznie zniknął z listy Users.

### 7. Zacommituj zmiany

`git status` pokazuje sporo niezacommitowanych zmian: `package.json`, poprawione route'y API, nowe endpointy (`src/app/api/buddy/feed`, `src/app/api/buddy/nudge`, `src/app/api/profile/delete`, `src/app/api/profile/export`, `src/app/api/profile/update`), `src/lib/matching.test.ts`, katalog `supabase/`, ten plik `TODO.md`, oraz usunięty `src/lib/supabase.ts`. Commit dopiero na wyraźną prośbę:
```
git add -A
git commit -m "..."
```

### 8. Wdrożenie (Vercel)

Repo ma `vercel.json`, więc zakładamy deploy przez Vercel:
1. Po commicie: `git push origin main` (albo branch + PR, zależnie jak zwykle pracujesz).
2. Vercel powinien zbudować automatycznie. Sprawdź w Vercel Dashboardzie, że zmienne środowiskowe (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`, klucze Stripe, **`NEXT_PUBLIC_APP_URL`** — te same co w `.env.local`, plus poprawiony `STRIPE_WEBHOOK_SECRET` z kroku 5) są ustawione **tam**, a nie tylko lokalnie.
3. **Migrację SQL (krok 1) wykonaj na tej samej instancji Supabase, której używa produkcja** — jeśli są osobne projekty Supabase dla dev/prod, powtórz kroki 1–3 na obu.
4. **Webhook Stripe (krok 5) musi wskazywać na finalny adres produkcyjny** — jeśli domena się zmieni po pierwszym deployu, zaktualizuj URL endpointu w Stripe Dashboardzie.
5. Po deployu powtórz krótki smoke test z kroku 6 na produkcyjnym URL-u, łącznie z testowym zakupem Premium (krok 5.7).
