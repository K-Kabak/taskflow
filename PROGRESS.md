# TaskFlow v1.1 — postęp

## Aktualny etap i zgoda użytkownika

- Autoryzowany etap: **1 — Code review, błędy i bezpieczeństwo**.
- Status: **w toku**.
- Zgoda: polecenie użytkownika z 2026-09-25: „Rozpocznij realizację wyłącznie Etapu 1”.
- Etapu 2 nie rozpoczynać bez nowej, wyraźnej zgody.

## Wykonane jednostki i commity

| Jednostka | Weryfikacja | Commit | Push |
| --- | --- | --- | --- |
| Dokumenty wejściowe i punkt wznowienia | Stan Git, remote, CI i migracji sprawdzone | `d8a63db` | tak |
| Formularze: jawne błędy walidacji, stan zapisu i ochrona przed powtórnym wysłaniem | `lint`, `typecheck`, 15 unit, `build`, 2 E2E formularzy OK | `e644923` | tak |
| Synchronizacja kart po edycji oraz cofnięcie optymistycznego ruchu po błędzie | `lint`, `typecheck`, 15 unit, `build`, 2 E2E (edycja i rollback) OK; istniejący DnD po seedzie OK | `2e603a9` | tak |
| Spójna kolejność i odmowa nadpisania układu z drugiej sesji | `lint`, `typecheck`, 15 unit, 2 E2E kolejności, `build` OK | `06eb9da` | tak |
| Atomowy rate limit i ignorowanie niezaufanego IP | `lint`, `typecheck`, 17 testów, `build`, 2 E2E auth OK | `a091ae0` | tak |
| Walidacja zapisów zadania, duplikatów i obcych relacji | `lint`, `typecheck`, 17 testów, `build`, 6 E2E security OK | commit w toku | nie |

## Stan środowiska i Git

- Branch / HEAD: `main` / `f9cbdda4bcd1ee8d95d4199c6ff9082eb3224a81` na starcie etapu.
- `origin/main`: ten sam SHA na starcie etapu.
- `git status -sb` na starcie: czysty kod MVP; nieśledzony pakiet v1.1.
- PostgreSQL: lokalny kontener działa; migracja początkowa aktualna.
- `pnpm lint`: OK podczas planowania, wymaga ponowienia po zmianach.
- `pnpm typecheck`: OK podczas planowania, wymaga ponowienia po zmianach.
- `pnpm test`: 15/15 podczas planowania, wymaga ponowienia po zmianach.
- `pnpm build`: OK podczas planowania, wymaga ponowienia po zmianach.
- E2E: baza `taskflow_e2e`, migracja i seed OK; baza wyjściowa: 11 zaliczonych, 3 planowo pominięte; formularze: 2 zaliczone; Kanban: 2 po poprawce; DnD: 1 zaliczony; kolejność i konflikt dwóch sesji: 2 zaliczone. Jeden wcześniejszy osobny bieg DnD był niestabilny.
- Sekrety: `.env.local` pozostaje lokalny i ignorowany przez Git.

## W toku, pozostałe zadania i blokady

- Ostatnia ukończona mała jednostka: rate limit (`a091ae0`).
- Bieżąca jednostka: walidacja zapisów zadania i negatywne E2E.
- Następny krok w tym samym etapie: usunięcie `any`, przegląd pozostałych przepływów, pełna weryfikacja.
- Znane ryzyka do zbadania: ciche odrzucenie danych przez akcje serwerowe, nieaktualny stan kart po edycji, współbieżne przesuwanie, nagłówki proxy w rate limicie.
- Screenshoty aplikacji po zmianach: jeszcze nie wykonano.

## Raport na bramce etapu

- Kryteria odbioru: **w toku**.
- Ostatni commit / wynik pushu: `a091ae0` opublikowany; następna poprawka w toku.
- Czy drzewo robocze jest czyste? Nie — w toku walidacja zapisów zadania.
- Czy CI jest zielone? Ostatni bieg dla bazowego `f9cbdda`: tak; nowe commity wymagają własnej weryfikacji.
- Po zamknięciu Etapu 1: **STOP — czekam na wyraźne polecenie rozpoczęcia Etapu 2**.
