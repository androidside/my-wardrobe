import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Mail, Search, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFriends, getIncomingFriendRequests, unfollowUser } from '@/services/social';
import { Friend } from '@/types/social';
import { useAuth } from '@/contexts/AuthContext';
import { FriendSearchDialog } from './FriendSearchDialog';
import { FriendRequestsDialog } from './FriendRequestsDialog';

interface FriendsListViewProps {
  onViewFriend: (friendId: string, friendUsername: string) => void;
  onBack: () => void;
}

export function FriendsListView({ onViewFriend, onBack }: FriendsListViewProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showRequestsDialog, setShowRequestsDialog] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, [user]);

  useEffect(() => {
    // Filter friends based on search query
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = friends.filter(
        (friend) =>
          friend.username.toLowerCase().includes(query) ||
          friend.firstName?.toLowerCase().includes(query) ||
          friend.lastName?.toLowerCase().includes(query)
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const [friendsList, pendingRequests] = await Promise.all([
        getFriends(user.uid),
        getIncomingFriendRequests(user.uid),
      ]);
      setFriends(friendsList);
      setFilteredFriends(friendsList);
      setPendingRequestsCount(pendingRequests.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string, friendUsername: string) => {
    if (!user) return;

    const confirm = window.confirm(
      `Are you sure you want to remove ${friendUsername} from your friends?`
    );

    if (!confirm) return;

    try {
      setRemovingFriendId(friendId);
      setError(null);
      await unfollowUser(user.uid, friendId);
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setRemovingFriendId(null);
    }
  };

  const handleDialogClose = () => {
    // Reload friends when dialogs close (in case new friends were added)
    loadFriends();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">My Friends</h1>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          className="flex-1"
          onClick={() => setShowSearchDialog(true)}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add Friends
        </Button>
        <Button
          variant="outline"
          className="flex-1 relative"
          onClick={() => setShowRequestsDialog(true)}
        >
          <Mail className="h-5 w-5 mr-2" />
          Requests
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </Button>
      </div>

      {/* Search Bar */}
      {friends.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search friends by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Friends Grid */}
      {filteredFriends.length === 0 ? (
        <div className="text-center py-12">
          {friends.length === 0 ? (
            <>
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No friends yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start connecting with other users to share your wardrobes!
              </p>
              <Button onClick={() => setShowSearchDialog(true)}>
                <UserPlus className="h-5 w-5 mr-2" />
                Add Your First Friend
              </Button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No friends found
              </h3>
              <p className="text-gray-600">
                Try searching with a different name or username
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 flex flex-col items-center"
            >
              {/* Profile Picture */}
              <div className="relative w-20 h-20 mb-3">
                {friend.profilePictureUrl ? (
                  <img
                    src={friend.profilePictureUrl}
                    alt={friend.username}
                    className="w-full h-full rounded-full object-cover border-2 border-indigo-500"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border-2 border-indigo-500">
                    <span className="text-white text-2xl font-bold">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="text-center mb-3 w-full">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  @{friend.username}
                </p>
                {(friend.firstName || friend.lastName) && (
                  <p className="text-xs text-gray-600 truncate">
                    {friend.firstName} {friend.lastName}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => onViewFriend(friend.userId, friend.username)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-2"
                  onClick={() => handleRemoveFriend(friend.userId, friend.username)}
                  disabled={removingFriendId === friend.userId}
                >
                  <UserX className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends Count */}
      {filteredFriends.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          {searchQuery
            ? `Showing ${filteredFriends.length} of ${friends.length} friends`
            : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'} total`}
        </div>
      )}

      {/* Dialogs */}
      <FriendSearchDialog
        open={showSearchDialog}
        onOpenChange={(open) => {
          setShowSearchDialog(open);
          if (!open) handleDialogClose();
        }}
      />

      <FriendRequestsDialog
        open={showRequestsDialog}
        onOpenChange={(open) => {
          setShowRequestsDialog(open);
          if (!open) handleDialogClose();
        }}
      />
    </div>
  );
}
