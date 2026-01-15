export interface Wardrobe {
  id: string;
  name: string;
  userId?: string; // Owner's user ID for permission checks
  isShareable?: boolean; // If true, friends can view this wardrobe (default: false)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface WardrobeInput {
  name: string;
}

