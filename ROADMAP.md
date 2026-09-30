# TaskFlow — roadmap realizacji

## TaskFlow v1.2.0 — motywy

| Jednostka | Stan | Kryterium odbioru |
| --- | --- | --- |
| Infrastruktura i tokeny | [x] | `light`, `dark`, `system`; skrypt przed hydration, `color-scheme`, semantyczne palety |
| Przełącznik i strony publiczne | [x] | Wybór przed logowaniem, po logowaniu, klawiaturą i na mobile; zapis lokalny |
| Wszystkie widoki aplikacji | [x] | Dashboard, zadania, Kanban, powiadomienia, pozostałe trasy i stany błędów w obu motywach |
| Testy i visual QA | [x] | Lint, typecheck, 31 testów, build i pełny Playwright (76 zaliczonych, 10 pominiętych) na izolowanej bazie; 18 rzeczywistych zrzutów Light/Dark |
| Dokumentacja i wersja | [x] | README, opis systemu motywów, portfolio i `package.json` 1.2.0 |
| CI i produkcja | [ ] | Zielone joby dla końcowego SHA, Vercel Ready dla tego SHA, lekki smoke test i logi |
| Tag i GitHub Release `v1.2.0` | [ ] | Oddzielna zgoda właściciela po ukończeniu powyższych kontroli |

Istniejący tag i GitHub Release `v1.1.0` pozostają bez zmian.

## Historia MVP i v1.1

Etap jest oznaczany jako zakończony dopiero po spełnieniu kryteriów i uruchomieniu wskazanych kontroli.

| Etap | Stan | Kryterium odbioru | Testy | Commit |
| --- | --- | --- | --- | --- |
| 0. Preflight | [x] | Zweryfikowane środowisko, konto i plan | preflight zakończony | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 1. Fundament i GitHub | [x] | Szkielet buduje się, repo publiczne | lint, typecheck, build — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 2. Baza i auth | [x] | Rejestracja, logowanie, izolacja tenantów | unit + E2E — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 3. Layout i projekty | [x] | Projekty i responsywny shell | E2E desktop/mobile — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 4. Zadania i Kanban | [x] | Trwały CRUD, DnD, lista | unit + E2E persistence — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 5. Współpraca | [x] | Role, zaproszenia, komentarze i linki | invite lifecycle E2E — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 6. Widoki zbiorcze | [x] | Dashboard, moje zadania, kalendarz, search | build + E2E smoke — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 7. UI i dostępność | [x] | Zgodność z referencją i mobile | Playwright desktop/mobile — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 8. Seed i bezpieczeństwo | [x] | Dane demo i testy negatywne | seed + IDOR E2E — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 9. Testy i CI | [x] | Pełny lokalny zestaw i workflow | 15 unit, 12 E2E, build — OK | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 10. Dokumentacja | [x] | README, screenshoty, czysty setup | README i screenshot zweryfikowane | [8468813](https://github.com/K-Kabak/taskflow/commit/8468813) |
| 11. Raport końcowy | [x] | Zweryfikowany remote i wyniki | status końcowy sprawdzony | finalizacja |

## Zasady

- Nie oznaczaj etapu jako zakończony bez uruchomienia jego kontroli.
- Każdy odczyt i zapis danych przestrzeni wymaga autoryzacji po stronie serwera.
- Nie dodawaj funkcji spoza MVP ani atrap interfejsu.
- Po etapie wykonaj logiczny commit i push; blokada GitHub nie zatrzymuje pracy lokalnej.

## TaskFlow v1.1 — stan etapów

| Etap | Stan | Weryfikacja | Punkt wznowienia |
| --- | --- | --- | --- |
| 1. Code review, błędy i bezpieczeństwo | [x] | 17/17 testów, 40 E2E zaliczonych i 4 planowo pominięte, `lint`, `typecheck`, `build` OK; szczegóły w `PROGRESS.md` | Zamknięty commitem `8b2105d` |
| 2. UI/UX | [x] | 17/17 testów, 43 E2E zaliczone i 5 planowo pominiętych, `lint`, `typecheck`, `build` OK; 5 rzeczywistych zrzutów | Zamknięty commitem `bf21141` |
| 3. Funkcje v1.1 | [x] | 25/25 testów, 57 E2E zaliczonych i 7 planowo pominiętych, `lint`, `typecheck`, `build` OK; dwie addytywne migracje i 5 aktualnych zrzutów | Zamknięty commitem `fd29973` |
| 4. Deployment i portfolio | [x] | [Publiczne HTTPS](https://taskflow-ochre-two.vercel.app/), trzy migracje Neon, smoke test, logi, cleanup danych testowych; lokalnie lint/typecheck/build, 29 testów i 57 E2E OK (7 pominiętych); [CI `807a75a`](https://github.com/K-Kabak/taskflow/actions/runs/36610674550) zielone | Zamknięty commitem `807a75a`; [release `v1.1.0`](https://github.com/K-Kabak/taskflow/releases/tag/v1.1.0) opublikowany |

Szczegółowy przegląd Etapu 1: `docs/quality/REVIEW_V1_1.md`. Przegląd UI po Etapie 2: `docs/quality/UI_REVIEW_V1_1.md` i `docs/screenshots/v1.1/`. Definicje metryk i zrzuty Etapu 3: `docs/quality/STAGE3_METRICS.md` i `docs/screenshots/v1.1-stage3/`. Pakiet referencji i zakres etapów opisuje `TASKFLOW_V1_1_ROADMAP.md`.

**Stan po wydaniu:** TaskFlow v1.1 jest zakończone i wdrożone. Tag `v1.1.0` wskazuje na `807a75a`; późniejszy hotfix auth `25a33e7` jest na `main`, przeszedł [CI](https://github.com/K-Kabak/taskflow/actions/runs/36617222949) i działa na produkcji. Hotfix dodaje spinner, teksty „Logowanie…” / „Tworzenie konta…”, blokadę kontrolek i dostępny komunikat oczekiwania. Tag celowo pozostaje bez zmian. Aktualny `main` jest punktem wyjścia do planowanego v1.2.0; prac nad nim nie rozpoczęto. Dark Mode nie należał do v1.1 i nie został zaimplementowany.

## Ostatnia pełna weryfikacja MVP przed Etapem 1 v1.1

- `pnpm lint` — OK
- `pnpm typecheck` — OK
- `pnpm test` — 4 pliki, 15 testów zaliczonych
- `pnpm build` — OK
- `pnpm exec playwright test` — 12 testów zaliczonych, 4 celowo pominięte warianty desktop-only w projekcie mobile
- `pnpm prisma migrate deploy` i `pnpm prisma db seed` — OK
