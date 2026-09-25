# TaskFlow — roadmap realizacji

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
| 2. UI/UX | [x] | 17/17 testów, 43 E2E zaliczone i 5 planowo pominiętych, `lint`, `typecheck`, `build` OK; 5 rzeczywistych zrzutów | STOP — wymagana osobna zgoda na Etap 3 |
| 3. Funkcje v1.1 | [ ] | Jeszcze nie rozpoczęty | Po odbiorze Etapu 2 |
| 4. Deployment i portfolio | [ ] | Jeszcze nie rozpoczęty | Po odbiorze Etapu 3 |

Szczegółowy przegląd Etapu 1: `docs/quality/REVIEW_V1_1.md`. Przegląd UI po Etapie 2: `docs/quality/UI_REVIEW_V1_1.md` i `docs/screenshots/v1.1/`. Pakiet referencji i zakres kolejnych etapów opisuje `TASKFLOW_V1_1_ROADMAP.md`.

## Ostatnia pełna weryfikacja MVP przed Etapem 1 v1.1

- `pnpm lint` — OK
- `pnpm typecheck` — OK
- `pnpm test` — 4 pliki, 15 testów zaliczonych
- `pnpm build` — OK
- `pnpm exec playwright test` — 12 testów zaliczonych, 4 celowo pominięte warianty desktop-only w projekcie mobile
- `pnpm prisma migrate deploy` i `pnpm prisma db seed` — OK
