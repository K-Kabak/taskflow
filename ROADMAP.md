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

## Ostatnia pełna weryfikacja

- `pnpm lint` — OK
- `pnpm typecheck` — OK
- `pnpm test` — 4 pliki, 15 testów zaliczonych
- `pnpm build` — OK
- `pnpm exec playwright test` — 12 testów zaliczonych, 4 celowo pominięte warianty desktop-only w projekcie mobile
- `pnpm prisma migrate deploy` i `pnpm prisma db seed` — OK
