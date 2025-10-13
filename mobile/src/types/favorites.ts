/**
 * Favorites Type Definitions
 * Types for favorite people/contacts
 */

export interface FavoritePerson {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  priority: number;
  timezone?: string;
  supportMsg?: string;
  voiceNoteUrl?: string;
  videoNoteUrl?: string;
  photoUrl?: string;
  personaMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFavoritePersonData {
  name: string;
  relationship: string;
  priority: number;
  phoneNumber?: string;
  email?: string;
  timezone?: string;
  supportMsg?: string;
  description?: string;
}

export interface UpdateFavoritePersonData {
  name?: string;
  relationship?: string;
  priority?: number;
  phoneNumber?: string;
  email?: string;
  timezone?: string;
  supportMsg?: string;
}

export interface FavoritesListResponse {
  success: boolean;
  data: {
    favPeople: FavoritePerson[];
  };
}

export interface FavoritePersonResponse {
  success: boolean;
  data: {
    favoritePerson: FavoritePerson;
  };
}
