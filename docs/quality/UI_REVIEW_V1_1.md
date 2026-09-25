# TaskFlow v1.1 — przegląd UI/UX po Etapie 2

## Materiał i sposób weryfikacji

Porównano dotychczasowy zrzut `docs/screenshots/taskflow-board.png` oraz referencje w `docs/taskflow-v11/` z działającą aplikacją na osobnej bazie `taskflow_e2e_ui` po migracji i seedzie. Zrzuty w `docs/screenshots/v1.1/` wykonał Playwright z rzeczywistych ekranów aplikacji i danych testowych. Test `e2e/visual-v1_1.spec.ts` sprawdził szerokości 360, 390, 768, 1280 i 1440 px. Poziomy scroll jest ograniczony do samej tablicy Kanban.

| Obszar | Zmiana względem wcześniejszego widoku | Dowód |
| --- | --- | --- |
| Branding | Zatwierdzony znak z `public/branding/taskflow-v1.1/` zastąpił literę „T” w aplikacji; użyto PNG poziomego oraz SVG ikony w metadanych. Historyczna propozycja w `docs/taskflow-v11/branding/` pozostała w repozytorium. | Wszystkie zrzuty; `src/app/layout.tsx` |
| Sidebar i nawigacja | Wyraźny aktywny element, spójny rytm i stan mobilnego menu z Escape, pułapką fokusu oraz powrotem do przycisku menu. | `kanban-desktop.png`, `kanban-mobile.png`; E2E menu mobilnego |
| Tablica i zakładki | Stabilne zakładki z `aria-current`; czytelne tytuły, terminy, priorytety, etykiety i osoby; puste kolumny z prawdziwym formularzem dodawania. | `kanban-desktop.png`, `kanban-mobile.png`, `empty-state.png` |
| Panel zadania | Sekcje i etykiety pól, status jako alternatywa dla DnD, obsługa Escape, Tab, Shift+Tab i kliknięcia tła; zamknięcie przywraca kontekst listy i fokus. | `task-panel.png`; `e2e/ui-accessibility.spec.ts` |
| Dashboard | Proporcje kafli i sekcji na rzeczywistych zapytaniach do bazy; układ od dwóch do czterech kafli zależnie od szerokości. | `dashboard-desktop.png`; test szerokości |
| Informacja zwrotna | Stan zapisu i błędy formularzy z Etapu 1 uzupełniono o stany puste, ładowania, ponowienia błędu i potwierdzenie przeniesienia karty. | `empty-state.png`; `src/app/w/[workspaceId]/loading.tsx`, `error.tsx` |

## Odstępstwa od koncepcji

- Nie dodano filtrów Kanbanu, checklisty, centrum powiadomień, nowych wykresów ani feedu dashboardu: są przewidziane w Etapie 3. Działające filtry istniejącej listy zadań pozostały dostępne.
- Referencyjne liczniki i nazwiska nie są wpisane na stałe. Zrzuty pokazują wyłącznie stan testowej bazy i realne wyniki zapytań.
- Poziomy logotyp jest dostarczony tylko jako PNG; dla skalowanych ikon użyto dostarczonego SVG. Nie zmieniano proporcji ani kształtu znaku.

## Pozostałe ryzyka

- Drag and drop na ekranie dotykowym wymaga przytrzymania uchwytu przez 250 ms. Przewijanie poza uchwytem działa normalnie, a status można zawsze zmienić w panelu zadania. Ostateczne odczucie gestu należy sprawdzić na fizycznym telefonie.
- Zrzuty Playwright dokumentują układ; wygląd czcionek i natywnych pól może różnić się między systemami operacyjnymi.
