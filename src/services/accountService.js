import axiosClient from "@/api/axiosClient";
import { ACCOUNT_API } from "@/constants/apiConstants";

/**
 * Change the password for the currently authenticated account.
 *
 * @param {Object} passwordData
 * @param {string} passwordData.currentPassword
 * @param {string} passwordData.newPassword
 * @param {string} passwordData.confirmPassword
 * @returns Backend SuccessResponse { message, timestamp }
 */
export async function changePassword(passwordData) {
    const response = await axiosClient.patch(
        `${ACCOUNT_API}/password`,
        passwordData
    );

    return response.data.message;
}

/**
 * Request a password-recovery OTP for the currently authenticated account.
 *
 * The backend sends the six-digit code to the account's own registered
 * email - there is no address parameter, so a request can never aim the
 * code at another account.
 *
 * @returns Backend SuccessResponse { message, timestamp }
 */
export async function requestPasswordResetOtp() {
    const response = await axiosClient.post(
        `${ACCOUNT_API}/password/recovery/otp`
    );

    return response.data;
}

/**
 * Verify the six-digit recovery code. On success the backend consumes the
 * code and issues a short-lived, single-use reset token.
 *
 * @param {string} code - the six digits from the email
 * @returns Backend PasswordResetTokenResponse { resetToken, message, timestamp }
 */
export async function verifyPasswordResetOtp(code) {
    const response = await axiosClient.post(
        `${ACCOUNT_API}/password/recovery/verify`,
        { code }
    );

    return response.data;
}

/**
 * Confirm the recovery: spend the reset token and set the new password.
 * No current password is required - the verified OTP is the proof.
 *
 * @param {Object} recoveryData
 * @param {string} recoveryData.resetToken  - from verifyPasswordResetOtp
 * @param {string} recoveryData.newPassword
 * @param {string} recoveryData.confirmPassword
 * @returns Backend SuccessResponse { message, timestamp }
 */
export async function confirmPasswordReset(recoveryData) {
    const response = await axiosClient.post(
        `${ACCOUNT_API}/password/recovery/confirm`,
        recoveryData
    );

    return response.data.message;
}

/**
 * Fetch the profile of the currently authenticated account.
 *
 * @returns Backend UserProfileResponse { name, email, profilePic, role }
 */
export async function getProfile() {
    const response = await axiosClient.get(`${ACCOUNT_API}/profile`);
    return response.data;
}

/**
 * Fetch the signed-in user's own identity and platform activity record.
 *
 * @returns Backend UserDetailsResponse for the authenticated account only
 */
export async function getAccountRecord() {
    const response = await axiosClient.get(`${ACCOUNT_API}/record`);
    return response.data;
}

/**
 * Upload a profile picture file to Cloudinary and return the secure URL.
 *
 * @param {File} file - image file selected by the user
 * @returns {string} Cloudinary secure URL of the uploaded image
 */
export async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post(
        `${ACCOUNT_API}/profile-picture`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data.message;
}

/**
 * Update the profile of the currently authenticated account.
 *
 * @param {Object} profileData
 * @param {string} [profileData.name] - optional new name
 * @param {string} [profileData.profilePic] - optional Cloudinary secure URL
 * @returns Backend SuccessResponse { message, timestamp }
 */
export async function updateProfile(profileData) {
    const response = await axiosClient.put(
        `${ACCOUNT_API}/profile`,
        profileData
    );

    return response.data;
}

/**
 * Delete the profile picture of the currently authenticated account.
 * Removes the image from Cloudinary and sets profilePic to null.
 *
 * @returns Backend SuccessResponse { message, timestamp }
 */
export async function deleteProfilePicture() {
    const response = await axiosClient.delete(`${ACCOUNT_API}/profile-picture`);
    return response.data;
}