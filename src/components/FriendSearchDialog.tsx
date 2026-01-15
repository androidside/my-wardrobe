import { useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchUsersByUsername, sendFriendRequest, followUserDirectly } from '@/services/social';
import { UserSearchResult } from '@/types/social';
import { useAuth } from '@/contexts/AuthContext';

interface FriendSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendSearchDialog({ open, onOpenChange }: FriendSearchDialogProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // userId being processed
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSuccessMessage(null);
      const results = await searchUsersByUsername(searchTerm.trim());
      
      // Filter out current user from results
      const filteredResults = results.filter((result) => result.userId !== user?.uid);
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        setError('No users found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;

    try {
      setLoading(targetUserId);
      setError(null);
      setSuccessMessage(null);
      await sendFriendRequest(user.uid, targetUserId);
      setSuccessMessage(`Friend request sent to ${targetUsername}`);
      
      // Remove from results after successful request
      setSearchResults((prev) => prev.filter((result) => result.userId !== targetUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setLoading(null);
    }
  };

  const handleFollow = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;

    try {
      setLoading(targetUserId);
      setError(null);
      setSuccessMessage(null);
      await followUserDirectly(user.uid, targetUserId);
      setSuccessMessage(`You are now following ${targetUsername}`);
      
      // Remove from results after successful follow
      setSearchResults((prev) => prev.filter((result) => result.userId !== targetUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to follow user');
    } finally {
      setLoading(null);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSearchTerm('');
      setSearchResults([]);
      setError(null);
      setSuccessMessage(null);
    }
    onOpenChange(newOpen);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search for Friends</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || searchTerm.trim().length < 2}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              ✓ {successMessage}
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={result.userId}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {result.profilePictureUrl ? (
                      <img
                        src={result.profilePictureUrl}
                        alt={result.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-300">
                        <span className="text-indigo-600 font-semibold text-lg">
                          {result.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {result.username}
                    </p>
                    {(result.firstName || result.lastName) && (
                      <p className="text-sm text-gray-600 truncate">
                        {result.firstName} {result.lastName}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {result.allowDirectFollow ? (
                      <Button
                        size="sm"
                        onClick={() => handleFollow(result.userId, result.username)}
                        disabled={loading === result.userId}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        {loading === result.userId ? 'Following...' : 'Follow'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(result.userId, result.username)}
                        disabled={loading === result.userId}
                        variant="outline"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {loading === result.userId ? 'Sending...' : 'Request'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              !searching &&
              searchTerm.trim() && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No results found</p>
                  <p className="text-sm mt-1">Try searching for a different username</p>
                </div>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
