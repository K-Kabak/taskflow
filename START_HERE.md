# Pakiet TaskFlow v1.1 — od czego zacząć (rewizja 2)

1. Rozpakuj archiwum do **głównego katalogu istniejącego repozytorium** `K-Kabak/taskflow`. Nie twórz nowej aplikacji ani repozytorium.
2. Otwórz `TASKFLOW_V1_1_ROADMAP.md`, `PROGRESS_TEMPLATE.md` i obrazy w `docs/taskflow-v11/`. Obecny rzeczywisty screenshot jest w istniejącym repo pod `docs/screenshots/taskflow-board.png`.
3. **Prompt startowy dla agenta VS Code (jeden etap na jedną zgodę):**

> Zapoznaj się dokładnie z `TASKFLOW_V1_1_ROADMAP.md`, istniejącym `TASKFLOW_AGENT_SPEC.md` i materiałami w `docs/taskflow-v11/`. Zacznij wyłącznie od ETAPU 1. W obrębie etapu pracuj autonomicznie i wykonuj osobny logiczny commit oraz `git push` po każdej skończonej, zweryfikowanej jednostce pracy — nie łącz całego etapu w jeden commit. Na bieżąco prowadź `PROGRESS.md` i roadmapę. Po ukończeniu etapu wykonaj testy, ostatni commit/push, przedstaw raport i **ZATRZYMAJ SIĘ**. Nie rozpoczynaj etapu 2, dopóki wyraźnie Cię o to nie poproszę. Jeśli usage będzie się kończył, zapisz bezpieczny checkpoint i punkt wznowienia. Nie przepisuj historii Git, nie publikuj sekretów ani nie wdrażaj płatnych usług bez mojej zgody.

4. **Prompt po odebraniu raportu etapu 1, 2 lub 3:**

> Zapoznaj się z `PROGRESS.md`, roadmapą i stanem Git. Zweryfikuj ukończenie poprzedniego etapu i rozpocznij **wyłącznie ETAP [WPISZ NUMER]** zgodnie z zasadami małych, logicznych commitów oraz obowiązkowej pauzy po jego zamknięciu. Nie zaczynaj następnego etapu bez mojej kolejnej zgody.

5. Obrazy oznaczone `concept-*` to **koncepcje UI**, a nie rzeczywiste screeny gotowej aplikacji. Agent musi wykonać własne screeny po wdrożeniu zmian.
6. Opcjonalne nowe logo i favicon są w `docs/taskflow-v11/branding/`; podmiana wymaga zgody.
7. **Nie usuwaj dotychczasowej historii trzech commitów.** Nie używaj `push --force`, `reset --hard` ani `rebase -i`.
