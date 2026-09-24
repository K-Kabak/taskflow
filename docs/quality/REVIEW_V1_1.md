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
| Seryjne konflikty bazy przy jednoczesnym ruchu dwóch kart. | `moveTaskAction`: obsłużone ograniczonym ponowieniem transakcji `Serializable`; końcowe E2E obejmie dwie sesje i przestarzały układ. |
| Nagłówki `x-forwarded-for` i `x-real-ip` mogą mieć niepewne pochodzenie. | `consumeRateLimit`: sprawdzić model zaufania hostingu, testować współbieżne żądania i limit. |
| Typ `any` ukrywa błędy kontraktu danych panelu zadania. | Widok projektu i panel: zastąpić typem payloadu Prisma / jawnego DTO. |

## Kolejność kart

Wcześniej UI liczył pozycję inaczej niż serwer przy ruchu w jednej kolumnie i nie przekazywał wersji układu. Teraz klient i serwer stosują pozycję po wyjęciu przesuwanej karty, a serwer porównuje pełne ID obu kolumn w transakcji. Nieaktualny układ jest odrzucany z odświeżeniem widoku. `e2e/kanban-order.spec.ts` sprawdza trwałość kolejności po przeładowaniu i odmowę nadpisania zmiany z drugiej sesji.

## Kontrole końcowe

Do uzupełnienia po zamknięciu Etapu 1: scenariusze ręczne, testy automatyczne, logi przeglądarki/serwera, otwarte ryzyka i linki do commitów.
