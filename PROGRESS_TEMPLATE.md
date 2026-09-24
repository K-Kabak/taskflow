# TaskFlow v1.1 — szablon PROGRESS.md

> Agent: skopiuj ten szablon do `PROGRESS.md` w głównym katalogu repozytorium i aktualizuj po każdej zweryfikowanej jednostce pracy. Nie deklaruj pomyślnego uruchomienia testu lub pushu bez weryfikacji.

## Aktualny etap i zgoda użytkownika
- Autoryzowany etap: [1 / 2 / 3 / 4]
- Status: [nie rozpoczęty / w toku / zakończony — STOP / blokada]
- Polecenie upoważniające do tego etapu: [cytuj krótko / odnotuj datę]
- Następnego etapu **nie rozpoczynać bez nowej zgody użytkownika**.

## Wykonane jednostki i commity
| Podzadanie / zmiana | Test/weryfikacja | Commit SHA / URL | Push potwierdzony? |
| --- | --- | --- | --- |
| ... | ... | ... | tak / nie |

## Stan środowiska i Git
- Branch / HEAD:
- `origin/main`:
- `git status -sb`:
- `pnpm lint`:
- `pnpm typecheck`:
- `pnpm test`:
- `pnpm build`:
- E2E / CI (link do biegu i wynik):
- Sekrety / materiały lokalne: nie publikować.

## W toku, pozostałe zadania i blokady
- Ostatnia ukończona mała jednostka:
- Bieżąca nieukończona jednostka i zmienione pliki:
- Następny dokładny krok **w tym samym etapie**:
- Znane usterki / blokady / zależności od użytkownika:
- Screenshoty rzeczywiście uruchomionej aplikacji (ścieżki):

## Raport na bramce etapu
- Kryteria odbioru: [spełnione / niespełnione; dowody]
- Ostatni commit / wynik pushu:
- Czy drzewo robocze jest czyste?
- Czy CI jest zielone? [sprawdzono URL / oczekuje / nie da się zweryfikować]
- Status: **STOP — czekam na wyraźne polecenie rozpoczęcia kolejnego etapu**.
