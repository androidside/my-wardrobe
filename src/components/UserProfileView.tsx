import { useState, useEffect } from 'react';
import { Settings, Users, ArrowLeft, LogOut, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserProfile, getPublicUserProfile, getWardrobes } from '@/services/firestore';
import { getFriends, getFriendWardrobes } from '@/services/social';
import { wardrobeStorageService } from '@/services/wardrobeStorage';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/profile';
import { Wardrobe } from '@/types/wardrobe';
import { ClothingItem, ClothingCategory } from '@/types/clothing';

interface UserProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
  onNavigateToFriends?: () => void;
  onNavigateToSettings?: () => void;
  onViewFriendWardrobe?: (wardrobeId: string, wardrobeName: string) => void;
  onRemoveFriend?: () => void;
  onBack?: () => void;
}

interface CategoryStats {
  Tops: number;
  Bottoms: number;
  Footwear: number;
  Outerwear: number;
  Accessories: number;
}

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  Tops: '👕',
  Bottoms: '👖',
  Footwear: '👟',
  Outerwear: '🧥',
  Accessories: '👜',
};

export function UserProfileView({
  userId,
  isOwnProfile,
  onNavigateToFriends,
  onNavigateToSettings,
  onViewFriendWardrobe,
  onRemoveFriend,
  onBack,
}: UserProfileViewProps) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    Tops: 0,
    Bottoms: 0,
    Footwear: 0,
    Outerwear: 0,
    Accessories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [userId, isOwnProfile]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const profileData = isOwnProfile
        ? await getUserProfile(userId)
        : await getPublicUserProfile(userId);

      if (!profileData) {
        setError('Profile not found');
        return;
      }
      setProfile(profileData);

      // Load wardrobes
      const wardrobesList = isOwnProfile
        ? await getWardrobes(userId)
        : await getFriendWardrobes(userId);
      setWardrobes(wardrobesList);

      // Calculate stats
      let itemsCount = 0;
      const catStats: CategoryStats = {
        Tops: 0,
        Bottoms: 0,
        Footwear: 0,
        Outerwear: 0,
        Accessories: 0,
      };

      for (const wardrobe of wardrobesList) {
        const items = await wardrobeStorageService.getAllItems(userId, wardrobe.id);
        itemsCount += items.length;

        // Count by category
        items.forEach((item: ClothingItem) => {
          if (item.category && catStats[item.category] !== undefined) {
            catStats[item.category]++;
          }
        });
      }

      setTotalItems(itemsCount);
      setCategoryStats(catStats);

      // Load friends count
      const friends = await getFriends(userId);
      setFriendsCount(friends.length);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to logout?');
    if (confirm) {
      await logout();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center px-4">
          <p className="text-red-600 font-medium mb-4">{error || 'Profile not found'}</p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.firstName || profile.lastName || 'User';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header with Back and Settings */}
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        {isOwnProfile && onNavigateToSettings && (
          <Button variant="ghost" size="sm" onClick={onNavigateToSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <div className="text-center mb-6">
        {/* Profile Picture */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          {profile.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border-4 border-indigo-500"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-4 border-indigo-500">
              <span className="text-white text-4xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Username and Name */}
        {profile.username && (
          <h2 className="text-xl font-semibold text-indigo-600 mb-1">
            @{profile.username}
          </h2>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{totalItems}</div>
          <div className="text-sm text-gray-600">Items</div>
        </div>
        <div
          className={`bg-white rounded-lg shadow p-4 text-center ${
            isOwnProfile && onNavigateToFriends ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
          }`}
          onClick={isOwnProfile && onNavigateToFriends ? onNavigateToFriends : undefined}
        >
          <div className="text-3xl font-bold text-indigo-600">{friendsCount}</div>
          <div className="text-sm text-gray-600">Friends</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{wardrobes.length}</div>
          <div className="text-sm text-gray-600">Wardrobes</div>
        </div>
      </div>

      {/* Wardrobe Overview by Category */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Wardrobe Overview
          </h3>
          <div className="space-y-3">
            {(Object.keys(categoryStats) as ClothingCategory[]).map((category) => {
              const count = categoryStats[category];
              if (count === 0) return null;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                    <span className="text-gray-700 font-medium">{category}</span>
                  </div>
                  <span className="text-indigo-600 font-semibold">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wardrobes Section */}
      {wardrobes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🗂️</span>
            {isOwnProfile ? 'My Wardrobes' : 'Shared Wardrobes'}
          </h3>
          <div className="space-y-3">
            {wardrobes.map((wardrobe) => (
              <div
                key={wardrobe.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{wardrobe.name}</span>
                    {wardrobe.isShareable && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Shared
                      </span>
                    )}
                  </div>
                  {/* Item count will be added in future enhancement */}
                </div>
                {!isOwnProfile && onViewFriendWardrobe && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewFriendWardrobe(wardrobe.id, wardrobe.name)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {isOwnProfile && onNavigateToFriends && (
          <Button
            className="w-full"
            variant="outline"
            size="lg"
            onClick={onNavigateToFriends}
          >
            <Users className="h-5 w-5 mr-2" />
            View All Friends
          </Button>
        )}

        {!isOwnProfile && onRemoveFriend && (
          <Button
            className="w-full"
            variant="destructive"
            size="lg"
            onClick={async () => {
              const confirm = window.confirm(
                `Are you sure you want to remove ${profile.username || displayName} from your friends?`
              );
              if (confirm) {
                await onRemoveFriend();
              }
            }}
          >
            Remove Friend
          </Button>
        )}

        {isOwnProfile && (
          <Button
            className="w-full"
            variant="outline"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
