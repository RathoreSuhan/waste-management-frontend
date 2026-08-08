import { useState } from "react";
import { CornerDownRight, Trash2 } from "lucide-react";

import CommentForm from "@/components/comments/CommentForm";
import { formatRelativeTime } from "@/utils/formatters";

/**
 * ============================================================================
 * Comment Item
 * ============================================================================
 *
 * One comment and, beneath it, its replies - which are themselves comments,
 * so this component renders itself recursively to whatever depth the
 * backend returns.
 *
 * Indentation stops after a few levels. The backend allows unlimited
 * nesting, and without a cap a long thread would squeeze itself into a
 * sliver of the screen on a phone.
 * ============================================================================
 */

/** Indentation stops here; deeper replies stay readable instead */
const MAX_INDENT_DEPTH = 4;

export default function CommentItem({
    comment,
    // How deep this comment sits in the thread
    depth = 0,
    // Ids of comments this user is known to have written
    myCommentIds,
    // Admins may remove anyone's comment
    isAdmin,
    onReply,
    onDelete,
    // Id currently being deleted, used to disable that one row
    deletingId,
}) {
    const [replying, setReplying] = useState(false);

    // Deleting a parent removes its replies, so it asks first
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const replies = comment.replies || [];

    // Ownership is remembered locally; the backend still has final say
    const canDelete = isAdmin || myCommentIds.has(comment.id);

    const deleting = deletingId === comment.id;

    async function handleReply(message) {
        const succeeded = await onReply(comment.id, message);

        // Close the composer once the reply is in
        if (succeeded) {
            setReplying(false);
        }

        return succeeded;
    }

    return (
        <li
            className={
                // Nested comments get a thread line; top-level ones sit flush
                depth > 0
                    ? "border-l border-rule pl-3 sm:pl-4"
                    : ""
            }
        >
            <article className="py-3">

                <div className="flex items-start gap-2.5">

                    {/* Initial stands in for a profile picture */}
                    <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gov-navy text-xs font-semibold text-white"
                    >
                        {(comment.userName || "?").charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">

                        {/* Author and age */}
                        <p className="text-sm">
                            <span className="font-semibold text-ink">
                                {comment.userName || "Unknown user"}
                            </span>

                            <span className="text-ink-muted">
                                {" "}&bull;{" "}
                                {formatRelativeTime(comment.createdAt)}
                            </span>
                        </p>

                        {/* Comment text, preserving the author's line breaks */}
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">
                            {comment.message}
                        </p>

                        {/* Actions */}
                        <div className="mt-1.5 flex items-center gap-3">

                            <button
                                type="button"
                                onClick={() => setReplying((open) => !open)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gov-blue hover:underline"
                            >
                                <CornerDownRight size={11} aria-hidden="true" />
                                {replying ? "Cancel" : "Reply"}
                            </button>

                            {canDelete && !confirmingDelete && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmingDelete(true)}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-60"
                                >
                                    <Trash2 size={11} aria-hidden="true" />
                                    Delete
                                </button>
                            )}

                            {/* Spelling out the consequence before it happens */}
                            {confirmingDelete && (
                                <span className="inline-flex items-center gap-2 text-[11px]">
                                    <span className="text-ink-muted">
                                        {replies.length > 0
                                            ? "Delete this comment and all its replies?"
                                            : "Delete this comment?"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => onDelete(comment.id)}
                                        disabled={deleting}
                                        className="font-semibold text-red-700 hover:underline disabled:opacity-60"
                                    >
                                        {deleting ? "Deleting..." : "Yes"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setConfirmingDelete(false)}
                                        disabled={deleting}
                                        className="font-semibold text-ink-muted hover:underline"
                                    >
                                        No
                                    </button>
                                </span>
                            )}
                        </div>

                        {/* Reply composer */}
                        {replying && (
                            <div className="mt-2.5">
                                <CommentForm
                                    onSubmit={handleReply}
                                    placeholder={`Reply to ${comment.userName || "this comment"}...`}
                                    submitLabel="Post Reply"
                                    onCancel={() => setReplying(false)}
                                    compact
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>
            </article>

            {/* Replies - the same component, one level deeper */}
            {replies.length > 0 && (
                <ul className={depth < MAX_INDENT_DEPTH ? "ml-3 sm:ml-4" : ""}>
                    {replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            myCommentIds={myCommentIds}
                            isAdmin={isAdmin}
                            onReply={onReply}
                            onDelete={onDelete}
                            deletingId={deletingId}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}
