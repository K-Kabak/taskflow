# TaskFlow v1.1 — postęp

## Aktualny etap i zgoda użytkownika

- Autoryzowany etap: **3 — cztery funkcjonalności TaskFlow v1.1**.
- Status: **Etap 3 ukończony lokalnie i opublikowany**. Punktem wyjścia był ukończony Etap 2 (`bf21141`).
- Zgoda: polecenie użytkownika z 2026-09-26 na realizację wyłącznie Etapu 3.
- Etapu 4, hostingu i deploymentu nie rozpoczynać bez nowej, wyraźnej zgody.

## Etap 3 — bieżący postęp

| Jednostka | Weryfikacja | Commit | Push |
| --- | --- | --- | --- |
| Addytywny model i migracja checklisty | Na odizolowanej bazie `taskflow_e2e_stage2` 12 zadań przed i po migracji, `migrate status` OK, `typecheck` OK | `9d92279` | tak |
| CRUD checklisty, walidacja, odczyt tylko w swojej przestrzeni i blokada archiwum | 6 E2E desktop/mobile, `lint`, `typecheck`, 6 testów walidacji OK | `62dd7ac` | tak |
| Postęp checklisty na karcie Kanban | E2E trwałości i wskaźnika 1/1, `lint`, `typecheck` OK | `6648003` | tak |
| Reguły filtrowania Kanban i walidacja parametrów URL | 3 testy jednostkowe, `typecheck` OK | `709cf0b` | tak |
| Filtry tablicy, URL, puste wyniki i blokada DnD | E2E desktop/mobile 2/2, `lint`, `typecheck` OK | `9503983` | tak |
| Addytywny model powiadomień i migracja | `migrate deploy` i `migrate status` na odizolowanej bazie `taskflow_e2e_stage2`, `prisma generate`, `typecheck` OK | `6f8939f` | tak |
| Zdarzenia przypisania i komentarza, odbiorcy, deduplikacja | 2 testy jednostkowe, E2E przypisania, komentarza i ponownego zapisu, `lint`, `typecheck` OK | `bc4f4c8` | tak |
| Skrzynka powiadomień, licznik i odczyt tylko własnych rekordów | 2 E2E: licznik, oznaczenie przeczytania, izolacja odbiorcy i przestrzeni; `lint`, `typecheck` OK | `ebb246f` | tak |
| Statystyki projektu i dashboardu z realnych danych | 2 testy agregacji, E2E na desktopie i telefonie: izolacja przestrzeni, zero danych, 50% i zaległości; `lint`, `typecheck` OK | `747bce6` | tak |
| Pięć rzeczywistych zrzutów czterech funkcji | Playwright na odizolowanej bazie, wynik 1/1 | `698a748` | tak |
| Dostosowanie testów DnD do układu z metrykami | 10 E2E zaliczonych, 2 planowo pominięte w docelowych plikach | `16d2a38` | tak |

- `PLAN.md` nie ma lokalnie; zakres opiera się na `TASKFLOW_V1_1_ROADMAP.md`, specyfikacji, raportach jakości i aktualnym kodzie.
- Migracje checklisty i powiadomień są addytywne. Migracja powiadomień przeszła na istniejącej izolowanej bazie; trzy migracje przeszły też od zera na `taskflow_e2e_stage3final`, po czym seed i `migrate status` zakończyły się poprawnie. Nie wykonano resetu ani operacji destrukcyjnej na bazie użytkownika.
- Pełna bramka po kodzie Etapu 3: `pnpm lint` OK, `pnpm typecheck` OK, `pnpm test` **25/25 w 8 plikach**, `pnpm build` OK, Playwright na świeżej `taskflow_e2e_stage3final` **57 zaliczonych, 7 planowo pominiętych**. Pierwszy pełny Playwright ujawnił 7 niepowodzeń starszych testów DnD z powodu karty poza viewportem po dodaniu metryk; testy przewijają teraz uchwyt do widoku i pełny przebieg zakończył się sukcesem.
- Pięć nowych zrzutów: `docs/screenshots/v1.1-stage3/` (checklista, filtry Kanbanu, skrzynka powiadomień, metryki projektu i dashboardu). Definicje liczników: `docs/quality/STAGE3_METRICS.md`.
- Ryzyka: licznik powiadomień aktualizuje się przy odświeżeniu/nawigacji, bez realtime zgodnie z zakresem; gest DnD i wygląd natywnych kontrolek warto sprawdzić na fizycznym telefonie. Sporadyczne `destination stream closed early` w lokalnym `next dev` przy przerywanej nawigacji nie powodowało niepowodzenia końcowego E2E.
- **Punkt wznowienia:** po końcowym commicie dokumentacyjnym sprawdzić `git status -sb`, synchronizację z `origin/main` i GitHub Actions. **STOP przed Etapem 4; hosting i deployment wymagają nowej, wyraźnej zgody.**

## Etap 2 — wykonane jednostki i commity

| Jednostka | Commit | Push |
| --- | --- | --- |
| Zatwierdzone logo, warianty PNG/SVG, favicon, metadane oraz archiwizacja wcześniejszej propozycji | `7e124c7` | tak |
| Tokeny UI, typografia i stany kontrolek | `4ab0cbb` | tak |
| Sidebar, aktywna nawigacja i mobilne menu z obsługą fokusu | `eb0cb06` | tak |
| Karty Kanban, puste kolumny, informacja zwrotna i gest dotykowy | `3648efb` | tak |
| Zakładki projektu, responsywna lista i dostępny panel zadania z zachowaniem kontekstu | `1f259e8` | tak |
| Dashboard z rzeczywistymi licznikami i układem responsywnym | `a498666` | tak |
| Etykiety formularzy projektów | `ba932ae` | tak |
| Stany ładowania i ponowienia po błędzie | `addb348` | tak |
| Kontrast istniejących przycisków i nazwa przestrzeni w sidebarze | `45bcc54` | tak |
| Pięć rzeczywistych zrzutów, test pięciu szerokości i przegląd UI | `4922d08` | tak |

## Etap 2 — weryfikacja i punkt wznowienia

- `PLAN.md` nie był dostępny lokalnie; użyto `TASKFLOW_V1_1_ROADMAP.md`, `ROADMAP.md`, `PROGRESS.md`, `docs/quality/REVIEW_V1_1.md`, referencji i aktualnego kodu.
- `pnpm lint` — OK; `pnpm typecheck` — OK; `pnpm test` — **17/17**; `pnpm build` — OK.
- `pnpm exec playwright test --reporter=dot` na świeżej bazie `taskflow_e2e_stage2` — **43 zaliczone, 5 planowo pominiętych** (cztery istniejące warianty desktop-only oraz nowy zestaw zrzutów uruchamiany raz w Chromium).
- Kontrola układu: 360, 390, 768, 1280 i 1440 px. Zrzuty: `docs/screenshots/v1.1/kanban-desktop.png`, `dashboard-desktop.png`, `task-panel.png`, `kanban-mobile.png`, `empty-state.png`. Porównanie: `docs/quality/UI_REVIEW_V1_1.md`.
- CI dla ostatniego commita kodu i zrzutów `4922d08` — zielone. Po końcowym commicie dokumentacyjnym ponownie sprawdzić GitHub Actions.
- Drzewo Git po pełnym E2E: czyste przed aktualizacją niniejszych dokumentów. Każda jednostka została osobno opublikowana na istniejącym `origin/main`; historii nie przepisywano.
- Pozostałe ryzyko: odczucie gestu przeciągania wymaga sprawdzenia na fizycznym telefonie; natywne pola i czcionki mogą różnić się między systemami. Lokalny `next dev` nadal czasem zapisuje `destination stream closed early` po przerwaniu nawigacji, bez niepowodzenia E2E.
- Punkt wznowienia w nowej sesji: sprawdzić `git status -sb`, `git log -1`, CI końcowego commita i ten dokument. **STOP przed Etapem 3; wymagana osobna, wyraźna zgoda użytkownika.**

## Etap 1 — archiwum postępu

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
