# TaskFlow v1.1 — wdrożenie Vercel + Neon

Stan: instrukcja przygotowana; rzeczywiste wdrożenie i migracje Neon wymagają kont właściciela. Nie oznacza potwierdzonej publikacji.

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
- Użyj wyłącznie własnych kont testowych; nie uruchamiaj produkcyjnego seeda ani zestawu Playwright E2E na Neon. Usuń własne dane testowe wyłącznie przez kontrolowane operacje aplikacji.
- Dopiero po rzeczywistym smoke teście wpisz publiczny URL i aktualne zrzuty do README oraz zamknij Etap 4.

Źródła: [Vercel — import repozytorium](https://vercel.com/docs/git), [Vercel — wersje Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Vercel — Corepack](https://vercel.com/docs/package-managers), [Prisma 7 — PostgreSQL i adresy pooled/direct](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql), [Prisma — migrate deploy](https://docs.prisma.io/docs/cli/v7/migrate).
