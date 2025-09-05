export type UserPreferences = {
  canvasSetupDismissed: boolean;
};

/**
 * User Preference Service Interface
 * Defines contract for managing user-specific preferences and settings
 */
export interface IUserPreferenceService {
  get(userId: string): Promise<UserPreferences>;
  update(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  reset(userId: string): Promise<UserPreferences>;
}
