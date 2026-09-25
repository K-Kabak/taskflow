# TaskFlow v1.1 — przegląd jakości Etapu 1

## Zasada oceny

Poniżej rejestrujemy osobno usterki potwierdzone kodem lub reprodukcją oraz ryzyka wymagające sprawdzenia. Każda zamknięta usterka musi wskazywać test regresyjny i commit. Wyniki testów przeglądarkowych dopiszemy po uruchomieniu E2E na bazie testowej.

## Potwierdzone w przeglądzie kodu

| Waga | Problem i reprodukcja | Oczekiwane / rzeczywiste zachowanie | Lokalizacja | Test i wynik |
| --- | --- | --- | --- | --- |
| Średnia | Wyślij nazwę projektu lub tytuł zadania z samych spacji. | Użytkownik ma otrzymać błąd pola; akcja wcześniej wykonywała ciche `return`. | `src/app/actions/domain.ts` oraz formularze | `e2e/forms.spec.ts`: 2 testy zaliczone; poprawka: commit formularzy. |
| Średnia | Zmień tytuł, termin i priorytet w panelu zadania bez zmiany statusu, potem wróć na tablicę. | Karta powinna od razu pokazać nowe dane; pozostawała ze starym tytułem, bo lokalny stan był inicjowany raz. | `src/components/tasks/kanban-board.tsx`, widok projektu | `e2e/kanban-state.spec.ts`: test najpierw nie przeszedł, po poprawce przeszedł. |
| Średnia | Dodaj ten sam identyfikator osoby dwa razy do formularza zadania. | Relacja powinna powstać raz; wcześniej weryfikacja unikalnych ID przechodziła, ale zapis próbował utworzyć duplikat klucza głównego. | `updateTaskAction` | `e2e/security.spec.ts`: zapis i odmowa obcej osoby/etykiety przechodzą. |
| Niska | Otwórz zadanie, zarchiwizuj projekt w drugiej sesji i spróbuj zapisać edycję. | Zmiana musi być odmówiona z czytelnym komunikatem; wcześniej serwer rzucał oczekiwany błąd, a formularz pokazywał ogólny komunikat. | Akcje zapisu zadania i `requireTaskAccess` | `e2e/security.spec.ts`: zapis zablokowany, tytuł bez zmian. |
| Średnia | Otwórz edycję projektu, zarchiwizuj projekt w drugiej sesji i spróbuj zapisać nazwę. | Zapis powinien być odmówiony; akcja wcześniej sprawdzała tylko dostęp, więc zmieniała zarchiwizowany projekt. | `updateProjectAction` | `e2e/security.spec.ts`: zapis zablokowany, nazwa bez zmian. |

## Ryzyka wymagające reprodukcji

| Ryzyko | Miejsce i plan sprawdzenia |
| --- | --- |
| Seryjne konflikty bazy przy jednoczesnym ruchu dwóch kart. | `moveTaskAction`: obsłużone ograniczonym ponowieniem transakcji `Serializable`; końcowe E2E obejmie dwie sesje i przestarzały układ. |
| Poza Vercel nagłówek `x-forwarded-for` może być dostarczony przez klienta. | `consumeRateLimit`: identyfikator użytkownika ma niezależny limit poza Vercel; IP jest uwzględniany tylko w środowisku Vercel, które nadpisuje nagłówek. Podczas Etapu 4 potwierdzić rzeczywiste nagłówki wdrożenia. |
| Typ `any` ukrywa błędy kontraktu danych panelu zadania. | Widok projektu i panel: zastąpiono typami payloadu Prisma; `typecheck` przechodzi. |

## Izolacja przestrzeni i role

`e2e/security.spec.ts` sprawdza odmowę przypisania użytkownika i etykiety z innej przestrzeni, brak zarządzania projektami/rolami dla MEMBER, odmowę dostępu do obcego wyszukiwania, wygasłe zaproszenie i archiwum. Istniejące E2E sprawdzają obcy projekt oraz ponowne użycie zaproszenia. Potwierdzono brak zapisu obcych relacji w bazie.

## Kolejność kart

Wcześniej UI liczył pozycję inaczej niż serwer przy ruchu w jednej kolumnie i nie przekazywał wersji układu. Teraz klient i serwer stosują pozycję po wyjęciu przesuwanej karty, a serwer porównuje pełne ID obu kolumn w transakcji. Nieaktualny układ jest odrzucany z odświeżeniem widoku. `e2e/kanban-order.spec.ts` sprawdza trwałość kolejności po przeładowaniu i odmowę nadpisania zmiany z drugiej sesji.

## Rate limit

Potwierdzono wyścig podczas tworzenia licznika przy równoczesnych żądaniach: poprzedni odczyt i `upsert` mogły nadpisać licznik wartością 1. Zastąpiono je atomowym `INSERT ... ON CONFLICT DO UPDATE`. Test integracyjny wysyła 25 równoczesnych prób, sprawdza dokładnie 10 dopuszczonych przy limicie 10, reset okna oraz odporność na zmianę niezweryfikowanego `x-forwarded-for`. Po zmianie przeszły również E2E logowania. Dla hostingu Vercel podstawą zaufania do nagłówka jest [dokumentacja Vercel](https://vercel.com/docs/headers/request-headers); konfigurację produkcyjną ponownie zweryfikować w Etapie 4.

## Kontrole końcowe

Do uzupełnienia po zamknięciu Etapu 1: scenariusze ręczne, testy automatyczne, logi przeglądarki/serwera, otwarte ryzyka i linki do commitów.
