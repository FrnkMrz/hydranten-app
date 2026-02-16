import { t } from '../services/i18n.js';
import { prepareHydrantTags } from '../services/hydrant-logic.js';
import { renderConfirmView } from './confirm/template.js';
import { initMap } from './confirm/map.js';
import { initFormLogic } from './confirm/form.js';
import { initPhoto } from './confirm/photo.js';

// Retain export for backward compatibility if needed, but render is now imported
export { renderConfirmView };

export function initConfirmView(element, imageBlob, location, onRetake, onSubmit, editMode = false, initialData = null, onDelete = null) {
  try {
    // Guard Location
    if (!location && !editMode) {
      console.warn("ConfirmView: Location missing, using fallback.");
      location = { lat: 48.137, lng: 11.576, accuracy: 1000 };
    } else if (editMode && initialData) {
      location = { lat: initialData.lat, lng: initialData.lng, accuracy: 0 };
    }

    // 1. Initialize Map
    // Pass a callback for dirty checking if needed, or handle it inside form
    // We need 'checkChanges' to be available for map drag end
    let formLogic = null;
    const checkChangesWrapper = () => {
      if (formLogic && formLogic.checkChanges) formLogic.checkChanges();
    };

    initMap(element, location, editMode, initialData, onRetake, checkChangesWrapper);

    // 2. Initialize Photo
    initPhoto(element, imageBlob, location, editMode);

    // 3. Initialize Form Logic
    formLogic = initFormLogic(element, location, editMode, initialData);

    // 4. Initialize Buttons & Orchestration (Submit, Delete, Back)

    // BACK / RETAKE BUTTON
    const retakeBtn = element.querySelector('#retake-btn');
    if (retakeBtn) {
      if (editMode) {
        // Convert to Cancel Button
        retakeBtn.classList.remove('hidden');
        retakeBtn.style.display = 'flex';
        retakeBtn.style.zIndex = '50';
        retakeBtn.setAttribute('aria-label', t('confirm.cancel_btn') || "Abbrechen");
        retakeBtn.innerHTML = `<svg aria-hidden="true" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      }

      retakeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRetake && typeof onRetake.back === 'function') {
          onRetake.back();
        } else {
          alert("Fehler: Zurück-Funktion nicht verfügbar.");
        }
      });
    }

    // DELETE BUTTON
    if (editMode && onDelete) {
      const delSection = element.querySelector('#delete-section');
      if (delSection) delSection.classList.remove('hidden');

      const delBtn = element.querySelector('#delete-hydrant-btn');
      if (delBtn) {
        delBtn.setAttribute('aria-label', t('confirm.delete_btn'));
        delBtn.onclick = () => {
          let confirmMsg = t('confirm.delete_confirm');
          if (initialData.tags) {
            if (initialData.tags['emergency'] === 'water_tank') {
              confirmMsg = t('confirm.delete_confirm_cistern') || confirmMsg;
            } else if (initialData.tags['emergency'] === 'suction_point') {
              confirmMsg = t('confirm.delete_confirm_suction') || confirmMsg;
            }
          }

          if (confirm(confirmMsg)) {
            onDelete(initialData.id, initialData.version);
          }
        };
      }
    }

    // SUBMIT BUTTON
    const submitBtn = element.querySelector('#submit-img-btn');
    if (submitBtn) {
      if (editMode) {
        submitBtn.innerHTML = `<span>💾 ${t('confirm.save_btn') || 'Speichern'}</span>`;
      }

      submitBtn.onclick = () => {
        // Edit Mode: If no changes, just go back
        if (editMode && formLogic && !formLogic.hasChanges()) {
          console.log("No changes detected, cancelling edit.");
          if (onRetake && onRetake.back) onRetake.back();
          return;
        }

        const typeInput = element.querySelector('#hydrant-type');
        const posInput = element.querySelector('#hydrant-position');
        const diameterInput = element.querySelector('#hydrant-diameter');
        const refInput = element.querySelector('#hydrant-ref');
        const noteInput = element.querySelector('#hydrant-note');
        const sourceInput = element.querySelector('#hydrant-water-source');
        const volumeInput = element.querySelector('#hydrant-volume');
        const signInput = element.querySelector('#hydrant-sign');

        const selectedType = typeInput ? typeInput.value : '';
        const selectedPos = posInput ? posInput.value : '';

        // Prepare Tags using Service
        const tags = prepareHydrantTags(
          (editMode && initialData) ? initialData.tags : {},
          selectedType,
          selectedPos,
          diameterInput ? diameterInput.value : null,
          refInput ? refInput.value : null,
          noteInput ? noteInput.value : null,
          sourceInput ? sourceInput.value : null,
          volumeInput ? volumeInput.value : null,
          signInput ? signInput.value : 'unknown'
        );

        onSubmit({
          ...location,
          tags: tags,
          id: editMode ? initialData.id : null,
          version: editMode ? initialData.version : null
        });
      };
    }

  } catch (err) {
    console.error("FATAL ConfirmView Error", err);
    alert("UI Error: " + err.message);
  }
}
