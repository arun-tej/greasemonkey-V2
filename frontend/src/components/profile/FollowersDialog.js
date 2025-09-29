import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';

const FollowersDialog = ({ children, title, users = [] }) => {
  // Mock data for demo
  const mockUsers = [
    {
      id: 1,
      username: 'mike_rider',
      full_name: 'Mike Johnson',
      profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'Adventure rider from Colorado',
      isFollowing: true
    },
    {
      id: 2,
      username: 'sarah_bikes',
      full_name: 'Sarah Williams',
      profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b29c?w=150',
      bio: 'Track day enthusiast 🏁',
      isFollowing: false
    },
    {
      id: 3,
      username: 'alex_moto',
      full_name: 'Alex Chen',
      profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Custom bike builder',
      isFollowing: true
    },
    {
      id: 4,
      username: 'emma_rides',
      full_name: 'Emma Thompson',
      profile_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: 'Motorcycle photographer 📸',
      isFollowing: false
    },
    {
      id: 5,
      username: 'jake_wheels',
      full_name: 'Jake Martinez',
      profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Harley Davidson lover',
      isFollowing: true
    }
  ];

  const displayUsers = users.length > 0 ? users : mockUsers;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {displayUsers.length} {title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {displayUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold">
                      {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.full_name}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={user.isFollowing ? "outline" : "default"}
                  className={user.isFollowing ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : ""}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersDialog;