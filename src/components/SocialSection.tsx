import { useState, useEffect } from 'react';
import { UserPlus, Users, Mail, UserX, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFriends, getIncomingFriendRequests, unfollowUser } from '@/services/social';
import { Friend } from '@/types/social';
import { useAuth } from '@/contexts/AuthContext';
import { FriendSearchDialog } from './FriendSearchDialog';
import { FriendRequestsDialog } from './FriendRequestsDialog';
import { FriendWardrobeView } from './FriendWardrobeView';

export function SocialSection() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showRequestsDialog, setShowRequestsDialog] = useState(false);
  const [viewingFriend, setViewingFriend] = useState<{ id: string; username: string } | null>(null);

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
      setPendingRequestsCount(pendingRequests.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const handleUnfollow = async (friendId: string, friendUsername: string) => {
    if (!user) return;

    const confirmUnfollow = window.confirm(
      `Are you sure you want to remove ${friendUsername} from your friends?`
    );

    if (!confirmUnfollow) return;

    try {
      setUnfollowing(friendId);
      setError(null);
      await unfollowUser(user.uid, friendId);
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setUnfollowing(null);
    }
  };

  const handleDialogClose = () => {
    // Reload friends when dialogs close (in case new friends were added)
    loadFriends();
  };

  // If viewing a friend's wardrobe, show that view instead
  if (viewingFriend) {
    return (
      <FriendWardrobeView
        friendId={viewingFriend.id}
        friendUsername={viewingFriend.username}
        onBack={() => setViewingFriend(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Friends
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRequestsDialog(true)}
            className="relative"
          >
            <Mail className="h-4 w-4 mr-2" />
            Requests
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowSearchDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
            <p>Loading friends...</p>
          </div>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {friend.profilePictureUrl ? (
                    <img
                      src={friend.profilePictureUrl}
                      alt={friend.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-indigo-600 font-semibold text-lg">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Friend Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {friend.username}
                  </p>
                  {(friend.firstName || friend.lastName) && (
                    <p className="text-sm text-gray-600 truncate">
                      {friend.firstName} {friend.lastName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Friends since {new Date(friend.addedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingFriend({ id: friend.id, username: friend.username });
                    }}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfollow(friend.id, friend.username);
                    }}
                    disabled={unfollowing === friend.id}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    {unfollowing === friend.id ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">No friends yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start by searching for friends to connect with
            </p>
            <Button
              size="sm"
              onClick={() => setShowSearchDialog(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Find Friends
            </Button>
          </div>
        )}
      </div>

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
