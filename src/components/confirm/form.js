import { t } from '../../services/i18n.js';
import { determineHydrantType } from '../../services/hydrant-logic.js';
import { typeIcon } from '../icons.js';
import { initAedForm } from './aed-form.js';

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
    const aedFormContainer = element.querySelector('#aed-form-container');
    const hydrantDetailsContainer = element.querySelector('#hydrant-details-container');
    const waterSourceContainer = element.querySelector('#water-source-container');
    const positionContainer = element.querySelector('#position-container');
    const refLabel = element.querySelector('#hydrant-ref-label');

    const submitBtn = element.querySelector('#submit-img-btn');

    // --- GRID SETUP ---
    const mainTypes = [
        { id: 'pillar', label: t('confirm.types.pillar'), icon: typeIcon('pillar', 'w-14 h-14') },
        { id: 'underground', label: t('confirm.types.underground'), icon: typeIcon('underground', 'w-14 h-14') }
    ];
    const subTypes = [
        { id: 'dry_hydrant', label: t('confirm.types.dry_hydrant'), icon: typeIcon('dry_hydrant', 'w-10 h-10') },
        { id: 'wall', label: t('confirm.types.wall'), icon: typeIcon('wall', 'w-10 h-10') },
        { id: 'cistern', label: t('confirm.types.cistern'), icon: typeIcon('cistern', 'w-10 h-10') },
        { id: 'suction_point', label: t('confirm.types.suction'), icon: typeIcon('suction_point', 'w-10 h-10') }
    ];

    const gridMain = element.querySelector('#type-grid-main');
    const gridSub = element.querySelector('#type-grid-secondary');
    const gridAed = element.querySelector('#type-grid-aed');

    if (gridMain && gridSub) {
        // Render Main
        gridMain.innerHTML = mainTypes.map(opt => `
             <button type="button" class="option-btn hj-option h-[7.25rem] flex flex-col items-center justify-center gap-2.5" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="max-w-full px-1 text-center text-[9.5px] leading-tight font-semibold uppercase tracking-[0.1em] hyphens-auto [overflow-wrap:anywhere]" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');

        // Render Sub
        gridSub.innerHTML = subTypes.map(opt => `
             <button type="button" class="option-btn hj-option h-[5.25rem] flex flex-col items-center justify-center gap-2" data-value="${opt.id}" aria-label="${opt.label}">
                <span aria-hidden="true">${opt.icon}</span>
                <span class="max-w-full px-0.5 text-center text-[8px] leading-[1.15] font-semibold uppercase tracking-[0.04em] hyphens-auto [overflow-wrap:anywhere]" aria-hidden="true">${opt.label}</span>
             </button>
       `).join('');
    }

    // Render AED: a slim option at the very bottom of the type selection. It uses the same
    // "option-btn" class as the hydrant types, so selecting it works through the same code path.
    if (gridAed) {
        const aedLabel = t('confirm.types.aed');
        gridAed.innerHTML = `
             <button type="button" class="option-btn hj-option h-[3.5rem] w-full flex flex-row items-center justify-center gap-3" data-value="aed" aria-label="${aedLabel}">
                <span aria-hidden="true">${typeIcon('aed', 'w-8 h-8')}</span>
                <span class="px-1 text-center text-[10px] leading-tight font-semibold uppercase tracking-[0.1em]" aria-hidden="true">${aedLabel}</span>
             </button>`;
    }

    // The AED has its own input mask (see aed-form.js). It is created once; it stays hidden until
    // the AED type is selected. `checkChanges` is declared further down (hoisted by the arrow wrapper).
    const aedForm = initAedForm(element, {
        editMode,
        initialData,
        onChange: () => checkChanges()
    });

    // --- DIRTY CHECKING LOGIC ---
    let hasChanges = false;
    const checkChanges = () => {
        if (!editMode || !initialData) return;

        const currentType = typeInput ? typeInput.value : '';
        const currentPos = posInput ? posInput.value : '';
        const currentDiameter = diameterInput ? diameterInput.value : '';
        const currentVolume = volumeInput ? volumeInput.value : '';
        const currentRef = refInput ? refInput.value : '';
        const currentNote = noteInput ? noteInput.value : '';
        const currentSign = signInput ? signInput.value : 'unknown';
        const currentSource = sourceInput ? sourceInput.value : '';

        // Helper to safely get tag
        const getTag = (k) => initialData.tags[k] || '';

        // Compare Tags
        let typeChanged;
        if (currentType === 'aed') {
            typeChanged = getTag('emergency') !== 'defibrillator';
        } else if (currentType === 'cistern') {
            typeChanged = (getTag('emergency') !== 'water_tank');
        } else if (currentType === 'suction_point') {
            typeChanged = getTag('emergency') !== 'suction_point';
        } else if (currentType === 'dry_hydrant') {
            typeChanged = getTag('emergency') !== 'fire_hydrant' || getTag('fire_hydrant:type') !== 'dry_hydrant';
        } else {
            typeChanged = getTag('emergency') !== 'fire_hydrant' || getTag('fire_hydrant:type') !== currentType;
        }

        const posChanged = currentType !== 'aed' && (getTag('fire_hydrant:position') !== currentPos);
        const diaChanged = currentType !== 'aed' && currentType !== 'cistern' && currentType !== 'suction_point' && (getTag('fire_hydrant:diameter') !== currentDiameter);
        const volumeChanged = currentType === 'cistern' && (getTag('water_tank:volume') !== currentVolume);
        // ref and note belong to the hydrant fields; AEDs have their own fields in the AED mask.
        const refChanged = currentType !== 'aed' && (getTag('ref') !== currentRef);
        const noteChanged = currentType !== 'aed' && ((getTag('note') || getTag('description')) !== currentNote);

        const originalSource = getTag('water_source') || '';
        const sourceChanged = currentType !== 'aed' && (originalSource !== (currentSource || ''));
        const aedAttributesChanged = currentType === 'aed' && !!aedForm && aedForm.hasChanges();

        // Sign check logic
        let signChanged;
        const originalSign = getTag('fire_hydrant:diameter:signed');

        if (currentType === 'aed' || currentType === 'cistern' || currentType === 'suction_point') {
            signChanged = false;
        } else if (currentSign === 'no') {
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

        hasChanges = (typeChanged || posChanged || diaChanged || volumeChanged || refChanged || noteChanged || signChanged || sourceChanged || aedAttributesChanged || locChanged);

        // Update UI
        if (submitBtn) {
            if (hasChanges) {
                submitBtn.innerHTML = `<span>${t('confirm.update_btn')}</span>`;
                submitBtn.classList.remove('hj-btn-ghost');
                submitBtn.classList.add('hj-btn-light');
            } else {
                submitBtn.innerHTML = `<span>${t('confirm.back_btn_label')}</span>`;
                submitBtn.classList.remove('hj-btn-light');
                submitBtn.classList.add('hj-btn-ghost');
            }
        }
    };

    // --- UI UPDATERS AND EVENT LISTENERS ---

    // Grid Updates
    const optionBtns = element.querySelectorAll('.option-btn');
    const updateGrid = (val) => {
        if (typeInput) typeInput.value = val;

        optionBtns.forEach(btn => {
            const isSelected = btn.dataset.value === val;
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-pressed', String(isSelected));
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
        } else if (val === 'aed') {
            if (volumeContainer) volumeContainer.classList.add('hidden');
            if (diameterContainer) diameterContainer.classList.add('hidden');
            if (refContainer) refContainer.classList.remove('hidden');
        } else {
            if (volumeContainer) volumeContainer.classList.add('hidden');
            if (diameterContainer) diameterContainer.classList.remove('hidden');
            if (refContainer) refContainer.classList.remove('hidden');
        }

        // AED: show its own mask and hide ALL hydrant fields. Everything else: hydrant fields as before.
        if (aedFormContainer) aedFormContainer.classList.toggle('hidden', val !== 'aed');
        if (hydrantDetailsContainer) hydrantDetailsContainer.classList.toggle('hidden', val === 'aed');
        if (waterSourceContainer) waterSourceContainer.classList.toggle('hidden', val === 'aed');
        if (positionContainer) positionContainer.classList.toggle('hidden', val === 'aed');
        if (refLabel) refLabel.textContent = t('confirm.number_label');

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
            const isSelected = btn.dataset.value === val;
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-pressed', String(isSelected));
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
            const isSelected = btn.dataset.value === val;
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-pressed', String(isSelected));
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
        if (volumeInput && nodeTags['water_tank:volume']) volumeInput.value = nodeTags['water_tank:volume'];
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

    return { checkChanges, hasChanges: () => hasChanges, aedForm };
}
