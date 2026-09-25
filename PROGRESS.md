# TaskFlow v1.1 — postęp

## Aktualny etap i zgoda użytkownika

- Autoryzowany etap: **2 — UI/UX i dostępność**.
- Status: **w trakcie**; punktem wyjścia jest ukończony Etap 1 (`8b2105d`).
- Zgoda: polecenie użytkownika z 2026-09-25 na realizację wyłącznie Etapu 2 oraz wdrożenie zatwierdzonego logo z `public/branding/taskflow-v1.1/`.
- Etapu 3 nie rozpoczynać bez nowej, wyraźnej zgody.

## Wykonane jednostki i commity

| Jednostka | Weryfikacja | Commit | Push |
| --- | --- | --- | --- |
| Dokumenty wejściowe i punkt wznowienia | Stan Git, remote, CI i migracji sprawdzone | `d8a63db` | tak |
| Formularze: jawne błędy walidacji, stan zapisu i ochrona przed powtórnym wysłaniem | `lint`, `typecheck`, 15 unit, `build`, 2 E2E formularzy OK | `e644923` | tak |
| Synchronizacja kart po edycji oraz cofnięcie optymistycznego ruchu po błędzie | `lint`, `typecheck`, 15 unit, `build`, 2 E2E (edycja i rollback) OK; istniejący DnD po seedzie OK | `2e603a9` | tak |
| Spójna kolejność i odmowa nadpisania układu z drugiej sesji | `lint`, `typecheck`, 15 unit, 2 E2E kolejności, `build` OK | `06eb9da` | tak |
| Atomowy rate limit i ignorowanie niezaufanego IP | `lint`, `typecheck`, 17 testów, `build`, 2 E2E auth OK | `a091ae0` | tak |
| Walidacja zapisów zadania, duplikatów i obcych relacji | `lint`, `typecheck`, 17 testów, `build`, 6 E2E security OK | `4e66373` | tak |
| Typy danych widoku projektu i panelu zadania | `lint`, `typecheck`, 17 testów jednostkowych/integracyjnych OK | `df388d8` | tak |
| Blokada zapisu projektu po archiwizacji | E2E otwartego formularza projektu OK; `lint`, `typecheck` OK | `b0687e7` | tak |
| Izolacja E2E, lokalne ładowanie testowej konfiguracji rate limitu i screenshot Etapu 1 | Chromium: 20 OK, 1 pominięty; mobile: 18 OK, 3 pominięte; rzeczywisty screenshot na świeżej bazie | `98e68f6` | tak |
| Walidacja parametru miesiąca kalendarza | Reprodukcja błędu Prisma; po poprawce 2 E2E desktop/mobile OK, lista i search OK | `01f2512` | tak |
| Niezależność testów od zmienionych tytułów zadań między projektami Playwright | 5/5 ponowionych testów mobile OK na zmienionej bazie; pełny E2E: 40 OK, 4 celowo pominięte | `a1c247f` | tak |
| Regresja usuwania zadania po utworzeniu i odświeżeniu | 2 E2E desktop/mobile OK | `67c8291` | tak |

## Stan środowiska i Git

- Branch / HEAD: `main` / `f9cbdda4bcd1ee8d95d4199c6ff9082eb3224a81` na starcie etapu.
- `origin/main`: ten sam SHA na starcie etapu.
- `git status -sb` na starcie: czysty kod MVP; nieśledzony pakiet v1.1.
- PostgreSQL: lokalny kontener działa; migracja początkowa aktualna.
- `pnpm lint`: OK po końcowych zmianach.
- `pnpm typecheck`: OK po końcowych zmianach.
- `pnpm test`: 17/17 w 5 plikach po końcowych zmianach.
- `pnpm build`: OK po zmianach w kodzie aplikacji.
- `pnpm exec playwright test --reporter=dot`: 40 zaliczonych, 4 planowo pominięte w projektach Chromium i mobile, w jednym przebiegu na osobnej bazie `taskflow_e2e`.
- Po rozszerzeniu testu CRUD: 2/2 E2E desktop/mobile, `lint` i `typecheck` OK; GitHub Actions dla `67c8291`: oba zadania `quality` i `e2e` zakończone sukcesem.
- Rzeczywisty zrzut: `docs/screenshots/stage-1/kanban-desktop.png`, wykonany na świeżej bazie `taskflow_e2e_stage1` po `migrate deploy` i seedzie. Próba `prisma migrate reset --force` została odrzucona przez zabezpieczenie Prisma; nie wykonano resetu żadnej bazy.
- Sekrety: `.env.local` pozostaje lokalny i ignorowany przez Git.

## Punkt wznowienia i pozostałe ryzyka

- Ostatnia ukończona mała jednostka: weryfikacja usunięcia zadania (`67c8291`).
- Następny krok po nowej zgodzie: rozpocząć wyłącznie Etap 2 według `TASKFLOW_V1_1_ROADMAP.md`, po odczycie tego pliku, Git i `docs/quality/REVIEW_V1_1.md`.
- Ryzyka: przed wdrożeniem potwierdzić konfigurację zaufanego proxy; równoczesne utworzenie zadań może pozostawić jednakowe pozycje sortowania (brak reprodukcji utraty danych); w lokalnym `next dev` przy przerwaniu nawigacji sporadycznie pojawia się `destination stream closed early` bez niepowodzenia E2E. Szczegóły w raporcie jakości.

## Raport na bramce etapu

- Kryteria odbioru: **spełnione lokalnie; CI końcowego commita dokumentacyjnego należy sprawdzić w Actions**.
- Ostatni commit kodu / push: `67c8291` opublikowany; ten dokument jest końcowym checkpointem Etapu 1.
- Drzewo robocze po końcowym commicie i pushu: potwierdzić poleceniem `git status -sb` przed przekazaniem raportu.
- CI: `67c8291` zielone (`quality`, `e2e`); wynik dla końcowego `HEAD` potwierdzić przed raportem użytkownikowi.
- Po zamknięciu Etapu 1: **STOP — czekam na wyraźne polecenie rozpoczęcia Etapu 2**.
