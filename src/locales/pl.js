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
        info_data_text: "Ta aplikacja nie przechowuje danych osobowych. Wszystkie wpisy są wysyłane bezpośrednio do OpenStreetMap (OSM).",
        info_license: "Licencja i Kod",
        info_github: "Zobacz na GitHub"
    },
    settings: {
        title: "Ustawienia",
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
        back_to_map: "Powrót do mapy"
    },
    confirm: {
        title: "Potwierdź Dane",
        title_edit: "Edytuj Hydrant",
        delete_btn: "Usuń",
        delete_confirm: "Czy na pewno usunąć hydrant?",
        save_btn: "Zapisz",
        position_adjustable: "Pozycja regulowana",
        position_moved: "Pozycja zaktualizowana",
        fixed_map: "Przesuwalny (Mapa zablokowana)",
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
        // color_label removed
        number_label: "NUMER / REF",
        number_placeholder: "np. 1234",
        notes_label: "NOTATKA",
        notes_placeholder: "..."
    }
};
