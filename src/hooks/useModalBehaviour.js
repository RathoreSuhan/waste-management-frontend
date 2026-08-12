import { useEffect, useRef } from "react";

/**
 * ============================================================================
 * useModalBehaviour
 * ============================================================================
 *
 * The four things every modal layer on this site has to do, in one place.
 *
 *   1. Escape closes it.
 *   2. The page behind cannot be scrolled while it is open.
 *   3. Focus moves into the panel when it opens.
 *   4. Tab is kept inside the panel, and focus returns to whatever opened
 *      it once it closes.
 *
 * LoginRequiredDialog already did all of this by hand. ConfirmDialog and
 * CleanupUploadDialog did none of it - so a keyboard reader could tab out
 * of a delete confirmation into a page they could not see, and Escape did
 * nothing on either. Writing it a fourth time invites a fourth variation,
 * so it lives here instead.
 *
 * Returns a ref to attach to the panel element. The element needs
 * tabIndex={-1} for step 3 to work, since a plain <div> cannot hold focus.
 *
 * Usage:
 *     const panelRef = useModalBehaviour(open, onClose);
 *     ...
 *     <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true">
 *
 * @param {boolean}  open      Whether the layer is currently shown
 * @param {Function} onClose   Called on Escape. Should be a stable reference.
 * @param {Object}   [options]
 * @param {boolean}  [options.closeOnEscape=true]
 *        Set false for a step that must be dismissed deliberately - an
 *        upload in progress, for instance, where a stray Escape would
 *        throw away work already done.
 */

// Everything that can hold focus inside a panel. Negative tabindex is
// excluded: those are focus targets for scripts, not for the Tab key.
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function useModalBehaviour(open, onClose, options = {}) {

    const { closeOnEscape = true } = options;

    // The panel element, returned to the caller
    const panelRef = useRef(null);

    // Whatever held focus before opening, so it can be handed back
    const previouslyFocused = useRef(null);

    useEffect(() => {
        if (!open) return;

        previouslyFocused.current = document.activeElement;

        function handleKeyDown(event) {

            if (event.key === "Escape" && closeOnEscape) {
                onClose?.();
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = panelRef.current?.querySelectorAll(
                FOCUSABLE_SELECTOR
            );

            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];

            const last = focusable[focusable.length - 1];

            /*
              Wrap at both ends. Without this the reader tabs past the last
              control into the page behind, which the backdrop has covered -
              focus is then somewhere they cannot see and cannot get back
              from without a mouse.
            */
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        /*
          Freeze the page behind. Restored to whatever it was rather than
          to "", so a second layer opening over a first does not unfreeze
          the page when only the inner one closes.
        */
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        /*
          Move focus in. Prefer the first control over the panel itself, so
          a screen reader lands on something actionable rather than on an
          empty container.
        */
        const firstControl = panelRef.current?.querySelector(FOCUSABLE_SELECTOR);

        if (firstControl instanceof HTMLElement) {
            firstControl.focus();
        } else {
            panelRef.current?.focus();
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);

            document.body.style.overflow = previousOverflow;

            /*
              Hand focus back to the trigger. Guarded because the element
              may have been removed from the page in the meantime - a row
              delete button, for instance, disappears with its row.
            */
            if (
                previouslyFocused.current instanceof HTMLElement &&
                document.contains(previouslyFocused.current)
            ) {
                previouslyFocused.current.focus();
            }
        };
    }, [open, onClose, closeOnEscape]);

    return panelRef;
}
