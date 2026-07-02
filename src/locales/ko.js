export default {
    intro: {
        title_pre: "소화전",
        title_post: "헌터",
        step1: "3미터 거리",
        step1_bold: "3미터",
        step2: "사진 촬영",
        step2_bold: "사진",
        step3: "데이터 추가",
        step3_bold: "데이터",
        step4: "OSM에 업로드",
        step4_bold: "업로드",
        start_btn: "시작",
        login_osm: "OSM 로그인",
        login_connected: "연결됨",
        info_legal: "법적 정보",
        info_impressum: "인프린트",
        info_data: "데이터 및 개인정보",
        info_data_text: "사진은 브라우저에서 일시적으로 로컬 처리될 뿐 업로드되거나 분석되지 않습니다. GPS 위치는 위치 권한을 통해 사진과 별도로 확인됩니다. 좌표와 소화전 정보는 업로드가 명시적으로 시작된 경우에만 OpenStreetMap으로 전송됩니다. GPS EXIF 데이터가 포함된 사진 사본은 공유 또는 다운로드를 명시적으로 선택한 경우에만 저장됩니다. 외부 지도 서비스, Overpass, Nominatim 및 OpenStreetMap을 사용할 때는 기술적인 이유로 기기의 IP 주소도 전송됩니다.",
        info_license: "라이선스 및 코드",
        disclaimer_text: "비상시 사용 금지. 보증 없음.\n시작은 데이터 사용 동의를 의미합니다。",
        info_github: "GitHub에서 보기",
        lang_btn_aria: "언어 / Language"
    },
    pwa: {
        update_available: "새 앱 버전을 사용할 수 있습니다.",
        update_now: "지금 업데이트"
    },
    hydrant_data: {
        loading: "소화전 데이터를 불러오는 중 …",
        slow: "데이터 요청이 평소보다 오래 걸립니다",
        current: "소화전 데이터가 최신 상태입니다",
        unavailable: "현재 소화전 데이터를 사용할 수 없습니다",
        stale: "기존 데이터 – 업데이트 실패"
    },
    settings: {
        title: "설정",
        map_style: "지도 스타일",
        account: "OSM 계정",
        connect_btn: "OSM 연결",
        disconnect_btn: "로그아웃",
        app_reset: "앱 초기화",
        reset_btn: "초기화 및 캐시 삭제",
        back_btn: "뒤로",
        legal_link: "법적 고지 및 임프린트",
        history_btn: "기록"
    },
    gamification: {
        rank_progress: "{rank} 까지 {count} 남음!",
        rank_max: "당신은 전설입니다!",
        legend: "계급 및 배지",
        list_title: "모든 등급",
        from_hydrants: "{count} 소화전부터",
        level_title: "소화전 사냥꾼 등급"
    },
    history: {
        title: "기록",
        btn_label: "기록",
        loading: "데이터 로딩 중...",
        error: "로딩 오류",
        no_data: "변경 사항이 없습니다.",
        not_logged_in: "로그인되지 않음.",
        back_btn: "뒤로"
    },


    confirm: {
        title: "데이터 확인",
        title_edit: "소화전 편집",
        cancel_btn: "취소",
        delete_btn: "삭제",
        delete_confirm: "정말 삭제하시겠습니까?",
        delete_confirm_cistern: "Really delete cistern? This cannot be undone.",
        delete_confirm_suction: "Really delete suction point? This cannot be undone.",
        save_btn: "저장",
        update_btn: "OSM 업데이트",
        water_source_label: "수원",
        water_source_default: "지정되지 않음",
        water_source_main: "상수도 (main)",
        water_source_groundwater: "지하수 (groundwater)",
        water_source_pond: "연못 (pond)",
        water_source_lake: "호수 (lake)",
        water_source_river: "강 (river)",
        water_source_reservoir: "저수지 (reservoir)",
        position_adjustable: "위치 조정 가능",
        position_moved: "위치 업데이트됨",
        fixed_map: "이동 가능 (지도 고정)",
        click_to_save: "다시 클릭하여 저장",
        preview_alt: "촬영된 사진",
        back_btn_aria: "카메라로 돌아가기",
        back_btn_label: "뒤로",
        retry_gps_aria: "GPS 재시도",
        type_label: "유형",
        position_label: "위치",
        details_label: "세부 정보 (선택 사항)",
        upload_btn: "OSM에 업로드",
        uploading: "업로드 중...",
        success: "업로드 성공!",
        error: "업로드 오류",
        types: {
            underground: "지하식",
            pillar: "지상식",
            wall: "벽면형",
            suction: "흡수관",
            cistern: "저수조",
            dry_hydrant: "건식 소화전",




        },
        locations: {
            sidewalk: "보도",
            street: "도로",
            green: "녹지",
            parking: "주차장",
            none: "없음"
        },
        diameter_label: "지름 / 크기",
        diameter_none: "지정되지 않음",
        sign_label: "지하 소화전 표지판",
        sign_options: {
            yes: "예",
            no: "아니요",

            unknown: "알 수 없음"
        },
        colors: {
            black: "검정",
            grey: "회색",
            blue: "파랑",
            red: "빨강",
            yellow: "노랑",
            green: "초록",
            white: "흰색"
        },
        number_label: "번호 / 참조",
        number_placeholder: "예: 1234",
        notes_label: "메모",
        notes_placeholder: "..."
        ,
        share_title: "Hydranten Jäger",
        share_text: "Hydrant captured with Hydranten Jäger",
        diameter_placeholder: "e.g. 80, 100",
        volume_placeholder: "e.g. 100"
    },
    general: {
        loading: "로딩 중...",
        error: "오류",
        success: "성공",
        close: "닫기",
        done: "완료",
        cancel: "취소",
        save: "저장",
        delete: "삭제",
        back: "뒤로",
        retry: "재시도",
        saving: "Saving..."
    },
    messages: {
        locating_position: "위치 찾는 중...",
        please_login: "편집하려면 로그인하세요.",
        loading_hydrant: "소화전 #{id} 로딩 중...",
        saving_data: "저장 중...",
        deleting_data: "삭제 중...",
        internal_error_reload: "내부 오류. 새로고침하세요.",
        camera_error: "카메라 오류: {error}",
        gps_update_failed: "GPS 오류: {error}",
        no_osm_credentials: "OSM 자격 증명이 없습니다. 로그인하세요.",
        to_settings: "설정으로",
        uploading: "업로드 중...",
        upload_successful: "업로드 성공!",
        upload_wait: "업로드 중... ⏳",
        node_id: "노드 ID",
        changeset: "변경 세트",
        upload_failed: "업로드 실패",
        verifying_login: "로그인 확인 중...",
        back_to_start: "시작으로 돌아가기"
    },
    camera: {
        permission: "카메라 권한 필요",
        retake: "재촬영",
        use_photo: "사진 사용",
        back_btn_aria: "카메라로 돌아가기",
        back_btn_label: "뒤로",
        capture_btn_aria: "사진 촬영",
        error_title: "카메라 사용 불가",
        error_access: "접근 권한 없음",
        compass_label: "나침반",
        gps_searching: "GPS: 검색 중..."
    },
    error: {
        load_failed: "로드 실패",
        node_deleted: "이 소화전은 더 이상 존재하지 않습니다.",
        oops: "이런!",
        back_to_map: "지도로 돌아가기",
        gps_failed: "위치를 찾을 수 없습니다. GPS를 확인하세요.",
        gps_unavailable: "GPS 사용 불가. 기본 지도 표시.",
        edit_function_missing: "내부 오류: 편집 기능 누락.",
        network_error: "로드 실패 (네트워크/API)",
        back_unavailable: "오류: 뒤로 가기 불가."
    },
    legal: {
        important_header: "⚠️ 중요:",
        tmg_header: "법적 정보:"
    },
    upload_log: {
        locating_nominatim: "위치 이름 확인 중 (Nominatim)...",
        unknown_location: "알 수 없음",
        location_fallback: "장소",
        nominatim_error: "Nominatim 오류: {status}",
        creating_changeset: "변경 세트 생성 중...",
        uploading_hydrant: "소화전 업로드 중...",
        starting_update: "업데이트 시작...",
        update_conflict: "충돌! 누군가 방금 수정했습니다. 새로고침하세요.",
        update_success: "업데이트 성공!",
        deleting_node: "{type} #{id} 삭제 중...",
        delete_conflict: "충돌! 삭제 실패.",
        already_deleted: "이미 삭제됨.",
        delete_success: "삭제됨!"
    }
};
