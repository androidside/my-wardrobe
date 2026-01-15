import { useState, useEffect } from 'react';
import { Check, X, Clock, UserCheck, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  getIncomingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/services/social';
import { FriendRequest } from '@/types/social';
import { useAuth } from '@/contexts/AuthContext';

interface FriendRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'incoming' | 'sent';

export function FriendRequestsDialog({ open, onOpenChange }: FriendRequestsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null); // requestId being processed
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const [incoming, sent] = await Promise.all([
        getIncomingFriendRequests(user.uid),
        getSentFriendRequests(user.uid),
      ]);
      setIncomingRequests(incoming);
      setSentRequests(sent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadRequests();
    }
  }, [open, user]);

  const handleAccept = async (requestId: string, fromUsername: string) => {
    if (!user) return;

    try {
      setProcessing(requestId);
      setError(null);
      setSuccessMessage(null);
      await acceptFriendRequest(user.uid, requestId);
      setSuccessMessage(`You are now friends with ${fromUsername}`);
      
      // Remove from incoming requests
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, fromUsername: string) => {
    if (!user) return;

    try {
      setProcessing(requestId);
      setError(null);
      setSuccessMessage(null);
      await rejectFriendRequest(user.uid, requestId);
      setSuccessMessage(`Declined request from ${fromUsername}`);
      
      // Remove from incoming requests
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject friend request');
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setSuccessMessage(null);
      setActiveTab('incoming');
    }
    onOpenChange(newOpen);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Friend Requests</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'incoming'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="h-4 w-4" />
                Received ({incomingRequests.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sent'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Sent ({sentRequests.length})
              </div>
            </button>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
                <p>Loading requests...</p>
              </div>
            ) : activeTab === 'incoming' ? (
              // Incoming Requests
              incomingRequests.length > 0 ? (
                incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {request.fromProfilePictureUrl ? (
                        <img
                          src={request.fromProfilePictureUrl}
                          alt={request.fromUsername}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-300">
                          <span className="text-indigo-600 font-semibold text-lg">
                            {request.fromUsername.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {request.fromUsername}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id, request.fromUsername)}
                        disabled={processing === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id, request.fromUsername)}
                        disabled={processing === request.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No pending friend requests</p>
                  <p className="text-sm mt-1">Requests from other users will appear here</p>
                </div>
              )
            ) : (
              // Sent Requests
              sentRequests.length > 0 ? (
                sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Profile Picture - placeholder since we don't have recipient's photo */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <span className="text-gray-600 font-semibold text-lg">
                          {request.toUserId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        Request to user
                      </p>
                      <p className="text-xs text-gray-500">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No sent friend requests</p>
                  <p className="text-sm mt-1">Requests you send will appear here</p>
                </div>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
