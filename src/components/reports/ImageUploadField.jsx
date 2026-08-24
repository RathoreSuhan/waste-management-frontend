import { useEffect, useMemo, useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import {
    IMAGE_ACCEPT_ATTRIBUTE,
    MAX_IMAGE_SIZE_LABEL,
} from "@/constants/reportConstants";
import { formatFileSize } from "@/utils/formatters";

/**
 * ==========================================================
 * Image Upload Field
 * ----------------------------------------------------------
 * Lets the citizen pick a garbage photo and preview it
 * before submitting.
 *
 * The backend validates this image with AI, so only the
 * formats supported by the AI pipeline are accepted here.
 *
 * Shared by four forms, and the photograph is mandatory in
 * only two of them - a cleaner's activity log takes a
 * text-only entry, and inspection evidence on a proposal is
 * encouraged rather than demanded - so `required` drives the
 * asterisk.
 * ==========================================================
 */

export default function ImageUploadField({
    file,
    onFileChange,
    error,
    // Defaults to true, so the forms that do demand a photo need no change
    required = true,
}) {

    // Reference to the file input (used to reset it)
    const inputRef = useRef(null);

    /**
     * Temporary browser URL used to preview the selected image.
     * Derived directly from the file, so no extra state is needed.
     */
    const previewUrl = useMemo(
        () => (file ? URL.createObjectURL(file) : ""),
        [file]
    );

    /**
     * Release the preview URL when the file changes or the
     * component unmounts, otherwise the browser leaks memory.
     */
    useEffect(() => {

        // Nothing was created for an empty selection
        if (!previewUrl) {
            return;
        }

        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    /**
     * Handle a new file selection
     */
    function handleChange(event) {

        // Pass the first selected file to the parent form
        const selectedFile = event.target.files?.[0] || null;

        onFileChange(selectedFile);
    }

    /**
     * Remove the currently selected image
     */
    function handleRemove() {

        // Clear the parent state
        onFileChange(null);

        // Reset the input so the same file can be chosen again
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return (
        <div className="space-y-1">

            {/* Field label - the asterisk appears only where a photo is required */}
            <label className="block text-sm font-semibold text-ink">
                Photographic Evidence
                {required && (
                    <span className="ml-0.5 text-red-700" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            {/* Upload area / preview area */}
            <div
                className={`
                    rounded-gov
                    border
                    border-dashed
                    p-4
                    transition
                    ${error ? "border-red-600 bg-red-50" : "border-rule bg-paper"}
                `}
            >
                {previewUrl ? (
                    // Selected image preview
                    <div className="flex items-center gap-4">
                        <img
                            src={previewUrl}
                            alt="Selected photograph of the reported waste"
                            className="h-28 w-28 rounded-gov border border-rule object-cover"
                        />

                        <div className="min-w-0 flex-1">
                            {/* File name */}
                            <p className="truncate text-sm font-semibold text-ink">
                                {file?.name}
                            </p>

                            {/* File size */}
                            <p className="mt-1 text-xs text-ink-muted">
                                {formatFileSize(file?.size)}
                            </p>

                            {/* Discard the selected photograph */}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline"
                            >
                                <Trash2 size={13} aria-hidden="true" />
                                Remove photograph
                            </button>
                        </div>
                    </div>
                ) : (
                    // Empty upload prompt
                    <div className="text-center">
                        <Camera
                            size={26}
                            className="mx-auto text-ink-muted"
                            aria-hidden="true"
                        />

                        <p className="mt-2 text-sm font-medium text-ink">
                            Attach a clear photograph of the waste
                        </p>

                        {/* Rules that match the backend limits */}
                        <p className="mt-1 text-xs text-ink-muted">
                            JPG, PNG or WEBP &bull; maximum {MAX_IMAGE_SIZE_LABEL}
                        </p>
                    </div>
                )}

                {/* Native file picker */}
                <input
                    ref={inputRef}
                    type="file"
                    accept={IMAGE_ACCEPT_ATTRIBUTE}
                    onChange={handleChange}
                    className="mt-4 block w-full text-sm text-ink-muted file:mr-4 file:rounded-gov file:border-0 file:bg-gov-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gov-blue-dark"
                />
            </div>

            {/* Validation error */}
            {error && (
                <p role="alert" className="text-xs font-medium text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}
