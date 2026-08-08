import { useState } from "react";

import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

/**
 * ============================================================================
 * Comment Form
 * ============================================================================
 *
 * Shared composer for both a new discussion point and a reply.
 * The parent owns the API call, so this component only gathers text and
 * reports whether the submission succeeded.
 * ============================================================================
 */

/** Guard rail so a stray keypress cannot fill the database */
const MAX_LENGTH = 1000;

export default function CommentForm({
    // Called with the trimmed text - should resolve true when it worked
    onSubmit,
    placeholder = "Share what you know about this location...",
    submitLabel = "Post Comment",
    // Replies render a lighter form and can be dismissed
    compact = false,
    onCancel,
    autoFocus = false,
}) {
    const [message, setMessage] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    // Whitespace alone is not a comment
    const trimmed = message.trim();

    async function handleSubmit(event) {
        event.preventDefault();

        if (!trimmed) {
            setError("Please write a message before posting.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const succeeded = await onSubmit(trimmed);

            // Keep the text on failure so nothing typed is lost
            if (succeeded) {
                setMessage("");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">

            <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={placeholder}
                rows={compact ? 2 : 3}
                maxLength={MAX_LENGTH}
                autoFocus={autoFocus}
                aria-label={submitLabel}
                error={error ? { message: error } : undefined}
            />

            <div className="flex items-center justify-between gap-3">

                {/* Counter appears only as the limit comes into view */}
                <p className="text-[11px] text-ink-muted">
                    {message.length > MAX_LENGTH - 100
                        ? `${MAX_LENGTH - message.length} characters left`
                        : ""}
                </p>

                <div className="flex items-center gap-2">

                    {onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth={false}
                            onClick={onCancel}
                            disabled={submitting}
                            className="px-3 py-1.5 text-xs"
                        >
                            Cancel
                        </Button>
                    )}

                    <Button
                        type="submit"
                        fullWidth={false}
                        loading={submitting}
                        // Nothing to post until something is typed
                        disabled={!trimmed}
                        className={compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
