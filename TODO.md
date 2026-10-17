# Health Buddy — do zrobienia

## 1. Teraz (szybkie, ~30 min razem)

- **Wyłączyć swoją opłatę 29 zł** (konto poddamian@gmail.com ma aktywne Premium):
  1. **dashboard.stripe.com** (tryb live, nie „Test mode”) → **Customers** → znajdź `poddamian@gmail.com`.
  2. W sekcji Subscriptions kliknij subskrypcję → **Cancel subscription** → **Immediately** (od razu Free) albo „End of period” (do końca opłaconego miesiąca).
  3. Jeśli chcesz odzyskać 29 zł na kartę: **Payments** → kliknij tę płatność → **Refund**. Prowizja Stripe (ok. 1–2 zł) nie wraca. Pieniądze i tak trafiły na Twoje konto Stripe — płaciłeś sam sobie.
- **Włączyć w Stripe „panel klienta”** — bez tego przycisk „Wróć na Free / Zarządzaj subskrypcją” na stronie z cenami nie zadziała. Stripe Dashboard (tryb **live**) → Settings → Billing → **Customer portal** → zaznacz „Customers can cancel subscriptions” (najlepiej „at end of billing period”) → **Save**.
- **Sprawdzić, czy anulowanie działa** — po włączeniu panelu klienta: zaloguj się na konto z Premium (np. kup je jeszcze raz i zaraz zwróć pieniądze), wejdź w **Cennik** → „Wróć na Free (anuluj subskrypcję)”. Powinna otworzyć się strona Stripe. Jeśli zamiast tego pojawi się czerwony komunikat błędu — daj znać, jaki.
- **Sprawdzić „budzik” Supabase** — Vercel → projekt → Settings → **Cron Jobs**: powinno być zadanie `/api/health` codziennie o 6:00. Jeśli baza jest teraz uśpiona, raz obudź ją ręcznie: Supabase Dashboard → **Restore**.
- **Powiadomienia o płatnościach** — w Stripe: Settings → Notifications (Communication preferences) → włącz maile o nieudanych webhookach. Webhook to wiadomość, którą Stripe wysyła do appki po płatności — jeśli nie dojdzie, użytkownik zapłaci, a nie dostanie Premium.

## 2. Przed wpuszczeniem prawdziwych ludzi

**Porządki w danych**
- **Kopia zapasowa bazy** — Supabase Dashboard → Database → Backups → zrób ręczną kopię, zanim pojawią się prawdziwe dane.
- **Usunąć konta testowe** (Kasia, Ania, Antek, Marek — te bez wpisanej płci), żeby nie były dobierane w pary z prawdziwymi ludźmi.

**Prawo (RODO)**
- **Polityka prywatności i regulamin** — szkic tego, co muszą zawierać, jest w `docs/legal-podstawa.md`. Trzeba z tego zrobić prawdziwe dokumenty: najtaniej przez generator (np. iubenda), pewniej przez prawnika. Appka zbiera dane o nawykach/zdrowiu, więc to ważne.
- **Checkbox zgody na dane zdrowotne** przy rejestracji (w onboardingu) — przepisy wymagają osobnej, wyraźnej zgody. To mogę dodać ja, gdy będzie gotowy tekst zgody.

**Start na małą skalę**
- Najpierw 10–20 znajomych, którzy używają appki naprawdę (swój mail, prawdziwe dane). Łatwiej wyłapać błędy na kilku osobach niż na kilkuset. Dopiero potem publiczny post.

## 3. Później — appka na telefon

Do zdecydowania, jak ją zrobić:
- **Opakowanie obecnej strony w appkę** (Capacitor) — szybciej i taniej, appka wygląda jak strona.
- **Osobna, prawdziwa appka** (React Native / Flutter) — więcej pracy, ale lepiej działa i wygląda na telefonie.

W obu przypadkach strona `healthbuddy.pl` zostaje (jako strona główna + polityka prywatności, której wymagają sklepy Google/Apple). Przy appce trzeba będzie też dodać na stronie małe pliki, dzięki którym linki `healthbuddy.pl/...` otwierają się od razu w appce.

## Na razie nie trzeba nic robić

- **Sentry działa** (błędy trafiają na sentry.io, projekt Health Buddy). Opcjonalnie później: „czytelne ślady błędów” (source maps) — wymaga tokenu z Sentry (Settings → Auth Tokens) dodanego w Vercel jako `SENTRY_AUTH_TOKEN` + nazwy projektu jako `SENTRY_PROJECT`. Bez tego Sentry też działa, tylko opisy błędów są mniej czytelne.

- **Limity darmowych planów** — wrócić do tematu, gdy Supabase Dashboard pokaże, że zbliżasz się do limitu.
- Research konkurencji jest w `docs/research-domeny-konkurencja.md` — do wglądu, gdy będzie potrzebny.
