# Health Buddy — podstawa do dokumentów prawnych

> **Zastrzeżenie:** ten plik NIE zawiera skopiowanych fragmentów polityk prywatności ani regulaminów innych firm — to byłoby naruszenie ich praw autorskich, a poza tym cudzy dokument i tak nie pasowałby prawnie do tej aplikacji (inny zakres danych, inny administrator). Poniżej jest zestawienie **czego prawo (RODO + polska ustawa o świadczeniu usług drogą elektroniczną, uśude) wymaga**, dopasowane do tego co Health Buddy faktycznie robi z danymi — to ma być szkielet, na podstawie którego Ty (najlepiej z prawnikiem/generatorem typu iubenda, Wzory24, LegalTech) spiszesz właściwe dokumenty.

## Co faktycznie robi aplikacja z danymi (stan na 2026-09-12)

- **Rejestracja/logowanie:** przez Clerk (imię, e-mail, hasło/OAuth) — Clerk jest podmiotem przetwarzającym (processor) spoza UE, prawdopodobnie USA
- **Profil:** imię, wiek, płeć (m/k), strefa czasowa, zdjęcie profilowe (Supabase Storage, bucket publiczny)
- **Nawyki i cele (`habits`, `goals`):** mogą być traktowane jako **dane dotyczące zdrowia** w rozumieniu art. 9 RODO (kategoria szczególna) — np. nawyk "bieganie", "picie wody", cel wagowy
- **Dopasowywanie do "buddy'ego":** algorytm matchujący po wspólnych nawykach, porze check-inów, strefie czasowej — dane profilu jednego usera są pokazywane drugiemu (imię, wiek, zdjęcie, nawyki, streak)
- **Check-iny / streaki:** historia realizacji nawyków, notatki tekstowe
- **Płatności:** Stripe (Checkout + Customer Portal + webhooks) — Stripe jest processorem, przechowuje dane karty (Health Buddy nigdy nie widzi numeru karty)
- **Już zaimplementowane:** eksport danych użytkownika (`/api/profile/export`), usunięcie konta (`/api/profile/delete`) — pokrywają prawo do przenoszenia i do bycia zapomnianym

## Dokumenty, które są potrzebne

### 1. Polityka prywatności (RODO art. 13/14)
Musi zawierać:
- Tożsamość i dane kontaktowe administratora danych (Ty / Twoja firma)
- Cele przetwarzania i podstawa prawna dla każdego celu osobno:
  - realizacja umowy (art. 6.1.b) — konto, matching, check-iny
  - zgoda (art. 6.1.a + art. 9.2.a dla danych zdrowotnych) — **nawyki/cele dot. zdrowia wymagają odrębnej, wyraźnej zgody**, nie wystarczy ogólna zgoda na regulamin
  - obowiązek prawny (art. 6.1.c) — np. dane do faktur
  - prawnie uzasadniony interes (art. 6.1.f) — analityka, bezpieczeństwo
- Kategorie danych (wymień: dane konta, dane profilu, dane zdrowotne/nawyki, dane płatności, dane techniczne/logi)
- Odbiorcy danych / podmioty przetwarzające — **wymień z nazwy**: Clerk (auth), Supabase (baza + storage), Stripe (płatności), Vercel (hosting) — dla każdego zaznacz czy przekazuje dane poza EOG i na jakiej podstawie (Standard Contractual Clauses / decyzja adekwatności)
- Okres przechowywania danych (np. "do usunięcia konta" + ile trzymacie backup po usunięciu)
- Prawa użytkownika: dostęp, sprostowanie, usunięcie, ograniczenie, przenoszenie, sprzeciw, cofnięcie zgody, skarga do PUODO
- Informacja że dane innego usera (buddy'ego) widoczne w profilu są udostępniane w ramach realizacji usługi — warto to jasno nazwać, bo to nietypowe (dane jednego usera trafiają do drugiego)
- Czy są zautomatyzowane decyzje/profilowanie (art. 22) — **matching algorytmem to prawdopodobnie tak**, trzeba to opisać
- Dane kontaktowe do zgłoszenia naruszenia / IOD jeśli dotyczy

### 2. Regulamin świadczenia usług (uśude + RODO powiązania)
Musi zawierać:
- Definicje, dane usługodawcy (NIP/REGON jeśli działalność zarejestrowana)
- Zakres i warunki świadczenia usługi (konto, subskrypcje Free/Premium/Pro — z **dokładnym** opisem co każdy plan realnie zawiera, żeby uniknąć zarzutu wprowadzania w błąd konsumenta — pamiętaj że część funkcji Premium/Pro jest oznaczona jako "już wkrótce", regulamin musi to odzwierciedlać)
- Warunki zawarcia i rozwiązania umowy, zasady rezygnacji z subskrypcji (`cancel_at_period_end` — opisz że dostęp trwa do końca opłaconego okresu)
- **Prawo konsumenta do odstąpienia od umowy w 14 dni** (ustawa o prawach konsumenta) — dla usług cyfrowych trzeba wprost zapytać o zgodę na natychmiastowe rozpoczęcie świadczenia z utratą prawa odstąpienia, albo dać 14 dni na zwrot
- Reklamacje — tryb i termin rozpatrzenia
- Zasady korzystania z funkcji społecznościowej (matching) — co wolno/nie wolno pisać w notatkach do check-inów, zasady zgłaszania nadużyć innego użytkownika
- Odpowiedzialność (ograniczenie odpowiedzialności w granicach prawa — nie można wyłączyć odpowiedzialności wobec konsumenta całkowicie)
- Dane osobowe — odesłanie do polityki prywatności

### 3. Zgoda na przetwarzanie danych o zdrowiu (osobny checkbox przy rejestracji)
- Krótki, osobny checkbox (**nie** zaznaczony domyślnie) przy zgodzie na regulamin: "Wyrażam zgodę na przetwarzanie danych o moich nawykach i celach zdrowotnych w celu dopasowania partnera (buddy'ego) i śledzenia postępów"
- Obecnie apka najpewniej **nie ma** tego jako osobnej zgody (do sprawdzenia w kodzie onboardingu) — to prawny gap, warto załatać przed realnym startem

### 4. Cookies (jeśli używacie analityki/marketingu)
- Jeśli tylko cookies sesyjne Clerk — baner może być minimalny (niezbędne cookies nie wymagają zgody)
- Jeśli dojdzie Google Analytics/Meta Pixel — trzeba pełny cookie banner z opcją odmowy

## Narzędzia do wygenerowania właściwych dokumentów
- Polskie generatory z realnym wsparciem prawnym: **iubenda** (ma polską wersję, płatne, generuje politykę + regulamin dopasowane do wskazanych integracji), **Wzory24**, **eRadca**, lub konsultacja z prawnikiem specjalizującym się w RODO/e-commerce (jednorazowy koszt rzędu kilkuset-kilku tysięcy zł dla małej appki)
- Przy wypełnianiu takiego generatora wklej im sekcję "Co faktycznie robi aplikacja z danymi" z tego pliku — to da im dokładny zakres integracji (Clerk, Supabase, Stripe, Vercel) i kategorii danych

## Domeny i konkurencja
Patrz osobna notatka `docs/research-domeny-konkurencja.md` (research w toku).
