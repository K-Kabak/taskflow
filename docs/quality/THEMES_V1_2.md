# TaskFlow v1.2 — system motywów i visual QA

## Zachowanie

- Dostępne preferencje: `light`, `dark`, `system`. Brak wartości lub wartość nieprawidłowa oznacza Systemowy. Ręczny wybór Jasnego albo Ciemnego ma pierwszeństwo przed ustawieniem systemu.
- Preferencja jest zapisywana pod kluczem `taskflow-theme` w `localStorage` dla jednego origin. Działa przed logowaniem i po nim, przetrwa odświeżenie i synchronizuje otwarte karty przez zdarzenie `storage`. Nie jest powiązana z kontem ani synchronizowana między urządzeniami.
- `<html data-theme="system">` jest renderowany na serwerze. Krótki skrypt w `<head>` stosuje zapis przed pierwszym malowaniem. CSS obsługuje `prefers-color-scheme` dla Systemowego, także gdy ustawienie systemu zmieni się podczas otwartej strony. `color-scheme` obejmuje natywne pola formularza.
- Blokada `localStorage` nie powoduje awarii. Zmiana działa wtedy na bieżącej stronie; po ponownym otwarciu wraca Systemowy.

## Utrzymanie styli

Palety i stany są zdefiniowane semantycznie w `src/app/globals.css`. Nowe widoki powinny używać tokenów `--background`, `--surface`, `--elevated-surface`, `--muted-surface`, `--foreground`, `--muted`, `--subtle`, `--border`, `--border-strong`, tokenów akcentu i stanów. Obramowanie kontrolki wymaga `--border-strong`; tło dekoracyjne może użyć `--border`. Przycisk na pomarańczowym tle używa `--on-accent`.

Poziome logo wykorzystuje ten sam zatwierdzony plik PNG w obu motywach. W ciemnym wariancie druga warstwa rozjaśnia jedynie ciemne elementy, pozostawiając pomarańczowe paski oraz geometrię znaku. Kolory avatarów i etykiet są danymi; inicjały avatara dobierają jasny lub ciemny tekst do kontrastu tła.

## Weryfikacja

- `tests/theme.test.ts` sprawdza dozwolone wartości i fallback. `e2e/theme.spec.ts` sprawdza Light, Dark, System, zmianę systemu, zapis, reload, błędną wartość, karty, klawiaturę, mobile i reprezentatywne widoki.
- Brak błysku weryfikuje położenie skryptu w odpowiedzi HTML przed `<body>`, kolor i `data-theme` po bezpośrednim wejściu oraz ręczny przegląd ładowania. Test nie porównuje pojedynczych klatek, więc nie zależy od tempa przeglądarki.
- `e2e/visual-v1_2.spec.ts` zapisuje screenshoty po ustawieniu `CAPTURE_V1_2_SCREENSHOTS=1`, wyłącznie na bazie spełniającej zabezpieczenie E2E. W `docs/screenshots/v1.2/` znajdują się rzeczywiste obrazy Light/Dark dla landing, login, register, dashboard, Kanban, panelu zadania, powiadomień oraz mobilnego dashboardu i Kanbanu. Historycznych zrzutów v1.1 nie zmieniano.
- Visual QA objęło logo, tekst, focus, formularze, natywny `select` i pole daty, stany kart i przycisków, nakładkę zadania oraz brak poziomego overflow dokumentu na telefonie.

Dark Mode jest funkcją v1.2; nie należał do wydania v1.1.
