export default {
    intro: {
        title_pre: "Łowca",
        title_post: "Hydrantów",
        step1: "3 Metry Odległości",
        step1_bold: "3 Metry",
        step2: "Zrób Zdjęcie",
        step2_bold: "Zdjęcie",
        step3: "Uzupełnij Dane",
        step3_bold: "Dane",
        step4: "Wyślij do OSM",
        step4_bold: "Wyślij",
        start_btn: "START",
        login_osm: "Logowanie OSM",
        login_connected: "Połączono",
        info_legal: "Informacje Prawne",
        info_impressum: "Impressum",
        info_data: "Dane i Prywatność",
        info_data_text: "Ta aplikacja nie przechowuje danych osobowych na własnych serwerach. Twój adres IP jest przesyłany do Overpass API i Nominatim (Fundacja OSM) w celu pobierania danych mapy i adresów. Przetwarzanie GPS odbywa się lokalnie na Twoim urządzeniu.",
        info_license: "Licencja i kod",
        disclaimer_text: "Nie używać w nagłych wypadkach. Brak gwarancji.\nStart oznacza zgodę na użycie danych.",
        info_github: "Zobacz na GitHub",
        lang_btn_aria: "Język / Language"
    },
    settings: {
        title: "Ustawienia",
        map_style: "Styl mapy",
        account: "Konto OSM",
        connect_btn: "Połącz z OSM",
        disconnect_btn: "Wyloguj",
        app_reset: "Reset Aplikacji",
        reset_btn: "Resetuj i Wyczyść Cache",
        back_btn: "Wstecz",
        legal_link: "Info Prawne",
        history_btn: "Historia"
    },
    history: {
        title: "Historia",
        btn_label: "Historia",
        loading: "Ładowanie danych...",
        error: "Błąd ładowania",
        no_data: "Nie znaleziono zmian.",
        not_logged_in: "Nie zalogowany.",
        back_btn: "Wstecz"
    },
    camera: {
        permission: "Wymagany Dostęp do Kamery",
        retake: "Powtórz",
        use_photo: "Użyj Zdjęcia",
        back_btn_aria: "Wróć do strony głównej",
        back_btn_label: "Wstecz",
        capture_btn_aria: "Zrób zdjęcie"
    },
    error: {
        load_failed: "Błąd ładowania",
        node_deleted: "Ten hydrant już nie istnieje.",
        oops: "Ups!",
        back_to_map: "Powrót do mapy",
        gps_failed: "Nie można ustalić lokalizacji. Sprawdź ustawienia GPS.",
        gps_unavailable: "GPS niedostępny. Wyświetlanie domyślnej mapy."
    },
    gamification: {
        rank_progress: "Jeszcze {count} do rangi {rank}!",
        rank_max: "Jesteś legendą!",
        legend: "Stopnie i Odznaki",
        list_title: "Wszystkie Stopnie",
        from_hydrants: "od {count} Hydrantów",
        level_title: "Ranga Łowcy Hydrantów"
    },
    confirm: {
        title: "Potwierdź Dane",
        title_edit: "Edytuj Hydrant",
        back_btn_aria: "Wróć do kamery",
        back_btn_label: "Wstecz",
        retry_gps_aria: "Spróbuj ponownie GPS",
        cancel_btn: "Anuluj",
        delete_btn: "Usuń",
        delete_confirm: "Czy na pewno usunąć hydrant?",
        delete_confirm_cistern: "Really delete cistern? This cannot be undone.",
        delete_confirm_suction: "Really delete suction point? This cannot be undone.",
        save_btn: "Zapisz",
        update_btn: "Zaktualizuj OSM",
        water_source_label: "Źródło wody",
        water_source_default: "Nie określono",
        water_source_main: "Wodociąg (main)",
        water_source_groundwater: "Woda gruntowa (groundwater)",
        water_source_pond: "Staw (pond)",
        water_source_lake: "Jezioro (lake)",
        water_source_river: "Rzeka (river)",
        water_source_reservoir: "Zbiornik (reservoir)",
        position_adjustable: "Pozycja regulowana",
        position_moved: "Pozycja zaktualizowana",
        fixed_map: "Przesuwalny (Mapa zablokowana)",
        click_to_save: "Kliknij ponownie, aby zapisać",
        preview_alt: "Zrobione zdjęcie",
        type_label: "Typ",
        position_label: "Położenie",
        details_label: "Szczegóły (Opcjonalne)",
        upload_btn: "WYŚLIJ DO OSM",
        uploading: "Wysyłanie...",
        success: "Udało się!",
        error: "Błąd Wysyłania",
        types: {
            underground: "Podziemny",
            pillar: "Nadziemny",
            wall: "Ścienny",
            suction: "Punkt czerpania",     // "Punkt Czerpania" -> "Punkt czerpania" (lowercase usually better, but keeping consistent)
            cistern: "Cysterna",            // Simplified as requested maybe? Re-checking context... 
            // Wait, user said "is not translated". I put "Cysterna / Zbiornik" and "Suchy Hydrant". 
            // Maybe they want SPECIFIC terms. 
            // "Trocken" -> "Suchy pion" (often used for dry risers/hydrants) or "Hydrant suchy".
            // "Zisterne" -> "Cysterna" or "Zbiornik przeciwpożarowy".
            // "Saugstelle" -> "Punkt czerpania wody".
            // I will use standard fire fighting terms.
            dry_hydrant: "Suchy pion",
            cistern: "Zbiornik ppoż.",
            suction: "Punkt czerpania",




        },
        locations: {
            sidewalk: "Chodnik",
            street: "Ulica",
            green: "Teren Zielony",
            parking: "Parking",
            none: "Brak"
        },
        diameter_label: "ŚREDNICA",
        diameter_none: "Nie określono",
        sign_label: "Znak Hydrantu Podziemnego",
        sign_options: {
            yes: "Tak",
            no: "Nie",
            yes: "Tak",
            no: "Nie",
            unknown: "Nieznane"
        },
        colors: {
            black: "Czarny",
            grey: "Szary",
            blue: "Niebieski",
            red: "Czerwony",
            yellow: "Żółty",
            green: "Zielony",
            white: "Biały"
        },
        number_label: "NUMER / REF",
        number_placeholder: "np. 1234",
        notes_label: "NOTATKA",
        notes_placeholder: "..."
    ,
        share_title: "Hydranten Jäger",
        share_text: "Hydrant captured with Hydranten Jäger",
        diameter_placeholder: "e.g. 80, 100",
        volume_placeholder: "e.g. 100"
    },
    general: {
        loading: "Ładowanie...",
        error: "Błąd",
        success: "Sukces",
        close: "Zamknij",
        done: "Gotowe",
        cancel: "Anuluj",
        save: "Zapisz",
        delete: "Usuń",
        back: "Wstecz",
        retry: "Ponów",
        saving: "Saving..."
    },
    messages: {
        locating_position: "Ustalanie lokalizacji...",
        please_login: "Zaloguj się, aby edytować.",
        loading_hydrant: "Ładowanie hydrantu #{id}...",
        saving_data: "Zapisywanie...",
        deleting_data: "Usuwanie...",
        internal_error_reload: "Błąd wewnętrzny. Odśwież.",
        camera_error: "Błąd kamery: {error}",
        gps_update_failed: "Błąd GPS: {error}",
        no_osm_credentials: "Brak danych OSM. Zaloguj się.",
        to_settings: "Ustawienia",
        uploading: "Przesyłanie...",
        upload_successful: "Przesłano pomyślnie!",
        upload_wait: "Przesyłanie... ⏳",
        node_id: "ID Węzła",
        changeset: "Zestaw zmian",
        upload_failed: "Przesyłanie nieudane",
        verifying_login: "Weryfikacja logowania...",
        back_to_start: "Powrót do startu"
    },
    camera: {
        permission: "Wymagany Dostęp do Kamery",
        retake: "Powtórz",
        use_photo: "Użyj Zdjęcia",
        back_btn_aria: "Powrót do kamery",
        back_btn_label: "Wstecz",
        capture_btn_aria: "Zrób zdjęcie",
        error_title: "Kamera Niedostępna",
        error_access: "Brak Dostępu",
        compass_label: "KOMPAS",
        gps_searching: "GPS: Szukanie..."
    },
    error: {
        load_failed: "Błąd Ładowania",
        node_deleted: "Ten hydrant już nie istnieje.",
        oops: "Ups!",
        back_to_map: "Powrót do Mapy",
        gps_failed: "Nie można ustalić lokalizacji. Sprawdź GPS.",
        gps_unavailable: "GPS niedostępny. Mapa domyślna.",
        edit_function_missing: "Błąd Wewnętrzny: Brak edycji.",
        network_error: "Błąd Sieci/API",
        back_unavailable: "Błąd: Wstecz niedostępne."
    },
    legal: {
        important_header: "⚠️ WAŻNE:",
        tmg_header: "Informacje Prawne:"
    },
    upload_log: {
        locating_nominatim: "Ustalanie lokalizacji (Nominatim)...",
        unknown_location: "Nieznana",
        location_fallback: "Miejsce",
        nominatim_error: "Błąd Nominatim: {status}",
        creating_changeset: "Tworzenie Changeset...",
        uploading_hydrant: "Wysyłanie Hydrantu...",
        starting_update: "Rozpoczynanie Aktualizacji...",
        update_conflict: "Konflikt! Ktoś edytował ten hydrant.",
        update_success: "Aktualizacja Udana!",
        deleting_node: "Usuwanie {type} #{id}...",
        delete_conflict: "Konflikt! Usuwanie nieudane.",
        already_deleted: "Już usunięto.",
        delete_success: "Usunięto!"
    }
};
