# TaskFlow v1.1 — przegląd jakości Etapu 1

## Zasada oceny

Poniżej rejestrujemy osobno usterki potwierdzone kodem lub reprodukcją oraz ryzyka wymagające sprawdzenia. Każda zamknięta usterka musi wskazywać test regresyjny i commit. Wyniki testów przeglądarkowych dopiszemy po uruchomieniu E2E na bazie testowej.

## Potwierdzone w przeglądzie kodu

| Waga | Problem i reprodukcja | Oczekiwane / rzeczywiste zachowanie | Lokalizacja | Test i wynik |
| --- | --- | --- | --- | --- |
| Średnia | Wyślij nazwę projektu lub tytuł zadania z samych spacji. | Użytkownik ma otrzymać błąd pola; akcja wcześniej wykonywała ciche `return`. | `src/app/actions/domain.ts` oraz formularze | `e2e/forms.spec.ts`: 2 testy zaliczone; poprawka: commit formularzy. |
| Średnia | Zmień tytuł, termin i priorytet w panelu zadania bez zmiany statusu, potem wróć na tablicę. | Karta powinna od razu pokazać nowe dane; pozostawała ze starym tytułem, bo lokalny stan był inicjowany raz. | `src/components/tasks/kanban-board.tsx`, widok projektu | `e2e/kanban-state.spec.ts`: test najpierw nie przeszedł, po poprawce przeszedł. |

## Ryzyka wymagające reprodukcji

| Ryzyko | Miejsce i plan sprawdzenia |
| --- | --- |
| Równoczesne ruchy kart mogą zignorować zmianę innego klienta. | `moveTaskAction`: dwie sesje, ruchy w tej samej kolumnie, kontrola trwałego porządku. |
| Nagłówki `x-forwarded-for` i `x-real-ip` mogą mieć niepewne pochodzenie. | `consumeRateLimit`: sprawdzić model zaufania hostingu, testować współbieżne żądania i limit. |
| Typ `any` ukrywa błędy kontraktu danych panelu zadania. | Widok projektu i panel: zastąpić typem payloadu Prisma / jawnego DTO. |

## Kontrole końcowe

Do uzupełnienia po zamknięciu Etapu 1: scenariusze ręczne, testy automatyczne, logi przeglądarki/serwera, otwarte ryzyka i linki do commitów.
