import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Lock, Move, RotateCcw, Trash2, Upload, UserRound, X, ZoomIn, ZoomOut } from "lucide-react";

import AccountRecord from "@/components/account/AccountRecord";
import PageHeading from "@/components/common/PageHeading";
import PageContainer from "@/components/layout/PageContainer";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PROFILE_PICTURE_UPDATED_EVENT } from "@/constants/profileEvents";
import useAuth from "@/hooks/useAuth";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import { changePasswordSchema, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/schemas/authSchema";
import { CORPORATION_MAX_LENGTHS, municipalCorporationSchema } from "@/schemas/municipalCorporationSchema";
import {
    changePassword,
    deleteProfilePicture,
    getAccountRecord,
    getProfile,
    updateProfile,
    uploadProfilePicture,
} from "@/services/accountService";
import { getOwnMunicipalCorporation, updateOwnMunicipalCorporation } from "@/services/municipalCorporationService";
import { getErrorMessage } from "@/utils/errorMessage";

const MIN_ZOOM = 100;
const MAX_ZOOM = 250;
const ZOOM_STEP = 10;
const CROP_SIZE = 280;
const CROPPED_IMAGE_SIZE = 512;

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isMunicipalOfficer = user?.role === "ROLE_MUNICIPAL_OFFICER";
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [accountRecord, setAccountRecord] = useState(null);
    const [recordError, setRecordError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deletingPic, setDeletingPic] = useState(false);
    const [cropSource, setCropSource] = useState(null);
    const fileInputRef = useRef(null);
    const objectUrlsRef = useRef(new Set());
    const { register: profileRegister, handleSubmit: handleProfileSubmit, setValue: profileSetValue, formState: { errors: profileErrors } } = useForm({ defaultValues: { name: "" } });
    const { register: corporationRegister, handleSubmit: handleCorporationSubmit, reset: resetCorporation, formState: { errors: corporationErrors, isSubmitting: corporationSubmitting } } = useForm({ resolver: zodResolver(municipalCorporationSchema), defaultValues: { city: "", organizationName: "", phone: "", email: "" } });
    const { register: passwordRegister, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: passwordSubmitting } } = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    const createObjectUrl = useCallback((file) => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.add(url);
        return url;
    }, []);

    useEffect(() => () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    useEffect(() => {
        let active = true;
        if (isMunicipalOfficer) {
            getOwnMunicipalCorporation().then((data) => {
                if (active) resetCorporation(data);
            }).catch((error) => {
                if (active) setErrorMessage(getErrorMessage(error, "Your municipal corporation details could not be loaded."));
            });
            return () => { active = false; };
        }
        getProfile().then((data) => {
            if (!active) return;
            profileSetValue("name", data.name ?? "");
            setProfilePicUrl(data.profilePic ?? null);
        }).catch(() => {});
        getAccountRecord().then((data) => {
            if (!active) return;
            setAccountRecord(data);
            setRecordError("");
        }).catch((error) => {
            if (active) setRecordError(getErrorMessage(error, "Your account record could not be loaded."));
        });
        return () => { active = false; };
    }, [isMunicipalOfficer, profileSetValue, resetCorporation]);

    const emitProfilePictureUpdated = useCallback((profilePic) => {
        window.dispatchEvent(new CustomEvent(PROFILE_PICTURE_UPDATED_EVENT, { detail: { profilePic } }));
    }, []);

    const clearPendingPicture = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleFileChange = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Choose an image file for your profile picture.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setErrorMessage("");
        setSuccessMessage("");
        setCropSource({ file, url: createObjectUrl(file) });
    };

    const handleRemovePicture = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setDeletingPic(true);
        try {
            await deleteProfilePicture();
            setProfilePicUrl(null);
            clearPendingPicture();
            emitProfilePictureUpdated(null);
            setSuccessMessage("Profile picture removed successfully.");
        } catch (error) {
            setErrorMessage(getErrorMessage(error, "Unable to remove your profile picture."));
        } finally {
            setDeletingPic(false);
        }
    };

    const onProfileSubmit = async ({ name }) => {
        setErrorMessage("");
        setSuccessMessage("");
        setUploading(true);
        try {
            let profilePic = profilePicUrl;
            if (selectedFile) profilePic = await uploadProfilePicture(selectedFile);
            await updateProfile({ name, profilePic });
            setProfilePicUrl(profilePic || null);
            emitProfilePictureUpdated(profilePic || null);
            clearPendingPicture();
            setSuccessMessage("Profile updated successfully.");
        } catch (error) {
            setErrorMessage(getErrorMessage(error, "Unable to update your profile."));
        } finally {
            setUploading(false);
        }
    };

    const onCorporationSubmit = async (corporation) => {
        setErrorMessage("");
        setSuccessMessage("");
        try {
            const updatedCorporation = await updateOwnMunicipalCorporation(corporation);
            resetCorporation(updatedCorporation);
            if (updatedCorporation.email !== user?.email) {
                logout();
                navigate("/login", { replace: true, state: { municipalEmailUpdated: true } });
                return;
            }
            setSuccessMessage("Municipal corporation details saved successfully.");
        } catch (error) {
            setErrorMessage(getErrorMessage(error, "Unable to update municipal corporation details."));
        }
    };

    const onPasswordSubmit = async (passwordData) => {
        setErrorMessage("");
        setSuccessMessage("");
        try {
            const message = await changePassword(passwordData);
            setSuccessMessage(message || "Password changed successfully.");
            resetPassword();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, "Unable to change your password."));
        }
    };

    function handleProfileFormSubmit(event) {
        void handleProfileSubmit(onProfileSubmit)(event);
    }

    const activePreview = previewUrl || profilePicUrl;

    return (
        <PageContainer maxWidth="max-w-5xl" className="px-4 py-8 sm:px-6">
            <PageHeading title={isMunicipalOfficer ? "Municipal Corporation Profile" : "Profile"} titleHi={isMunicipalOfficer ? "नगर निगम प्रोफ़ाइल" : "प्रोफ़ाइल"} subtitle={isMunicipalOfficer ? "Manage the official details for your municipal corporation." : "Manage your profile, password, and record of platform activity."} />
            <div className="mt-5 space-y-4" aria-live="polite">
                {errorMessage && <Alert type="error">{errorMessage}</Alert>}
                {successMessage && <Alert type="success">{successMessage}</Alert>}
            </div>
            <div className="mt-6 space-y-6">
                {isMunicipalOfficer ? (
                    <form onSubmit={handleCorporationSubmit(onCorporationSubmit)} noValidate>
                        <fieldset className="rounded-gov border border-rule bg-white p-4 sm:p-5">
                            <legend className="px-2 text-sm font-semibold text-gov-navy">Municipal Corporation Details</legend>
                            <div className="space-y-4">
                                <Input label="City" required hint="Reports filed in this city are routed to your office." maxLength={CORPORATION_MAX_LENGTHS.city} error={corporationErrors.city} {...corporationRegister("city")} />
                                <Input label="Organisation Name" required maxLength={CORPORATION_MAX_LENGTHS.organizationName} error={corporationErrors.organizationName} {...corporationRegister("organizationName")} />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input label="Contact Number" required type="tel" maxLength={CORPORATION_MAX_LENGTHS.phone} error={corporationErrors.phone} {...corporationRegister("phone")} />
                                    <Input label="Email Address" required type="email" maxLength={CORPORATION_MAX_LENGTHS.email} error={corporationErrors.email} {...corporationRegister("email")} />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end"><Button type="submit" loading={corporationSubmitting} fullWidth={false}>Save Corporation Details</Button></div>
                        </fieldset>
                    </form>
                ) : (
                <form onSubmit={handleProfileFormSubmit} noValidate>
                    <fieldset className="rounded-gov border border-rule bg-white p-4 sm:p-5">
                        <legend className="px-2 text-sm font-semibold text-gov-navy">Profile Details</legend>
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                            <Input label="Full Name" hint="Your display name across Clean Bharat." error={profileErrors.name} {...profileRegister("name")} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-ink">Profile Picture</p>
                                <p className="mt-1 text-xs leading-relaxed text-ink-muted">Optional; crop a square image to personalise your account.</p>
                                <div className="mt-3 flex min-h-48 flex-col items-center justify-center rounded-gov border border-rule bg-paper/50 p-4 text-center">
                                    {activePreview ? (
                                        <>
                                            <img src={activePreview} alt="Profile picture preview" className="h-28 w-28 rounded-full border border-rule object-cover" />
                                            <p className="mt-3 text-xs text-ink-muted">{selectedFile ? "New cropped picture ready to save." : "Your current profile picture."}</p>
                                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || deletingPic} className="inline-flex items-center gap-1.5 rounded-gov border border-gov-blue bg-white px-3 py-2 text-xs font-semibold text-gov-blue transition hover:bg-gov-blue/5 disabled:cursor-not-allowed disabled:opacity-60"><Upload size={14} aria-hidden="true" />Replace</button>
                                                <button type="button" onClick={handleRemovePicture} disabled={uploading || deletingPic} className="inline-flex items-center gap-1.5 rounded-gov border border-red-700 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 size={14} aria-hidden="true" />{deletingPic ? "Removing…" : "Remove"}</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex h-28 w-28 items-center justify-center rounded-full border border-rule bg-white text-ink-muted"><UserRound size={40} aria-hidden="true" /></span>
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || deletingPic} className="mt-3 inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark disabled:cursor-not-allowed disabled:opacity-60"><Upload size={15} aria-hidden="true" />Choose picture</button>
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end"><Button type="submit" loading={uploading} fullWidth={false}>Save Profile</Button></div>
                    </fieldset>
                </form>
                )}

                <fieldset className="rounded-gov border border-rule bg-white p-4 sm:p-5">
                    <legend className="flex items-center gap-1.5 px-2 text-sm font-semibold text-gov-navy"><Lock size={14} aria-hidden="true" />Change Password</legend>
                    <form className="space-y-4" onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
                        <Input label="Current Password" type="password" autoComplete="current-password" required error={passwordErrors.currentPassword} {...passwordRegister("currentPassword")} />
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Input label="New Password" type="password" autoComplete="new-password" required hint={`Use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.`} maxLength={PASSWORD_MAX_LENGTH} error={passwordErrors.newPassword} {...passwordRegister("newPassword")} />
                            <Input label="Confirm New Password" type="password" autoComplete="new-password" required hint="Repeat the new password exactly." maxLength={PASSWORD_MAX_LENGTH} error={passwordErrors.confirmPassword} {...passwordRegister("confirmPassword")} />
                        </div>
                        <div className="flex justify-end pt-2"><Button type="submit" loading={passwordSubmitting} fullWidth={false}>Change Password</Button></div>
                    </form>
                </fieldset>
                {!isMunicipalOfficer && <section aria-labelledby="account-record-heading">
                    <h2 id="account-record-heading" className="sr-only">Account Record</h2>
                    {recordError && <Alert type="error">{recordError}</Alert>}
                    {accountRecord && <AccountRecord user={accountRecord} compact />}
                </section>
                }
            </div>
            {!isMunicipalOfficer && cropSource && <ProfilePictureCropDialog source={cropSource} onApply={({ file, url }) => { setSelectedFile(file); setPreviewUrl(url); setCropSource(null); }} onCancel={() => { setCropSource(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} createObjectUrl={createObjectUrl} />}
        </PageContainer>
    );
}

function ProfilePictureCropDialog({ source, onApply, onCancel, createObjectUrl }) {
    const [imageSize, setImageSize] = useState(null);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [applying, setApplying] = useState(false);
    const dragStartRef = useRef(null);
    const panelRef = useModalBehaviour(true, onCancel);
    const imageLayout = getImageLayout(imageSize, zoom);
    const constrain = useCallback((nextPosition, layout = imageLayout) => setPosition(clampPosition(nextPosition, layout)), [imageLayout]);
    const changeZoom = (nextZoom) => {
        const safeZoom = Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM);
        const nextLayout = getImageLayout(imageSize, safeZoom);
        setZoom(safeZoom);
        constrain(position, nextLayout);
    };
    const beginDrag = (event) => {
        if (!imageLayout) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStartRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, position };
    };
    const drag = (event) => {
        const start = dragStartRef.current;
        if (!start || start.pointerId !== event.pointerId) return;
        constrain({ x: start.position.x + event.clientX - start.clientX, y: start.position.y + event.clientY - start.clientY });
    };
    const endDrag = (event) => {
        if (dragStartRef.current?.pointerId === event.pointerId) dragStartRef.current = null;
    };
    const applyCrop = async () => {
        if (!imageSize || !imageLayout) return;
        setApplying(true);
        try {
            const file = await createCroppedImageFile(source.file, imageSize, imageLayout, position);
            onApply({ file, url: createObjectUrl(file) });
        } finally {
            setApplying(false);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
            <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="profile-picture-crop-title" className="my-auto w-full max-w-xl rounded-gov border border-rule bg-white shadow-lg outline-none">
                <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
                    <div><h2 id="profile-picture-crop-title" className="font-serif text-lg font-bold text-gov-navy">Crop Profile Picture</h2><p className="mt-0.5 text-sm text-ink-muted">Drag the image to frame your circular avatar.</p></div>
                    <button type="button" onClick={onCancel} aria-label="Cancel profile picture crop" className="-m-2 shrink-0 rounded-gov p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink"><X size={18} aria-hidden="true" /></button>
                </div>
                <div className="space-y-5 p-5">
                    <div className="flex justify-center">
                        <div className="relative h-[280px] w-[280px] touch-none overflow-hidden rounded-full border-2 border-white bg-slate-800 shadow-inner" onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}>
                            <img src={source.url} alt="Adjust profile picture crop" draggable="false" onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none" style={imageLayout ? { width: `${imageLayout.width}px`, height: `${imageLayout.height}px`, transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` } : undefined} />
                            <span className="pointer-events-none absolute inset-0 rounded-full border border-white/70" />
                        </div>
                    </div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted"><Move size={14} aria-hidden="true" />Drag to reposition</p>
                    <div>
                        <div className="flex items-center justify-between gap-3"><label htmlFor="profile-picture-crop-zoom" className="text-sm font-semibold text-ink">Zoom</label><output htmlFor="profile-picture-crop-zoom" className="text-sm font-semibold text-gov-navy">{zoom}%</output></div>
                        <div className="mt-2 flex items-center gap-3">
                            <button type="button" onClick={() => changeZoom(zoom - ZOOM_STEP)} disabled={zoom === MIN_ZOOM} aria-label="Zoom out" className="rounded-gov border border-rule bg-white p-2 text-gov-blue transition hover:border-gov-blue disabled:cursor-not-allowed disabled:opacity-50"><ZoomOut size={17} aria-hidden="true" /></button>
                            <input id="profile-picture-crop-zoom" type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={ZOOM_STEP} value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} className="w-full accent-gov-blue" />
                            <button type="button" onClick={() => changeZoom(zoom + ZOOM_STEP)} disabled={zoom === MAX_ZOOM} aria-label="Zoom in" className="rounded-gov border border-rule bg-white p-2 text-gov-blue transition hover:border-gov-blue disabled:cursor-not-allowed disabled:opacity-50"><ZoomIn size={17} aria-hidden="true" /></button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap justify-between gap-3 border-t border-rule bg-paper px-5 py-3">
                    <button type="button" onClick={() => { setZoom(MIN_ZOOM); setPosition({ x: 0, y: 0 }); }} disabled={zoom === MIN_ZOOM && position.x === 0 && position.y === 0} className="inline-flex items-center gap-1.5 rounded-gov px-2 py-2 text-sm font-semibold text-gov-blue underline disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw size={14} aria-hidden="true" />Reset</button>
                    <div className="flex gap-2"><button type="button" onClick={onCancel} disabled={applying} className="rounded-gov border border-rule bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue disabled:opacity-50">Cancel</button><button type="button" onClick={applyCrop} disabled={!imageLayout || applying} className="rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark disabled:cursor-not-allowed disabled:opacity-60">{applying ? "Applying…" : "Apply Crop"}</button></div>
                </div>
            </div>
        </div>
    );
}

function getImageLayout(imageSize, zoom) {
    if (!imageSize?.width || !imageSize?.height) return null;
    const scale = Math.max(CROP_SIZE / imageSize.width, CROP_SIZE / imageSize.height) * (zoom / 100);
    return { width: imageSize.width * scale, height: imageSize.height * scale };
}

function clampPosition(position, imageLayout) {
    if (!imageLayout) return { x: 0, y: 0 };
    const maxX = Math.max(0, (imageLayout.width - CROP_SIZE) / 2);
    const maxY = Math.max(0, (imageLayout.height - CROP_SIZE) / 2);
    return { x: Math.min(Math.max(position.x, -maxX), maxX), y: Math.min(Math.max(position.y, -maxY), maxY) };
}

async function createCroppedImageFile(sourceFile, imageSize, imageLayout, position) {
    const image = await createImageBitmap(sourceFile);
    const canvas = document.createElement("canvas");
    canvas.width = CROPPED_IMAGE_SIZE;
    canvas.height = CROPPED_IMAGE_SIZE;
    const visibleWidth = (CROP_SIZE / imageLayout.width) * imageSize.width;
    const visibleHeight = (CROP_SIZE / imageLayout.height) * imageSize.height;
    const sourceX = (imageSize.width - visibleWidth) / 2 - (position.x / imageLayout.width) * imageSize.width;
    const sourceY = (imageSize.height - visibleHeight) / 2 - (position.y / imageLayout.height) * imageSize.height;
    canvas.getContext("2d").drawImage(image, sourceX, sourceY, visibleWidth, visibleHeight, 0, 0, CROPPED_IMAGE_SIZE, CROPPED_IMAGE_SIZE);
    image.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error("Unable to prepare the cropped profile picture.");
    const baseName = sourceFile.name.replace(/\.[^/.]+$/, "") || "profile-picture";
    return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
}