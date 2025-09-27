import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  Share,
  MoreHorizontal, 
  Users,
  Calendar,
  Bookmark,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const PostCard = ({ post, onUpdate, onCommentClick, compact = false }) => {
  const { user, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [isVoting, setIsVoting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? 'now' : `${minutes}m`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    
    // Older
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      await axios.post(`${API_BASE}/posts/${post.id}/vote`, {
        vote_type: voteType
      });
      
      if (onUpdate) {
        onUpdate();
      }
      
      toast.success(`${voteType === 'like' ? 'Upvoted' : voteType === 'dislike' ? 'Downvoted' : 'Vote removed'}`);
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

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success('Post link copied to clipboard!');
  };

  const isAuthor = user?.id === post.author_id;
  const userVote = post.user_vote;
  const voteScore = (post.like_count || 0) - (post.dislike_count || 0);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-amber-500 bg-white/90 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="flex">
          {/* Left side - Voting (Reddit style) */}
          <div className="flex flex-col items-center justify-start p-4 bg-gradient-to-b from-gray-50 to-amber-50/30 min-w-[60px] border-r border-amber-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(userVote === 'like' ? 'remove' : 'like')}
              disabled={isVoting}
              className={`p-1 h-8 w-8 mb-1 ${
                userVote === 'like' 
                  ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' 
                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            
            <div className={`text-sm font-bold py-1 ${
              voteScore > 0 ? 'text-amber-600' : 
              voteScore < 0 ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {voteScore > 0 && '+'}{voteScore}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(userVote === 'dislike' ? 'remove' : 'dislike')}
              disabled={isVoting}
              className={`p-1 h-8 w-8 mt-1 ${
                userVote === 'dislike' 
                  ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author_profile_image} />
                  <AvatarFallback>
                    {post.author_full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {post.garage_name && (
                    <button
                      onClick={() => navigate(`/g/${post.garage_id}`)}
                      className="font-bold text-gray-900 hover:text-amber-600 flex items-center transition-colors"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      g/{post.garage_name}
                    </button>
                  )}
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">
                    Posted by{' '}
                    <button
                      onClick={() => navigate(`/u/${post.author_username}`)}
                      className="text-gray-900 hover:text-orange-600 font-medium"
                    >
                      u/{post.author_username}
                    </button>
                  </span>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save
                  </DropdownMenuItem>
                  {!isAuthor && (
                    <DropdownMenuItem>
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  )}
                  {isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        Delete Post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
              
              {/* Image gallery */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className={`rounded-lg overflow-hidden ${
                  post.image_urls.length === 1 ? 'max-w-md' : 'grid gap-2 grid-cols-2'
                }`}>
                  {post.image_urls.slice(0, 4).map((url, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-100 aspect-video"
                    >
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => {/* TODO: Open image viewer */}}
                      />
                      {post.image_urls.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
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
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-orange-100 hover:text-orange-700"
                      onClick={() => navigate(`/search?tag=${tag}`)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCommentClick && onCommentClick(post)}
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span>{post.comment_count || 0}</span>
                  <span className="ml-1 hidden sm:inline">
                    {post.comment_count === 1 ? 'comment' : 'comments'}
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Share className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                {voteScore > 0 ? `+${voteScore}` : voteScore} points • {post.comment_count || 0} comments
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;