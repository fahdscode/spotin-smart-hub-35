import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, Send } from 'lucide-react';

interface SatisfactionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const RATING_EMOJIS = ['😞', '😐', '🙂', '😊', '😁'];
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function SatisfactionPopup({ isOpen, onClose, clientId }: SatisfactionPopupProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await supabase.from('feedback').insert({
        user_id: clientId,
        rating: rating,
        comment: comment || null,
        emoji: RATING_EMOJIS[rating - 1],
        feedback_type: 'checkout_satisfaction',
        visit_date: new Date().toISOString().split('T')[0]
      });

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      // Reset form and close
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">How was your visit today?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Rating Selection */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Rate your experience</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    rating >= value ? 'grayscale-0' : 'grayscale opacity-50'
                  }`}
                >
                  {RATING_EMOJIS[value - 1]}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium text-primary">
                {RATING_LABELS[rating - 1]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={rating === 0 || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}