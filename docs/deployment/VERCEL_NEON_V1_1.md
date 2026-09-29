# TaskFlow v1.1 — wdrożenie Vercel + Neon

Stan na 2026-09-29: **wdrożone i zweryfikowane**. Poniższe kroki 1–2 opisują powtórzenie konfiguracji; nie należy tworzyć kolejnych projektów ani ponownie uruchamiać migracji bez potrzeby.

## Potwierdzona produkcja

- Aplikacja: [https://taskflow-ochre-two.vercel.app/](https://taskflow-ochre-two.vercel.app/), istniejący projekt Vercel `taskflow`, branch Git `main`, plan Hobby. Deployment z `fe9101e` miał status **Ready** i tę domenę jako alias; po kolejnych commitach należy sprawdzić nowy deployment.
- Baza: istniejący projekt Neon `taskflow-v11-demo`, branch `production`, baza `neondb`. Właściciel wykonał `prisma migrate deploy` i `prisma migrate status`; odczyt z tej bazy potwierdził trzy zakończone migracje. Nie wykonywano produkcyjnego seeda, `migrate reset`, `migrate dev`, `db push` ani zestawu E2E na Neon.
- Smoke test HTTPS: dwie kontrolowane rejestracje i sesje, izolacja przestrzeni, zaproszenie, projekt, zadanie, Kanban, checklista, filtry, komentarz, przypisanie, powiadomienia, metryki, odświeżenie, usunięcie zadania, archiwizacja projektu i wylogowanie — zaliczone. Zrzuty publicznej aplikacji są w `docs/screenshots/v1.1-stage4/`.
- Logi Vercel z przedziału 2026-09-29 17:38–17:54 UTC: **0 odpowiedzi 5xx**, **0 wpisów Prisma**; siedem wpisów na poziomie `error` dotyczy wyłącznie ostrzeżenia `pg-connection-string` o przyszłej zmianie semantyki `sslmode=require`. Obecna wersja traktuje je jako `verify-full`; przy aktualizacji `pg` trzeba jawnie utrzymać weryfikację certyfikatu.
- Dwa konta i dwie przestrzenie smoke testu zostały usunięte jedną transakcją z dokładnymi identyfikatorami po sprawdzeniu projektu, branchu, bazy i odczycie rekordów. Kontrola po operacji wykazała `0` wskazanych kont i `0` wskazanych przestrzeni. Nie czyszczono całej bazy.

## 1. Baza demonstracyjna

1. Na [Neon](https://console.neon.tech/) zaloguj się i wybierz bezpłatny plan. Utwórz **nowy, pusty** projekt tylko dla publicznego TaskFlow, np. `taskflow-v11-demo`. Nie podłączaj lokalnej bazy developerskiej.
2. W panelu **Connect** skopiuj dwa adresy dla tej samej gałęzi, bazy i roli: **pooled** (`-pooler` w hoście) jako `DATABASE_URL` oraz **direct** (bez `-pooler`) jako `DIRECT_URL`. Oba powinny mieć `sslmode=require`. Nie wklejaj ich do czatu ani do śledzonych plików.
3. Migracje uruchom **przed** pierwszą udaną publikacją kodu. Na komputerze z repozytorium i Node.js 24 użyj PowerShell, wprowadź `DIRECT_URL` w ukrytym polu i sprawdź, czy docelowy host kończy się na `.neon.tech` oraz nie zawiera `-pooler`:

   ```powershell
   $secure = Read-Host 'Neon DIRECT_URL' -AsSecureString
   $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
   try {
     $env:DIRECT_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
     $target = [Uri]$env:DIRECT_URL
     if ($target.Host -notmatch '\.neon\.tech$' -or $target.Host -match '-pooler') { throw 'To nie jest bezpośredni adres Neon.' }
     pnpm prisma migrate deploy
     if ($LASTEXITCODE -ne 0) { throw 'Migracje nie powiodły się.' }
     pnpm prisma migrate status
     if ($LASTEXITCODE -ne 0) { throw 'Stan migracji nie został potwierdzony.' }
   } finally {
     [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
     Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
   }
   ```

   `prisma.config.ts` używa `DIRECT_URL` dla CLI; aplikacja używa `DATABASE_URL`. `migrate deploy` stosuje trzy wersjonowane migracje, a `migrate status` potwierdza ich stan. Nie używaj `migrate reset`, `migrate dev`, `db push` ani `db seed` na Neon.

## 2. Hosting

1. Na [Vercel](https://vercel.com/new) wybierz bezpłatny plan Hobby i importuj istniejące repozytorium `K-Kabak/taskflow` z GitHub. Nie twórz nowego repozytorium.
2. Ustaw Framework Preset **Next.js**, Root Directory `.` i produkcyjny branch `main`. Wersja Node wynika z `engines.node` (`24.x`). Pozostaw standardowe katalogi wyjściowe Next.js. Build Command: `pnpm build` (generuje klienta Prisma); instalacja przez Corepack z `packageManager: pnpm@12.1.0`.
3. Przed pierwszym deployem dodaj w **Project Settings → Environment Variables**, dla **Production**:

   | Nazwa | Wartość |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled URL |
   | `DIRECT_URL` | Neon direct URL, używany przez Prisma CLI podczas buildu |
   | `NEXTAUTH_SECRET` | nowy, losowy sekret, co najmniej 32 bajty |
   | `RATE_LIMIT_SECRET` | inny, nowy losowy sekret, co najmniej 32 bajty |
   | `NEXTAUTH_URL` | dokładny domyślny adres produkcyjny `https://...vercel.app` bez ścieżki |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1`, aby Vercel użył przypiętego pnpm 12 |

   Wartości wpisz wyłącznie w panelu Vercel, nigdy w repozytorium, README ani czacie. Sekrety można wygenerować lokalnie przez `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))` uruchomione osobno dwa razy. Po zmianie zmiennych wykonaj nowe wdrożenie; stare wdrożenia ich nie pobiorą.
4. Zapisz nazwę projektu i domyślną domenę Vercel, potwierdź `NEXTAUTH_URL`, a następnie uruchom deployment z `main`. Nie włączaj płatnych usług ani nie kupuj domeny. **Nie wykonuj migracji automatycznie na każde żądanie lub start aplikacji.**

## 3. Kontrola po wdrożeniu

- W Vercel sprawdź status deploymentu i logi buildu oraz błędy Function Logs. W Neon sprawdź połączenia, a `pnpm prisma migrate status` na direct URL powinien wskazać trzy aktualne migracje.
- Potwierdź HTTPS, sesję i ciasteczka po zalogowaniu, odświeżenie strony, połączenie Prisma i wszystkie ścieżki z listy odbiorczej Etapu 4 w `TASKFLOW_V1_1_ROADMAP.md`.
- Użyj wyłącznie własnych kont testowych; nie uruchamiaj produkcyjnego seeda ani zestawu Playwright E2E na Neon. Usuń dane testowe przez kontrolowane operacje aplikacji. Jeśli interfejs nie pozwala usunąć konta lub przestrzeni, przygotuj transakcję ograniczoną do konkretnych identyfikatorów, potwierdź docelowy projekt/branch/bazę i wykonaj odczyt przed oraz po operacji.
- Po rzeczywistym smoke teście wpisz publiczny URL i aktualne zrzuty do README. Zakończenie etapu wymaga również zielonego CI dla końcowego commita.

Źródła: [Vercel — import repozytorium](https://vercel.com/docs/git), [Vercel — wersje Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Vercel — Corepack](https://vercel.com/docs/package-managers), [Prisma 7 — PostgreSQL i adresy pooled/direct](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [Prisma — migrate deploy](https://docs.prisma.io/docs/cli/v7/migrate).
