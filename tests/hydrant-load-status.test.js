import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHydrantLoadStatus } from '../src/components/hydrant-load-status.js';

describe('Hydrant data load status', () => {
    let root;

    beforeEach(() => {
        vi.useFakeTimers();
        root = document.createElement('div');
        root.className = 'hidden';
        document.body.appendChild(root);
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('stays hidden for a fast successful request', () => {
        const status = createHydrantLoadStatus(root);

        status.setLoading();
        vi.advanceTimersByTime(300);
        status.setSuccess();

        expect(root.classList.contains('hidden')).toBe(true);
    });

    it('shows loading, slow and success states in sequence', () => {
        const status = createHydrantLoadStatus(root);

        status.setLoading();
        vi.advanceTimersByTime(500);
        expect(root.dataset.state).toBe('loading');

        vi.advanceTimersByTime(5500);
        expect(root.dataset.state).toBe('slow');

        status.setSuccess();
        expect(root.dataset.state).toBe('success');

        vi.advanceTimersByTime(1600);
        expect(root.classList.contains('hidden')).toBe(true);
    });

    it('keeps an error visible and offers a retry', () => {
        const onRetry = vi.fn();
        const status = createHydrantLoadStatus(root, onRetry);

        status.setError({ hasCachedData: true });

        expect(root.dataset.state).toBe('error');
        document.getElementById('hydrant-data-retry').click();
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
