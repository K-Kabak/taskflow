# TaskFlow — roadmap realizacji

Etap jest oznaczany jako zakończony dopiero po spełnieniu kryteriów i uruchomieniu wskazanych kontroli.

| Etap | Stan | Kryterium odbioru | Testy | Commit |
| --- | --- | --- | --- | --- |
| 0. Preflight | [ ] | Zweryfikowane środowisko, konto i plan | preflight | — |
| 1. Fundament i GitHub | [ ] | Szkielet buduje się, repo publiczne | lint, typecheck, build | — |
| 2. Baza i auth | [ ] | Rejestracja, logowanie, izolacja tenantów | unit + integration | — |
| 3. Layout i projekty | [ ] | Projekty i responsywny shell | unit + E2E smoke | — |
| 4. Zadania i Kanban | [ ] | Trwały CRUD, DnD, lista | unit + integration + E2E | — |
| 5. Współpraca | [ ] | Role, zaproszenia, komentarze i linki | integration + E2E | — |
| 6. Widoki zbiorcze | [ ] | Dashboard, moje zadania, kalendarz, search | integration + E2E | — |
| 7. UI i dostępność | [ ] | Zgodność z referencją i mobile | Playwright | — |
| 8. Seed i bezpieczeństwo | [ ] | Dane demo i testy negatywne | integration | — |
| 9. Testy i CI | [ ] | Pełny lokalny zestaw i workflow | wszystkie | — |
| 10. Dokumentacja | [ ] | README, screenshoty, czysty setup | clean install | — |
| 11. Raport końcowy | [ ] | Zweryfikowany remote i wyniki | status końcowy | — |

## Zasady

- Nie oznaczaj etapu jako zakończony bez uruchomienia jego kontroli.
- Każdy odczyt i zapis danych przestrzeni wymaga autoryzacji po stronie serwera.
- Nie dodawaj funkcji spoza MVP ani atrap interfejsu.
- Po etapie wykonaj logiczny commit i push; blokada GitHub nie zatrzymuje pracy lokalnej.
