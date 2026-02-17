import { t } from '../../services/i18n.js';
import { determineHydrantType } from '../../services/hydrant-logic.js';

export function initFormLogic(element, location, editMode, initialData) {
    const typeInput = element.querySelector('#hydrant-type');
    const posInput = element.querySelector('#hydrant-position');
    const diameterInput = element.querySelector('#hydrant-diameter');
    const refInput = element.querySelector('#hydrant-ref');
    const noteInput = element.querySelector('#hydrant-note');
    const volumeInput = element.querySelector('#hydrant-volume');
    const signInput = element.querySelector('#hydrant-sign');
    const sourceInput = element.querySelector('#hydrant-water-source');

    const volumeContainer = element.querySelector('#volume-container');
    const diameterContainer = element.querySelector('#diameter-container');
    const signContainer = element.querySelector('#sign-container');
    const refContainer = element.querySelector('#ref-container');

    const submitBtn = element.querySelector('#submit-img-btn');

    // --- GRID SETUP ---
    const mainTypes = [
        {
            id: 'pillar',
            label: t('confirm.types.pillar'),
            icon: `<svg viewBox="0 0 24 24" class="w-10 h-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M7 21H17V19H15V11H17C17.55 11 18 10.55 18 10V8C18 7.45 17.55 7 17 7H15V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V7H7C6.45 7 6 7.45 6 8V10C6 10.55 6.45 11 7 11H9V19H7V21ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V7H11V5ZM7 8H9V10H7V8ZM15 8H17V10H15V8Z" fill="#DC2626"/>
               </svg>`
        },
        { id: 'underground', label: t('confirm.types.underground'), icon: '<span class="text-4xl mb-1">🕳️</span>' }
    ];
    const subTypes = [
        { id: 'dry_hydrant', label: t('confirm.types.dry_hydrant'), icon: '<span class="text-xl">🌵</span>' },
        {
            id: 'wall',
            label: t('confirm.types.wall'),
            icon: `<svg viewBox="0 0 24 24" class="w-8 h-8 drop-shadow-md" fill="none" class="text-gray-400" xmlns="http://www.w3.org/2000/svg">
                 <path d="M4 22H20V2H4V22ZM13 14H16V17H13V14Z" fill="currentColor"/>
                 <path d="M12 12V19H17V12H12Z" stroke="#EF4444" stroke-width="2"/>
               </svg>`
        },
        { id: 'cistern', label: t('confirm.types.cistern'), icon: '<span class="text-xl">🛢️</span>' },
        {
            id: 'suction_point',
            label: t('confirm.types.suction'),
            icon: `<svg viewBox="0 0 24 24" class="w-8 h-8 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M22 17C22 17 19 14 15 14C11 14 9 17 5 17C2.5 17 2 15.5 2 15.5V19C2 19 4 21 8 21C12 21 14 18 18 18C21 18 22 19 22 19V17Z" fill="#3B82F6"/>
                 <path d="M22 13C22 13 19 10 15 10C11 10 9 13 5 13C2.5 13 2 11.5 2 11.5V9.5C2 9.5 4 11 8 11C12 11 14 8 18 8C21 8 22 9 22 9V13Z" fill="#60A5FA"/>
                 <circle cx="17" cy="5" r="2" fill="#FCD34D"/>
               </svg>`
        }
    ];

    const gridMain = element.querySelector('#type-grid-main');
    const gridSub = element.querySelector('#type-grid-secondary');

    if (gridMain && gridSub) {
        // Render Main
        gridMain.innerHTML = mainTypes.map(opt => `
             <button type="button" class="option-btn h-24 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-[1.02] active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="text-sm font-bold uppercase tracking-tight" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');

        // Render Sub
        gridSub.innerHTML = subTypes.map(opt => `
             <button type="button" class="option-btn h-16 rounded-xl border-2 border-transparent bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="text-[9px] font-bold uppercase tracking-tight" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');
    }

    // --- DIRTY CHECKING LOGIC ---
    let hasChanges = false;
    const checkChanges = () => {
        if (!editMode || !initialData) return;

        const currentType = typeInput ? typeInput.value : '';
        const currentPos = posInput ? posInput.value : '';
        const currentDiameter = diameterInput ? diameterInput.value : '';
        const currentRef = refInput ? refInput.value : '';
        const currentNote = noteInput ? noteInput.value : '';
        const currentSign = signInput ? signInput.value : 'unknown';
        const currentSource = sourceInput ? sourceInput.value : '';

        // Helper to safely get tag
        const getTag = (k) => initialData.tags[k] || '';

        // Compare Tags
        let typeChanged = false;
        if (currentType === 'cistern') {
            typeChanged = (getTag('emergency') !== 'water_tank');
        } else if (currentType === 'dry_hydrant') {
            typeChanged = (getTag('fire_hydrant:type') !== 'dry_hydrant');
        } else {
            typeChanged = (getTag('fire_hydrant:type') !== currentType);
        }

        const posChanged = (getTag('fire_hydrant:position') !== currentPos);
        const diaChanged = (getTag('fire_hydrant:diameter') !== currentDiameter);
        const refChanged = (getTag('ref') !== currentRef);
        const noteChanged = ((getTag('note') || getTag('description')) !== currentNote);

        const originalSource = getTag('water_source') || '';
        const sourceChanged = (originalSource !== (currentSource || ''));

        // Sign check logic
        let signChanged = false;
        const originalSign = getTag('fire_hydrant:diameter:signed');

        if (currentSign === 'no') {
            signChanged = (originalSign !== 'no');
        } else if (currentSign === 'yes') {
            signChanged = (originalSign !== 'yes');
        } else {
            signChanged = (originalSign === 'yes' || originalSign === 'no');
        }

        // Compare Location (Float precision tolerance)
        const latDiff = Math.abs(location.lat - initialData.lat);
        const lngDiff = Math.abs(location.lng - initialData.lng);
        const locChanged = (latDiff > 0.000001 || lngDiff > 0.000001);

        hasChanges = (typeChanged || posChanged || diaChanged || refChanged || noteChanged || signChanged || sourceChanged || locChanged);

        // Update UI
        if (submitBtn) {
            if (hasChanges) {
                submitBtn.innerHTML = `<span>☁️ ${t('confirm.update_btn')}</span>`;
                submitBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            } else {
                submitBtn.innerHTML = `<span>${t('confirm.back_btn_label')}</span>`;
                submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                submitBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
            }
        }
    };

    // --- UI UPDATERS AND EVENT LISTENERS ---

    // Grid Updates
    const optionBtns = element.querySelectorAll('.option-btn');
    const updateGrid = (val) => {
        if (typeInput) typeInput.value = val;

        optionBtns.forEach(btn => {
            if (btn.dataset.value === val) {
                btn.classList.add('border-green-500', 'bg-green-900/30', 'text-white', 'shadow-md');
                btn.classList.remove('border-transparent', 'bg-gray-800', 'text-gray-400');
            } else {
                btn.classList.remove('border-green-500', 'bg-green-900/30', 'text-white', 'shadow-md');
                btn.classList.add('border-transparent', 'bg-gray-800', 'text-gray-400');
            }
        });

        // Visibility Toggles
        if (val === 'cistern') {
            if (volumeContainer) volumeContainer.classList.remove('hidden');
            if (diameterContainer) diameterContainer.classList.add('hidden');
            if (refContainer) refContainer.classList.remove('hidden');
        } else if (val === 'suction_point') {
            if (volumeContainer) volumeContainer.classList.add('hidden');
            if (diameterContainer) diameterContainer.classList.add('hidden');
            if (refContainer) refContainer.classList.add('hidden');
        } else {
            if (volumeContainer) volumeContainer.classList.add('hidden');
            if (diameterContainer) diameterContainer.classList.remove('hidden');
            if (refContainer) refContainer.classList.remove('hidden');
        }

        if (signContainer) {
            if (val === 'underground') {
                signContainer.classList.remove('hidden');
            } else {
                signContainer.classList.add('hidden');
            }
        }

        checkChanges();

        // Water Source Options
        if (sourceInput) {
            let options = [{ value: "", label: t('confirm.water_source_default') }];

            if (val === 'cistern') {
                options.push({ value: "reservoir", label: t('confirm.water_source_reservoir') });
            } else if (val === 'suction_point') {
                options.push({ value: "groundwater", label: t('confirm.water_source_groundwater') });
                options.push({ value: "pond", label: t('confirm.water_source_pond') });
                options.push({ value: "lake", label: t('confirm.water_source_lake') });
                options.push({ value: "river", label: t('confirm.water_source_river') });
            } else {
                options.push({ value: "main", label: t('confirm.water_source_main') });
            }

            const currentVal = sourceInput.value;
            sourceInput.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

            // Try to keep value if valid
            if (options.some(o => o.value === currentVal)) {
                sourceInput.value = currentVal;
            } else {
                sourceInput.value = "";
            }
        }
    };

    optionBtns.forEach(btn => {
        btn.onclick = () => updateGrid(btn.dataset.value);
    });

    // Position Updates
    const posBtns = element.querySelectorAll('.pos-option-btn');
    const updatePos = (val) => {
        if (posInput) posInput.value = val;
        posBtns.forEach(btn => {
            if (btn.dataset.value === val) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
                btn.classList.add('text-gray-400');
            }
        });
        checkChanges();
    };
    posBtns.forEach(btn => {
        btn.onclick = () => updatePos(btn.dataset.value);
    });

    // Sign Updates
    const signBtns = element.querySelectorAll('.sign-option-btn');
    const updateSign = (val) => {
        if (signInput) signInput.value = val;
        signBtns.forEach(btn => {
            if (btn.dataset.value === val) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
                btn.classList.remove('text-gray-400', 'bg-gray-800');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
                btn.classList.add('text-gray-400');
            }
        });
        checkChanges();
    };
    signBtns.forEach(btn => {
        btn.onclick = () => updateSign(btn.dataset.value);
    });

    // --- PRE-FILL ---
    if (editMode && initialData && initialData.tags) {
        const nodeTags = initialData.tags;

        const typeVal = determineHydrantType(nodeTags) || '';
        updateGrid(typeVal);

        if (nodeTags['fire_hydrant:position']) {
            let pos = nodeTags['fire_hydrant:position'];
            if (pos === 'street') pos = 'lane';
            updatePos(pos);
        } else {
            updatePos('');
        }

        if (diameterInput && nodeTags['fire_hydrant:diameter']) diameterInput.value = nodeTags['fire_hydrant:diameter'];
        if (refInput && nodeTags['ref']) refInput.value = nodeTags['ref'];
        if (noteInput && (nodeTags['note'] || nodeTags['description'])) noteInput.value = nodeTags['note'] || nodeTags['description'];

        if (sourceInput && nodeTags['water_source']) {
            // Need to set value AFTER options populated by updateGrid
            // We called updateGrid above, so options should be there
            sourceInput.value = nodeTags['water_source'];
        }

        if (signInput) {
            if (nodeTags['fire_hydrant:diameter:signed'] === 'no' || nodeTags['ref:signed'] === 'no') {
                updateSign('no');
            } else if (nodeTags['fire_hydrant:diameter:signed'] === 'yes') {
                updateSign('yes');
            } else {
                updateSign('unknown');
            }
        }
    } else {
        updateGrid('pillar'); // Default
        updatePos('');
        updateSign('unknown');
    }

    // Attach Listeners
    if (editMode) {
        [typeInput, posInput, diameterInput, refInput, noteInput, volumeInput, signInput, sourceInput].forEach(el => {
            if (el) el.addEventListener('input', checkChanges);
            if (el) el.addEventListener('change', checkChanges);
        });
        setTimeout(checkChanges, 300);
    }

    return { checkChanges, hasChanges: () => hasChanges };
}
