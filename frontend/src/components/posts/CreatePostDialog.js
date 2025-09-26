import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { PlusCircle, X, Image, Hash } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const CreatePostDialog = ({ onPostCreated }) => {
  const { API_BASE } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [garages, setGarages] = useState([]);
  const [formData, setFormData] = useState({
    content: '',
    garage_id: '',
    image_urls: [],
    hashtags: []
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newHashtag, setNewHashtag] = useState('');

  // Load user's garages when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadGarages();
    }
  }, [isOpen]);

  const loadGarages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/garages/`);
      setGarages(response.data);
    } catch (error) {
      console.error('Error loading garages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: formData.content,
        garage_id: formData.garage_id || null,
        image_urls: formData.image_urls,
        hashtags: formData.hashtags
      };

      await axios.post(`${API_BASE}/posts/`, postData);
      
      toast.success('Post created successfully!');
      setIsOpen(false);
      resetForm();
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create post');
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      content: '',
      garage_id: '',
      image_urls: [],
      hashtags: []
    });
    setNewImageUrl('');
    setNewHashtag('');
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && !formData.image_urls.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (index) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const addHashtag = () => {
    if (newHashtag.trim() && !formData.hashtags.includes(newHashtag.trim())) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, newHashtag.trim().replace('#', '')]
      }));
      setNewHashtag('');
    }
  };

  const removeHashtag = (index) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your riding experiences with the community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's happening on the road?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[100px]"
              maxLength={2000}
              required
            />
          </div>

          {/* Garage selection */}
          <div className="space-y-2">
            <Label htmlFor="garage">Post to Garage (Optional)</Label>
            <Select
              value={formData.garage_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, garage_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a garage or post publicly" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Public Post</SelectItem>
                {garages.map((garage) => (
                  <SelectItem key={garage.id} value={garage.id}>
                    {garage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image URLs */}
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Paste image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addImageUrl)}
              />
              <Button type="button" onClick={addImageUrl} size="sm">
                <Image className="h-4 w-4" />
              </Button>
            </div>
            {formData.image_urls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.image_urls.map((url, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <span className="max-w-[150px] truncate">{url}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeImageUrl(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add hashtag (without #)"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addHashtag)}
              />
              <Button type="button" onClick={addHashtag} size="sm">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            {formData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeHashtag(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;