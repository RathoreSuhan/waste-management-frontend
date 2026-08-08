import { useEffect, useMemo, useRef } from "react";
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
 * ==========================================================
 */

export default function ImageUploadField({ file, onFileChange, error }) {

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

            {/* Field label */}
            <label className="block text-sm font-medium text-gray-700">
                Garbage Photo
            </label>

            {/* Upload area / preview area */}
            <div
                className={`
                    rounded-xl
                    border-2
                    border-dashed
                    p-4
                    transition
                    ${error ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50"}
                `}
            >
                {previewUrl ? (
                    // Selected image preview
                    <div className="flex items-center gap-4">
                        <img
                            src={previewUrl}
                            alt="Selected garbage"
                            className="h-28 w-28 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                            {/* File name */}
                            <p className="truncate text-sm font-medium text-slate-800">
                                {file?.name}
                            </p>

                            {/* File size */}
                            <p className="mt-1 text-xs text-slate-500">
                                {formatFileSize(file?.size)}
                            </p>

                            {/* Remove selected image */}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="mt-2 text-sm font-medium text-red-600 hover:underline"
                            >
                                Remove photo
                            </button>
                        </div>
                    </div>
                ) : (
                    // Empty upload prompt
                    <div className="text-center">
                        <div className="text-3xl">📷</div>

                        <p className="mt-2 text-sm text-slate-600">
                            Upload a clear photo of the garbage
                        </p>

                        {/* Rules that match the backend limits */}
                        <p className="mt-1 text-xs text-slate-400">
                            JPG, PNG or WEBP • up to {MAX_IMAGE_SIZE_LABEL}
                        </p>
                    </div>
                )}

                {/* Native file picker */}
                <input
                    ref={inputRef}
                    type="file"
                    accept={IMAGE_ACCEPT_ATTRIBUTE}
                    onChange={handleChange}
                    className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                />
            </div>

            {/* Validation error */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
