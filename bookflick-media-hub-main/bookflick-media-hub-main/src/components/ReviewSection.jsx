import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
const ReviewSection = ({ itemId, itemType, userId }) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ["reviews", itemId, itemType],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reviews")
                .select("*, profiles(username)")
                .eq("item_id", itemId)
                .eq("item_type", itemType)
                .order("created_at", { ascending: false });
            if (error)
                throw error;
            return data || [];
        },
    });
    const { data: userReview } = useQuery({
        queryKey: ["userReview", userId, itemId, itemType],
        queryFn: async () => {
            if (!userId)
                return null;
            const { data } = await supabase
                .from("reviews")
                .select("*")
                .eq("user_id", userId)
                .eq("item_id", itemId)
                .eq("item_type", itemType)
                .maybeSingle();
            return data;
        },
        enabled: !!userId,
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Please login to submit a review");
            return;
        }
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        setIsSubmitting(true);
        const reviewData = {
            user_id: userId,
            item_id: itemId,
            item_type: itemType,
            rating,
            review_text: reviewText.trim() || null,
        };
        const { error } = userReview
            ? await supabase
                .from("reviews")
                .update(reviewData)
                .eq("id", userReview.id)
            : await supabase.from("reviews").insert(reviewData);
        if (error) {
            toast.error("Failed to submit review");
        }
        else {
            toast.success(userReview ? "Review updated" : "Review submitted");
            setRating(0);
            setReviewText("");
            queryClient.invalidateQueries({ queryKey: ["reviews", itemId, itemType] });
            queryClient.invalidateQueries({ queryKey: ["userReview", userId, itemId, itemType] });
        }
        setIsSubmitting(false);
    };
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {userId && (<form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${star <= rating
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"}`}/>
                    </button>))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
                <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your thoughts..." rows={4}/>
              </div>

              <Button type="submit" disabled={isSubmitting || rating === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {userReview ? "Update Review" : "Submit Review"}
              </Button>
            </form>)}

          {isLoading ? (<div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary"/>
            </div>) : reviews.length === 0 ? (<p className="text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review!
            </p>) : (<div className="space-y-4">
              {reviews.map((review) => (<Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{review.profiles?.username || "Anonymous"}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: review.rating }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-accent text-accent"/>))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {review.review_text && (<p className="text-muted-foreground mt-2">{review.review_text}</p>)}
                  </CardContent>
                </Card>))}
            </div>)}
        </CardContent>
      </Card>
    </div>);
};
export default ReviewSection;
