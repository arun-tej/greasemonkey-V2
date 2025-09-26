import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Heart, 
  HeartOff, 
  MessageCircle, 
  MoreHorizontal, 
  Users,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const PostCard = ({ post, onUpdate, onCommentClick }) => {
  const { user, API_BASE } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      await axios.post(`${API_BASE}/posts/${post.id}/vote`, {
        vote_type: voteType
      });
      
      // Refresh post data
      if (onUpdate) {
        onUpdate();
      }
      
      toast.success(`${voteType === 'like' ? 'Liked' : voteType === 'dislike' ? 'Disliked' : 'Vote removed'}`);
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to vote on post');
    }
    setIsVoting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API_BASE}/posts/${post.id}`);
      toast.success('Post deleted successfully');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete post');
    }
  };

  const isAuthor = user?.id === post.author_id;
  const userVote = post.user_vote;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author_profile_image} />
              <AvatarFallback>
                {post.author_full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{post.author_full_name}</span>
                <span className="text-muted-foreground text-sm">@{post.author_username}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.created_at)}</span>
                {post.garage_name && (
                  <>
                    <Users className="h-3 w-3" />
                    <span>{post.garage_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
        
        {/* Image gallery */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            post.image_urls.length === 1 ? 'grid-cols-1' : 
            post.image_urls.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 grid-rows-2'
          }`}>
            {post.image_urls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className={`relative rounded-lg overflow-hidden ${
                  post.image_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                }`}
              >
                <img
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover min-h-[200px]"
                />
                {post.image_urls.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{post.image_urls.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            {/* Like button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(userVote === 'like' ? 'remove' : 'like')}
              disabled={isVoting}
              className={`flex items-center space-x-1 ${
                userVote === 'like' ? 'text-red-500 hover:text-red-600' : ''
              }`}
            >
              <Heart className={`h-4 w-4 ${userVote === 'like' ? 'fill-current' : ''}`} />
              <span>{post.like_count || 0}</span>
            </Button>
            
            {/* Dislike button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(userVote === 'dislike' ? 'remove' : 'dislike')}
              disabled={isVoting}
              className={`flex items-center space-x-1 ${
                userVote === 'dislike' ? 'text-blue-500 hover:text-blue-600' : ''
              }`}
            >
              <HeartOff className={`h-4 w-4 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
              <span>{post.dislike_count || 0}</span>
            </Button>
            
            {/* Comments button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCommentClick && onCommentClick(post)}
              className="flex items-center space-x-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count || 0}</span>
            </Button>
          </div>
          
          {/* Score */}
          <div className="text-sm font-medium text-muted-foreground">
            Score: {post.score || 0}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;