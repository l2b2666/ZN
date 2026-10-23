# ZadbanyNagrobek.pl — panel klienta

Aplikacja w języku polskim dla klientów usług opieki nad nagrobkami. React + Express + SQLite. Konta, zamówienia, powiadomienia, raporty i zdjęcia są zapisywane na serwerze, a nie w pamięci przeglądarki.

## Uruchomienie

Wymagany Node.js 22.13+ (zalecany 24) i npm. Polecenia wykonuj w katalogu repozytorium (`/workspace/ZN` w środowisku chmurowym).

```bash
npm ci --cache /workspace/.cache/npm
npm run dev
```

Serwer uruchamia się na porcie 3000 i udostępnia jednocześnie aplikację i API. Nie wymaga dodatkowej bazy danych ani zewnętrznych kluczy. `PORT` zmienia port, a `DATA_DIR` zmienia katalog danych (domyślnie `data/`).

```bash
npm run build
npm start
```

Proces serwera należy uruchomić ponownie w nowym zadaniu chmurowym; nie jest częścią zapisanego obrazu dysku. Korzystaj z istniejącego checkoutu. Każde zadanie ma izolowane środowisko, więc nie twórz dodatkowego worktree bez wyraźnej prośby użytkownika.

## Działające funkcje

- Rejestracja, logowanie, wylogowanie i edycja danych konta. Hasła: scrypt z osobną solą. Sesje: losowe tokeny w ciasteczku HttpOnly, SameSite=Lax, ważne 30 dni.
- Zapisywanie i edycja lokalizacji nagrobków.
- Zamówienie usługi w trzech krokach, wybór daty, dodatków oraz uwag. Cena liczona po stronie serwera. Anulowanie do chwili rozpoczęcia realizacji.
- Statusy: zaplanowane, w realizacji, zrealizowane i anulowane.
- Raporty prac, zdjęcia przed/po, powiększanie i pobieranie zdjęć.
- Powiadomienia wewnątrz aplikacji; panel odświeża dane co 30 sekund oraz po operacjach użytkownika.
- Osobny panel pracownika dostępny wyłącznie kontom z rolą `admin`.
- Widok mobilny z wysuwanym menu i formularzami dostosowanymi do telefonu.

Domyślnie pierwsza wizyta otwiera **odizolowane konto demonstracyjne**. Jego dane nie trafiają do rzeczywistych zamówień pracowników. Rejestracja tworzy nowe, puste konto. Zdjęcia demonstracyjne są wygenerowanymi ilustracjami, co opisano w przykładowym raporcie. Ceny i dane kontaktowe to początkowa konfiguracja wymagająca potwierdzenia przez właściciela firmy. Usługi i dodatki definiuje `server/db.js`.

## Konto obsługi

Nie ma fabrycznego hasła administratora. W bezpiecznym środowisku procesu ustaw `ADMIN_EMAIL` i `ADMIN_PASSWORD` (minimum 12 znaków), następnie uruchom:

```bash
npm run admin
```

Nie zapisuj hasła w repozytorium ani w skrypcie instalacyjnym. Polecenie tworzy konto lub aktualizuje hasło i rolę istniejącego konta. Używa tego samego `DATA_DIR` co serwer. Usuń zmienną z hasłem po inicjalizacji.

Zaloguj się tym kontem w aplikacji. W menu pojawi się **Obsługa zamówień**. Otwórz zamówienie, zmień status, dodaj raport oraz zdjęcia. Do zakończenia wymagany jest opis i minimum jedno zdjęcie po realizacji. Do jednego żądania można dołączyć po 4 pliki przed/po, maksymalnie 8 MB każdy, JPG/PNG/WebP. Serwer sprawdza sygnaturę pliku. Zdjęcia są dostępne przez uwierzytelnione API tylko właścicielowi zamówienia i obsłudze. Po zmianie statusu klient otrzymuje powiadomienie w aplikacji.

## Publiczne wdrożenie

Ustaw `DEMO_MODE=0`, aby niezalogowani użytkownicy widzieli ekran powitalny z rejestracją i logowaniem. Domyślnie demonstracja pozostaje włączona dla wygodnej oceny aplikacji. Włącz HTTPS i ustaw `COOKIE_SECURE=1`. Uruchamiaj `npm start` pod nadzorem procesu i z trwałym katalogiem `DATA_DIR`.

Kopie zapasowe muszą obejmować bazę SQLite i katalog `uploads/` razem. Przy działającym serwerze korzystaj z mechanizmu backup SQLite; samo kopiowanie pliku bazy bez WAL może pominąć ostatnie zapisy. Nie publikuj katalogu `data/` jako statycznych plików.

Powiadomienia e-mail/SMS i płatności online **nie są zintegrowane**. Wysłanie zamówienia nie obciąża konta klienta. Termin i płatność potwierdza obsługa. Przed publicznym uruchomieniem trzeba potwierdzić ofertę, ceny, obszar realizacji, adres kontaktowy oraz dokumenty prawne; następnie wdrożyć aplikację z własną domeną i trwałymi kopiami zapasowymi. To repozytorium nie zmienia istniejącej strony ZadbanyNagrobek.pl.

## Weryfikacja

```bash
npm test
npm run build
curl --fail http://127.0.0.1:3000/api/health
```

Testy API używają tymczasowej bazy i sprawdzają rejestrację, izolację kont demonstracyjnych, własność nagrobków i zdjęć, ceny, statusy, walidację przesyłanych plików, publikację raportów, powiadomienia i sesje.

Dodatkowy test przeglądarkowy wymaga Python Playwright i Chromium. W bieżącym środowisku są dostępne:

```bash
bash tests/run-browser-smoke.sh
```

Uruchamia izolowaną instancję produkcyjną na porcie 3101, zakłada konta testowe i usuwa wszystkie dane po zakończeniu. Sprawdza cały przebieg klient–pracownik–raport, pobieranie zdjęć i widoki przy szerokościach 360, 390, 768, 1024 i 1440 px. `CHROMIUM_PATH` pozwala wskazać inną instalację przeglądarki, a `ZN_TEST_PORT` inny port.
