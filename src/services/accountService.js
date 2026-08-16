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

    return response.data;
}