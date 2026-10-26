/**
 * Same-document notification emitted after the profile picture has been
 * persisted. Components that display the signed-in user's avatar can update
 * immediately without waiting for a route remount or a second API request.
 */
export const PROFILE_PICTURE_UPDATED_EVENT = "clean-bharat:profile-picture-updated";
