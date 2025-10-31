import { Heart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookCardProps {
  book: {
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      publishedDate?: string;
      imageLinks?: {
        thumbnail: string;
      };
    };
  };
}

const BookCard = ({ book }: BookCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { volumeInfo } = book;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkFavorite(session.user.id);
      }
    });
  }, []);

  const checkFavorite = async (userId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("item_id", book.id)
      .eq("item_type", "book")
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save favorites");
      navigate("/auth");
      return;
    }

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", book.id)
        .eq("item_type", "book");
      
      if (!error) {
        setIsFavorite(false);
        toast.success("Removed from favorites");
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        item_id: book.id,
        item_type: "book",
        title: volumeInfo.title,
        poster_url: volumeInfo.imageLinks?.thumbnail,
        year: volumeInfo.publishedDate?.split("-")[0],
      });

      if (!error) {
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
      onClick={() => navigate(`/detail/book/${book.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[2/3]">
          <img
            src={volumeInfo.imageLinks?.thumbnail || "/placeholder.svg"}
            alt={volumeInfo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{volumeInfo.title}</h3>
              <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                {volumeInfo.authors?.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {volumeInfo.publishedDate?.split("-")[0]}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isFavorite ? "default" : "secondary"}
                  className="flex-1"
                  onClick={handleFavoriteClick}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
