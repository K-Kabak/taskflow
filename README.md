# TaskFlow

TaskFlow to polskojęzyczna, pełnostackowa aplikacja SaaS do zarządzania projektami małych zespołów. Łączy lekką tablicę Kanban, widok listy, terminy, przypisania, komentarze, linki i historię zmian z bezpieczną izolacją przestrzeni roboczych.

![Rzeczywisty widok tablicy TaskFlow](./docs/screenshots/taskflow-board.png)

Interfejs został opracowany na podstawie dołączonej [referencji wizualnej](./taskflow-ui-reference.png), bez kopiowania jej fikcyjnej zawartości.

## Najważniejsze funkcje

- rejestracja, logowanie hasłem Argon2id i sesje Auth.js;
- przestrzenie robocze z rolami `OWNER`, `ADMIN`, `MEMBER`;
- projekty, archiwum oraz tablica Kanban z trwałą kolejnością;
- zadania z priorytetem, terminem, przypisaniami, etykietami i historią;
- komentarze oraz bezpieczne linki HTTP/HTTPS;
- jednorazowe, hashowane linki zaproszeń ważne siedem dni;
- dashboard, „Moje zadania”, miesięczny kalendarz i globalne wyszukiwanie;
- responsywny interfejs, mobilny drawer i klawiaturowa obsługa DnD;
- walidacja Zod, serwerowa autoryzacja każdej operacji i rate limiting w PostgreSQL.

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, PostgreSQL 17, Prisma 7, Auth.js/NextAuth 4, Zod, React Hook Form, dnd-kit, date-fns, Vitest, Testing Library i Playwright. Projekt jest pojedynczym monolitem full-stack.

## Uruchomienie lokalne

Wymagane są Node.js 24, pnpm 12 oraz Docker z Docker Compose.

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`. Lokalny PostgreSQL nasłuchuje na porcie `5434`, aby nie kolidować z typową instalacją PostgreSQL na porcie `5432`.

### Konto demonstracyjne

- e-mail: `anna@taskflow.demo`
- hasło: `TaskFlowDemo123!`
- przestrzeń: `Studio`

Seed jest przeznaczony wyłącznie do developmentu i odmawia działania przy `NODE_ENV=production`.

## Zmienne środowiskowe

| Zmienna | Znaczenie |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL używany przez Prisma i aplikację |
| `NEXTAUTH_SECRET` | losowy sekret podpisywania tokenów sesji |
| `NEXTAUTH_URL` | publiczny adres aplikacji, lokalnie `http://localhost:3000` |
| `RATE_LIMIT_SECRET` | osobny sekret HMAC dla nierozpoznawalnych kluczy limitów |

Plik `.env.local` jest ignorowany przez Git. `.env.example` zawiera wyłącznie wartości przykładowe.

## Polecenia jakości

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm exec playwright test
```

Testy integracyjne/E2E wymagają działającego PostgreSQL, aktualnej migracji i seeda. GitHub Actions uruchamia izolowane bazy PostgreSQL dla kontroli jakości i E2E.

## Architektura i bezpieczeństwo

- Server Components wykonują odczyty, a Server Actions mutacje. Jedynymi Route Handlers są Auth.js i ograniczone wyszukiwanie.
- Aktywna przestrzeń jest jawna w `/w/[workspaceId]`, lecz każdy odczyt i zapis ponownie sprawdza sesję, membership i rolę.
- Projekt, zadanie, przypisana osoba i etykieta muszą pochodzić z tej samej przestrzeni.
- Token zaproszenia powstaje kryptograficznie, a baza przechowuje wyłącznie jego SHA-256. Akceptacja odbywa się atomowo.
- Termin jest datą kalendarzową PostgreSQL `date`; UI nie przesuwa dnia przez konwersję stref czasowych.
- Backend nie pobiera treści zapisanych URL-i, a linki otwierają się z `noopener noreferrer`.
- Zarchiwizowany projekt jest tylko do odczytu.

## Role

| Operacja | OWNER | ADMIN | MEMBER |
| --- | :---: | :---: | :---: |
| Odczyt projektów i zadań | ✓ | ✓ | ✓ |
| Tworzenie i edycja zadań | ✓ | ✓ | ✓ |
| Zarządzanie projektami | ✓ | ✓ | — |
| Zaproszenia i usuwanie MEMBER | ✓ | ✓ | — |
| Zmiana ról ADMIN / nazwy przestrzeni | ✓ | — | — |

## Migracje i wdrożenie

W CI i środowisku docelowym użyj:

```bash
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy
pnpm build
pnpm start
```

Do wdrożenia wystarczy hosting obsługujący Next.js/Node 24 oraz zarządzany PostgreSQL. Należy ustawić wszystkie sekrety w panelu hostingu, wymusić HTTPS i nie uruchamiać demonstracyjnego seeda.

## Rozszerzenia v1.1 i ograniczenia

Etap 3 dodał checklisty w zadaniach, filtry tablicy Kanban zapisane w URL, powiadomienia wewnątrz aplikacji o przypisaniach i komentarzach oraz statystyki projektów i dashboardu liczone z bazy. [Pięć aktualnych zrzutów ekranu](./docs/screenshots/v1.1-stage3/) pokazuje działające funkcje na danych testowych. [Definicje metryk](./docs/quality/STAGE3_METRICS.md) opisują zakres, terminy i projekty archiwalne.

TaskFlow nie implementuje czatu, powiadomień push/e-mail, uploadu plików, odzyskiwania hasła, płatności, integracji zewnętrznych, realtime ani trybu offline. Kolejne przestrzenie uzyskuje się przez przyjęcie zaproszenia; aplikacja nie ma osobnego kreatora wielu przestrzeni. Publiczne demo i hosting pozostają zadaniem Etapu 4.

Szczegółowy stan etapów znajduje się w [ROADMAP.md](./ROADMAP.md), a pełna specyfikacja w [TASKFLOW_AGENT_SPEC.md](./TASKFLOW_AGENT_SPEC.md).
