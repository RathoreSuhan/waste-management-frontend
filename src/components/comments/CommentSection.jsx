import { useCallback, useState } from "react";
import { MessageSquare } from "lucide-react";

import CommentForm from "@/components/comments/CommentForm";
import CommentItem from "@/components/comments/CommentItem";

import useReports from "@/hooks/useReports";
import { useAuthContext } from "@/context/AuthContext";
import {
    addComment,
    addReply,
    deleteComment,
    getComments,
} from "@/services/commentService";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    forgetMyComment,
    getMyCommentIds,
    rememberMyComment,
} from "@/utils/myComments";

/**
 * ============================================================================
 * Comment Section (Phase 7)
 * ============================================================================
 *
 * Owns the discussion on a report: loading the thread, posting comments and
 * replies, and removing them.
 *
 * After every change the thread is reloaded from the backend rather than
 * patched in place. A reply can arrive at any depth and deleting a parent
 * takes its replies with it, so rebuilding from the server is both simpler
 * and always correct.
 * ============================================================================
 */

/**
 * Count every comment in the tree, replies included.
 */
function countComments(comments) {
    return comments.reduce(
        (total, comment) => total + 1 + countComments(comment.replies || []),
        0,
    );
}

export default function CommentSection({ reportId, onChanged }) {
    const { user } = useAuthContext();

    const isAdmin = user?.role === "ROLE_ADMIN";

    // Stable fetcher so the hook does not refetch on every render
    const fetchComments = useCallback(() => getComments(reportId), [reportId]);

    const {
        data: comments,
        loading,
        error,
        reload,
        refresh,
    } = useReports(fetchComments, []);


    // Failure of a write, kept apart from the loading error above
    const [actionError, setActionError] = useState("");

    // Comment currently being removed, so only that row is disabled
    const [deletingId, setDeletingId] = useState(null);

    // Comments written from this browser, used to decide who sees Delete
    const myCommentIds = getMyCommentIds(user?.email);

    /**
     * Refresh the thread, and let the page refresh the report too:
     * every comment changes the engagement score.
     *
     * The quiet refresh is deliberate - reloading would blank the thread
     * for a moment even though what is on screen is still perfectly valid.
     */
    async function syncAfterChange() {
        refresh();

        if (onChanged) {
            await onChanged();
        }
    }


    async function handleAddComment(message) {
        setActionError("");

        try {
            const created = await addComment(reportId, message);

            // Remember it so this user can delete it later
            rememberMyComment(user?.email, created.id);

            await syncAfterChange();


            return true;
        } catch (requestError) {
            setActionError(
                getErrorMessage(requestError, "Unable to post your comment."),
            );

            return false;
        }
    }

    async function handleAddReply(commentId, message) {
        setActionError("");

        try {
            const created = await addReply(commentId, message);

            rememberMyComment(user?.email, created.id);

            await syncAfterChange();


            return true;
        } catch (requestError) {
            setActionError(
                getErrorMessage(requestError, "Unable to post your reply."),
            );

            return false;
        }
    }

    async function handleDelete(commentId) {
        setActionError("");
        setDeletingId(commentId);

        try {
            await deleteComment(commentId);

            forgetMyComment(user?.email, commentId);

            await syncAfterChange();

        } catch (requestError) {
            // Ownership is remembered locally and can fall out of step with
            // the backend, so say plainly what happened.
            if (requestError?.response?.status === 403) {
                setActionError("You can only delete your own comments.");
            } else {
                setActionError(
                    getErrorMessage(requestError, "Unable to delete this comment."),
                );
            }
        } finally {
            setDeletingId(null);
        }
    }

    const total = countComments(comments || []);

    return (
        <section className="mt-6 rounded-gov border border-rule">

            {/* Header carries the running count */}
            <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper px-4 py-2">
                <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                    <MessageSquare size={12} aria-hidden="true" />
                    Community Discussion
                </h2>

                {total > 0 && (
                    <span className="text-[11px] font-semibold text-ink-muted">
                        {total} {total === 1 ? "message" : "messages"}
                    </span>
                )}
            </div>

            <div className="p-4">

                {/* Composer sits first so it is reachable without scrolling */}
                <CommentForm onSubmit={handleAddComment} />

                {actionError && (
                    <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                        {actionError}
                    </p>
                )}

                {/* Loading the thread */}
                {loading && (
                    <p className="mt-4 text-sm text-ink-muted">
                        Loading discussion...
                    </p>
                )}

                {/* The thread could not be loaded */}
                {!loading && error && (
                    <div className="mt-4">
                        <p className="text-sm text-red-700">{error}</p>

                        <button
                            type="button"
                            onClick={reload}
                            className="mt-1 text-xs font-semibold text-gov-blue hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Nobody has written anything yet */}
                {!loading && !error && total === 0 && (
                    <p className="mt-4 text-sm text-ink-muted">
                        No messages yet. Share what you know about this location -
                        local knowledge helps cleanup teams arrive prepared.
                    </p>
                )}

                {/* The thread */}
                {!loading && !error && total > 0 && (
                    <ul className="mt-2 divide-y divide-rule">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                myCommentIds={myCommentIds}
                                isAdmin={isAdmin}
                                onReply={handleAddReply}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
