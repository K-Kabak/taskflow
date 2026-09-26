# Definicje statystyk TaskFlow v1.1

- **Zakres dashboardu:** wyłącznie zadania w niezarchiwizowanych projektach bieżącej przestrzeni roboczej. Liczba projektów obejmuje te same aktywne projekty. „Moje otwarte” obejmuje nieukończone zadania przypisane zalogowanej osobie.
- **Zakres projektu:** wszystkie zadania otwartego projektu. Gdy użytkownik ogląda projekt archiwalny, jego historyczne zadania nadal wchodzą do statystyk tego projektu; nie wchodzą do dashboardu.
- **Statusy:** liczba zadań w `TODO`, `IN_PROGRESS` i `DONE`. Mianownikiem procentu ukończenia jest suma tych trzech liczb. Bez zadań wynik to 0%, a interfejs pokazuje stan pusty.
- **Po terminie:** zadania w `TODO` lub `IN_PROGRESS` z datą terminu wcześniejszą niż bieżąca data UTC. Zadania ukończone nie są przeterminowane; zadanie z terminem dzisiaj także nie.
- **Ostatnia aktywność:** czas najnowszego zapisanego zdarzenia projektu albo dowolnego aktywnego projektu przestrzeni. Wyświetlany w strefie `Europe/Warsaw`. Jeśli zdarzeń brak, interfejs podaje „Brak aktywności”.
- **Aktualizacja:** metryki są odczytywane z bazy przy odświeżeniu strony oraz po standardowej rewalidacji operacji zapisu. Nie używają sztucznych danych ani aktualizacji realtime.
