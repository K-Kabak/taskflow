# TaskFlow v1.1 — przegląd jakości Etapu 1

## Zasada oceny

Poniżej rejestrujemy osobno usterki potwierdzone kodem lub reprodukcją oraz ryzyka wymagające sprawdzenia. Każda zamknięta usterka musi wskazywać test regresyjny i commit. Wyniki testów przeglądarkowych dopiszemy po uruchomieniu E2E na bazie testowej.

## Potwierdzone w przeglądzie kodu

| Waga | Problem i reprodukcja | Oczekiwane / rzeczywiste zachowanie | Lokalizacja | Test i wynik |
| --- | --- | --- | --- | --- |
| Średnia | Wyślij dane niezgodne ze schematem w formularzu projektu lub zadania, omijając walidację HTML. | Użytkownik ma otrzymać błąd pola; akcja obecnie wykonuje ciche `return`. | `src/app/actions/domain.ts` | Do dodania. |
| Średnia | Zmień tytuł, termin, etykiety lub przypisanych w panelu zadania bez zmiany statusu i wróć na tablicę. | Karta ma od razu pokazać zapisane dane; obecny stan `useState(initialTasks)` i klucz ID/status mogą zachować stare dane. | `src/components/tasks/kanban-board.tsx`, widok projektu | Do potwierdzenia E2E i naprawy. |

## Ryzyka wymagające reprodukcji

| Ryzyko | Miejsce i plan sprawdzenia |
| --- | --- |
| Równoczesne ruchy kart mogą zignorować zmianę innego klienta. | `moveTaskAction`: dwie sesje, ruchy w tej samej kolumnie, kontrola trwałego porządku. |
| Nagłówki `x-forwarded-for` i `x-real-ip` mogą mieć niepewne pochodzenie. | `consumeRateLimit`: sprawdzić model zaufania hostingu, testować współbieżne żądania i limit. |
| Typ `any` ukrywa błędy kontraktu danych panelu zadania. | Widok projektu i panel: zastąpić typem payloadu Prisma / jawnego DTO. |

## Kontrole końcowe

Do uzupełnienia po zamknięciu Etapu 1: scenariusze ręczne, testy automatyczne, logi przeglądarki/serwera, otwarte ryzyka i linki do commitów.
