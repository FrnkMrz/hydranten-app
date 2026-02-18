/**
 * Safely sets text content of an element.
 * Prevents XSS by avoiding innerHTML for user-generated content.
 * @param {string} elementId - The ID of the DOM element.
 * @param {string} text - The text to insert (will be escaped automatically).
 */
export function setText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text;
    } else {
        console.warn(`[SafeDOM] Element #${elementId} not found.`);
    }
}
