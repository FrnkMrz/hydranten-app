import { t } from '../../services/i18n.js';

export function initPhoto(element, imageBlob, location, editMode) {
    const img = element.querySelector('#preview-img');
    const imgContainer = img ? img.parentElement : null;

    if (!imageBlob || !img || editMode) {
        if (editMode && imgContainer) imgContainer.classList.add('hidden');
        return;
    }

    const blobUrl = URL.createObjectURL(imageBlob);
    img.src = blobUrl;

    // State for Zoom Overlay
    let isZoomed = false;
    let zoomOverlay = null;
    let isSaving = false; // Prevent multiple saves

    // Helper: Close Zoom Overlay
    const closeZoom = () => {
        if (zoomOverlay) {
            zoomOverlay.remove();
            zoomOverlay = null;
        }
        isZoomed = false;
        isSaving = false; // Reset save state

        // Show thumbnail label again
        const label = imgContainer.querySelector('span');
        if (label) label.style.display = '';
    };

    // Helper: Download Photo with EXIF & Descriptive Filename
    const downloadPhotoWithExif = async () => {
        if (isSaving) return; // Double-check
        isSaving = true;

        try {
            // Show loading state on button
            const saveBtn = zoomOverlay?.querySelector('#zoom-save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerText = t('general.saving') || "Speichere...";
                saveBtn.classList.add('opacity-50');
            }

            // Import photo service
            const { addExifGpsData, generateFilename } = await import('../../services/photo-service.js');

            // Add EXIF GPS data
            const enrichedBlob = await addExifGpsData(imageBlob, location.lat, location.lng);

            // Generate filename
            const typeInput = element.querySelector('#hydrant-type');
            const tags = {};
            if (typeInput) {
                const type = typeInput.value;
                if (type === 'cistern') tags.emergency = 'water_tank';
                else if (type === 'suction_point') tags.emergency = 'suction_point';
            }

            const filename = await generateFilename(location, tags);

            // Check if mobile (iOS/Android) - prefer native share for photo library
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile && navigator.share && navigator.canShare) {
                // Try native share (saves to photo library on iOS/Android)
                const file = new File([enrichedBlob], filename, { type: 'image/jpeg' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Hydrant Foto',
                        text: 'Hydrant aufgenommen mit Hydranten Jäger'
                    });

                    // Success - close immediately
                    closeZoom();
                    return;
                }
            }

            // Fallback: Regular download (Desktop or if share fails)
            const a = document.createElement('a');
            a.href = URL.createObjectURL(enrichedBlob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Visual Feedback: Green flash
            if (imgContainer) {
                const originalBorder = imgContainer.style.borderColor;
                imgContainer.style.borderColor = '#4ade80'; // Green
                setTimeout(() => {
                    imgContainer.style.borderColor = originalBorder;
                }, 500);
            }

            // Auto-close after successful save
            setTimeout(() => {
                closeZoom();
            }, 800);

        } catch (error) {
            console.error('Photo save failed:', error);

            // Reset state on error
            isSaving = false;
            const saveBtn = zoomOverlay?.querySelector('#zoom-save-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = "Fehler - Nochmal?";
                saveBtn.classList.remove('opacity-50');
            }
        }
    };

    // Helper: Show Fullscreen Photo Zoom
    const showPhotoZoom = () => {
        // Create Overlay
        zoomOverlay = document.createElement('div');
        zoomOverlay.className = 'fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in';
        zoomOverlay.innerHTML = `
          <img src="${blobUrl}" class="max-w-[90vw] max-h-[70vh] rounded-lg shadow-2xl object-contain mb-6" alt="${t('confirm.preview_alt') || 'Hydrant Photo'}" />
          <div class="flex gap-4">
            <button id="zoom-back-btn" class="px-8 py-3 bg-gray-700/80 backdrop-blur text-white rounded-xl font-semibold hover:bg-gray-600/80 active:scale-95 transition">
              ${t('confirm.cancel_btn') || 'Zurück'}
            </button>
            <button id="zoom-save-btn" class="px-8 py-3 bg-green-600/90 backdrop-blur text-white rounded-xl font-semibold hover:bg-green-500/90 active:scale-95 transition">
              ${t('confirm.save_btn') || 'Speichern'}
            </button>
          </div>
        `;

        // Button: Save
        const saveBtn = zoomOverlay.querySelector('#zoom-save-btn');
        saveBtn.onclick = async (e) => {
            e.stopPropagation();
            if (isSaving) return;
            await downloadPhotoWithExif();
        };

        // Button: Back (Close)
        const backBtn = zoomOverlay.querySelector('#zoom-back-btn');
        backBtn.onclick = (e) => {
            e.stopPropagation();
            closeZoom();
        };

        // Click outside (backdrop): Close
        zoomOverlay.onclick = (e) => {
            if (e.target === zoomOverlay) {
                closeZoom();
            }
        };

        element.appendChild(zoomOverlay);
        isZoomed = true;

        // Hide thumbnail label when zoomed
        const label = imgContainer.querySelector('span');
        if (label) label.style.display = 'none';
    };

    // Thumbnail Click Handler
    if (imgContainer) {
        imgContainer.onclick = (e) => {
            e.stopPropagation();

            if (!isZoomed) {
                // First click: Zoom
                showPhotoZoom();
            }
        };
    }
}
