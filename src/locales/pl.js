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
        legal_link: "Info Prawne"
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
    confirm: {
        title: "Potwierdź Dane",
        title_edit: "Edytuj Hydrant",
        back_btn_label: "Wstecz",
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
            suction: "Punkt czerpania"
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
            unknown: "Nieznane"
        },
        // color_label removed
        number_label: "NUMER / REF",
        number_placeholder: "np. 1234",
        notes_label: "NOTATKA",
        notes_placeholder: "..."
    }
};
