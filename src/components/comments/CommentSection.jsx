import { useCallback, useMemo, useRef, useState } from "react";

import { MessageSquare } from "lucide-react";

import CommentForm from "@/components/comments/CommentForm";
import CommentItem from "@/components/comments/CommentItem";
import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";
import Pagination from "@/components/common/Pagination";
import usePagination from "@/hooks/usePagination";



import useReports from "@/hooks/useReports";
import { useAuthContext } from "@/hooks/useAuthContext";

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

    /*
      Reports are public, so the thread is read by people without an
      account. They see the composer and the Reply buttons, and are asked
      to sign in when they try to submit - the alternative, hiding the
      composer, gives no clue that taking part is possible at all.
    */
    const isGuest = !user;

    /*
      A Municipal Corporation account cannot join the discussion: its email is
      held in municipal_corporation, so CommentServiceImpl finds no user row to
      attribute the message to and refuses with "User not found" - a true but
      unhelpful thing to show an officer. Caught before the request instead.
    */
    const isMunicipal = user?.role === "ROLE_MUNICIPAL_OFFICER";

    /*
      What the blocked reader was trying to do, or null when the dialog is
      closed. One piece of state covers both the composer and every Reply
      button, so the wording stays specific without a flag per control - and
      it serves a guest and a municipal account alike, since only one of the
      two can ever be true of the same session.
    */
    const [loginPromptAction, setLoginPromptAction] = useState(null);


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

        /*
          Returning false leaves the typed message in the composer, so it is
          still there when a guest comes back from signing in - and is not
          thrown away on a request the backend was always going to refuse.

          One guard for both: the dialog reads isMunicipal itself and chooses
          between inviting them to sign in and explaining the restriction.
        */
        if (isGuest || isMunicipal) {
            setLoginPromptAction("post a comment on this report");
            return false;
        }

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

        // Same treatment as a new comment - the reply text is preserved
        if (isGuest || isMunicipal) {
            setLoginPromptAction("reply to this discussion");
            return false;
        }

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

    // Every message in the thread, replies included
    const total = countComments(comments || []);

    /*
      Newest first, the way a reader expects a discussion to open - the
      most recent remark at the top rather than buried under everything
      said before it, matching the ordering of every familiar comment
      thread.

      Only the top-level comments are reordered. Replies keep the
      chronological order the backend returns them in, so a back-and-forth
      under one comment still reads top to bottom.

      A copy is sorted rather than the array itself: the fetched list is
      shared state, and sorting in place would mutate it. Memoised so the
      sort runs only when the thread actually changes, not on every render.
    */
    const sortedComments = useMemo(() => {
        return [...(comments || [])].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
    }, [comments]);

    /*
      Only top-level comments are paged. Replies stay with their parent,
      so a thread never has its answers stranded on another page.
    */
    const {
        page,
        pageItems: pageComments,
        totalPages,
        total: topLevelTotal,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(sortedComments);


    // Anchor for the jump back to the top of the thread
    const threadTopRef = useRef(null);


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
                    <>
                        <ul ref={threadTopRef} className="mt-2 divide-y divide-rule">
                            {pageComments.map((comment) => (
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

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={topLevelTotal}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            onPageChange={goToPage}
                            itemLabel="comments"
                            scrollTargetRef={threadTopRef}
                        />
                    </>
                )}

            </div>

            {/* Shown when a guest, or a municipal account, tries to comment or reply */}
            <LoginRequiredDialog
                open={Boolean(loginPromptAction)}
                onClose={() => setLoginPromptAction(null)}
                action={loginPromptAction}
                municipalAccount={isMunicipal}
                currentRole={user?.role}
            />
        </section>
    );
}


