# TaskFlow v1.1 — przegląd jakości Etapu 1

## Zasada oceny

Poniżej rejestrujemy osobno usterki potwierdzone kodem lub reprodukcją oraz ryzyka bez potwierdzonej utraty danych. Poprawki i testy regresyjne są powiązane z commitami w `PROGRESS.md`.

## Potwierdzone w przeglądzie kodu

| Waga | Problem i reprodukcja | Oczekiwane / rzeczywiste zachowanie | Lokalizacja | Test i wynik |
| --- | --- | --- | --- | --- |
| Średnia | Wyślij nazwę projektu lub tytuł zadania z samych spacji. | Użytkownik ma otrzymać błąd pola; akcja wcześniej wykonywała ciche `return`. | `src/app/actions/domain.ts` oraz formularze | `e2e/forms.spec.ts`: 2 testy zaliczone; `e644923`. |
| Średnia | Zmień tytuł, termin i priorytet w panelu zadania bez zmiany statusu, potem wróć na tablicę. | Karta powinna od razu pokazać nowe dane; pozostawała ze starym tytułem, bo lokalny stan był inicjowany raz. | `src/components/tasks/kanban-board.tsx`, widok projektu | `e2e/kanban-state.spec.ts`: test najpierw nie przeszedł, po poprawce przeszedł; `2e603a9`. |
| Średnia | Przestaw kartę w obrębie kolumny lub spróbuj zapisać układ po zmianie w drugiej sesji. | Po odświeżeniu kolejność ma odpowiadać widokowi, a nieaktualny układ nie może nadpisać nowszego; wcześniej klient i serwer różnie liczyły indeks oraz nie porównywały stanu wejściowego. | `moveTaskAction`, Kanban | `e2e/kanban-order.spec.ts`: kolejność trwała i konflikt odrzucony; `06eb9da`. |
| Wysoka | Wyślij równolegle 25 prób do tego samego limitu albo zmieniaj niezaufany `x-forwarded-for` poza zaufanym hostingiem. | Licznik ma odnotować wszystkie próby, a nagłówek klienta nie może resetować limitu; poprzedni `upsert` mógł nadpisać licznik, a nagłówek wpływał na klucz. | `src/lib/rate-limit.ts` | `tests/rate-limit.test.ts`: 25 naliczonych, 10 dopuszczonych, spoofing bez obejścia; `a091ae0`. |
| Średnia | Dodaj ten sam identyfikator osoby dwa razy do formularza zadania. | Relacja powinna powstać raz; wcześniej weryfikacja unikalnych ID przechodziła, ale zapis próbował utworzyć duplikat klucza głównego. | `updateTaskAction` | `e2e/security.spec.ts`: zapis i odmowa obcej osoby/etykiety przechodzą; `4e66373`. |
| Niska | Otwórz zadanie, zarchiwizuj projekt w drugiej sesji i spróbuj zapisać edycję. | Zmiana musi być odmówiona z czytelnym komunikatem; wcześniej serwer rzucał oczekiwany błąd, a formularz pokazywał ogólny komunikat. | Akcje zapisu zadania i `requireTaskAccess` | `e2e/security.spec.ts`: zapis zablokowany, tytuł bez zmian; `4e66373`. |
| Średnia | Otwórz edycję projektu, zarchiwizuj projekt w drugiej sesji i spróbuj zapisać nazwę. | Zapis powinien być odmówiony; akcja wcześniej sprawdzała tylko dostęp, więc zmieniała zarchiwizowany projekt. | `updateProjectAction` | `e2e/security.spec.ts`: zapis zablokowany, nazwa bez zmian; `b0687e7`. |
| Średnia | Otwórz kalendarz z `?month=2026-99`. | Strona powinna pokazać bieżący miesiąc; wcześniej przekazywała `Invalid Date` do Prisma i kończyła się błędem. | Widok kalendarza | `e2e/calendar.spec.ts`: test najpierw nie przeszedł, po poprawce 2/2 desktop/mobile OK; `01f2512`. |

## Ryzyka i granice weryfikacji

| Ryzyko | Miejsce i plan sprawdzenia |
| --- | --- |
| Równoczesne utworzenie zadań może nadać im jednakową pozycję. | `createTaskAction` wyznacza następną pozycję wewnątrz transakcji, ale bez serializacji. Nie odtworzono utraty danych; sortowanie ma dodatkowy klucz `id`. Przed większym obciążeniem dodać test współbieżnego tworzenia i, jeśli potwierdzi konflikt, serializację. |
| Konfiguracja zaufanego proxy może różnić się w docelowym hostingu. | `consumeRateLimit` ignoruje niezaufane IP poza Vercel; w Etapie 4 sprawdzić rzeczywiste nagłówki i źródło ruchu. |
| Dev server drukuje `destination stream closed early` przy części przerwanych nawigacji Playwright. | Pełne E2E jest zielone, test kalendarza obserwuje `pageerror`, a build produkcyjny przechodzi. Nie zidentyfikowano awarii scenariusza; przed publicznym demo ponownie obejrzeć logi środowiska docelowego. |

## Izolacja przestrzeni i role

`e2e/security.spec.ts` sprawdza odmowę przypisania użytkownika i etykiety z innej przestrzeni, brak zarządzania projektami/rolami dla MEMBER, odmowę dostępu do obcego wyszukiwania, wygasłe zaproszenie i archiwum. Istniejące E2E sprawdzają obcy projekt oraz ponowne użycie zaproszenia. Potwierdzono brak zapisu obcych relacji w bazie.

## Kolejność kart

Wcześniej UI liczył pozycję inaczej niż serwer przy ruchu w jednej kolumnie i nie przekazywał wersji układu. Teraz klient i serwer stosują pozycję po wyjęciu przesuwanej karty, a serwer porównuje pełne ID obu kolumn w transakcji. Nieaktualny układ jest odrzucany z odświeżeniem widoku. `e2e/kanban-order.spec.ts` sprawdza trwałość kolejności po przeładowaniu i odmowę nadpisania zmiany z drugiej sesji.

## Rate limit

Potwierdzono wyścig podczas tworzenia licznika przy równoczesnych żądaniach: poprzedni odczyt i `upsert` mogły nadpisać licznik wartością 1. Zastąpiono je atomowym `INSERT ... ON CONFLICT DO UPDATE`. Test integracyjny wysyła 25 równoczesnych prób, sprawdza dokładnie 10 dopuszczonych przy limicie 10, reset okna oraz odporność na zmianę niezweryfikowanego `x-forwarded-for`. Po zmianie przeszły również E2E logowania. Dla hostingu Vercel podstawą zaufania do nagłówka jest [dokumentacja Vercel](https://vercel.com/docs/headers/request-headers); konfigurację produkcyjną ponownie zweryfikować w Etapie 4.

## Kontrole końcowe

Po pierwszym pełnym przebiegu E2E ujawniono dwa problemy zestawu: scenariusze zużywały wspólny limit logowania, a test kolejności kart polegał na stanie zmienionym wcześniej. Izolacja liczników przed każdym scenariuszem i ustawienie wejściowej kolejności w testach Kanbana pozwoliły zaliczyć osobno cały projekt Chromium (20 OK, 1 pominięty) i mobile (18 OK, 3 pominięte). Wspólny przebieg ujawnił dodatkowo zależność kilku asercji od tytułu zadania zmienionego przez wcześniejszy projekt Playwright; asercje odczytują poprzednią wartość albo identyfikują kartę po stabilnym ID. Pięć ponowionych testów mobile przeszło na zmienionej bazie. Testowa baza jest sprawdzana po nazwie przed operacjami porządkowymi. Istniejący historyczny screenshot pozostaje punktem odniesienia; aktualny rzeczywisty zrzut jest w `docs/screenshots/stage-1/kanban-desktop.png`.

Końcowe kontrole lokalne: `pnpm lint` i `pnpm typecheck` OK, `pnpm test` 17/17, `pnpm build` OK, pełny `pnpm exec playwright test --reporter=dot` 40 zaliczonych i 4 planowo pominięte. Po uzupełnieniu scenariusza CRUD o usunięcie zadania 2/2 testy E2E desktop/mobile przeszły. Rejestracja, logowanie i wylogowanie, tworzenie projektu, tworzenie/edycja/usuwanie zadania, Kanban, lista, kalendarz, wyszukiwanie, role, zaproszenia i archiwum są objęte testami przeglądarkowymi; negatywne scenariusze izolacji przestrzeni mają osobne asercje. `e2e/calendar.spec.ts` potwierdza brak błędu `pageerror` w sprawdzonym przepływie. Sekrety pozostają w ignorowanym `.env.local`; przegląd `console.error` w akcjach nie wykazał logowania tokenu zaproszenia ani sekretów. Linki do commitów i wynik końcowego CI są w `PROGRESS.md` oraz raporcie etapu.
