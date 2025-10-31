import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReviewSection from "@/components/ReviewSection";
import AddToCollectionDialog from "@/components/AddToCollectionDialog";
const TMDB_API_KEY = "9b4e1a813e03f2741c0495dac07fea6f";
const GOOGLE_BOOKS_API_KEY = "AIzaSyBXBu9qOZMEO8j-gGpr-4Rtvp7ANLC-XIs";
const Detail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);
    const { data: item, isLoading } = useQuery({
        queryKey: ["detail", type, id],
        queryFn: async () => {
            if (type === "movie") {
                const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
                return response.json();
            }
            else {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}?key=${GOOGLE_BOOKS_API_KEY}`);
                return response.json();
            }
        },
    });
    const { data: favoriteData, refetch: refetchFavorite } = useQuery({
        queryKey: ["favorite", user?.id, id, type],
        queryFn: async () => {
            const { data } = await supabase
                .from("favorites")
                .select("*")
                .eq("user_id", user.id)
                .eq("item_id", id)
                .eq("item_type", type)
                .maybeSingle();
            return data;
        },
        enabled: !!user,
    });
    useEffect(() => {
        setIsFavorite(!!favoriteData);
    }, [favoriteData]);
    const toggleFavorite = async () => {
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
                .eq("item_id", id)
                .eq("item_type", type);
            if (error) {
                toast.error("Failed to remove favorite");
            }
            else {
                toast.success("Removed from favorites");
                setIsFavorite(false);
                refetchFavorite();
            }
        }
        else {
            const title = type === "movie" ? item.title : item.volumeInfo?.title;
            const poster = type === "movie" ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null) : item.volumeInfo?.imageLinks?.thumbnail;
            const year = type === "movie" ? item.release_date?.split("-")[0] : item.volumeInfo?.publishedDate?.split("-")[0];
            const { error } = await supabase.from("favorites").insert({
                user_id: user.id,
                item_id: id,
                item_type: type,
                title,
                poster_url: poster,
                year,
            });
            if (error) {
                toast.error("Failed to add favorite");
            }
            else {
                toast.success("Added to favorites");
                setIsFavorite(true);
                refetchFavorite();
            }
        }
    };
    if (isLoading) {
        return (<div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary"/>
        </div>
      </div>);
    }
    if (!item || (type === "movie" && item.success === false)) {
        return (<div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Item not found</p>
        </div>
      </div>);
    }
    const isMovie = type === "movie";
    const title = isMovie ? item.title : item.volumeInfo?.title;
    const poster = isMovie ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null) : item.volumeInfo?.imageLinks?.thumbnail;
    const year = isMovie ? item.release_date?.split("-")[0] : item.volumeInfo?.publishedDate?.split("-")[0];
    const rating = isMovie ? item.vote_average : item.volumeInfo?.averageRating;
    const description = isMovie ? item.overview : item.volumeInfo?.description;
    const genre = isMovie ? item.genres?.map((g) => g.name).join(", ") : item.volumeInfo?.categories?.join(", ");
    const creator = isMovie ? item.credits?.crew?.find((c) => c.job === "Director")?.name : item.volumeInfo?.authors?.join(", ");
    return (<div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2"/>
          Back
        </Button>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <img src={poster !== "N/A" && poster ? poster : "/placeholder.svg"} alt={title} className="w-full rounded-lg shadow-lg"/>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                {year && <span>{year}</span>}
                {rating && (<div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent"/>
                    <span>{rating}</span>
                  </div>)}
              </div>
            </div>

            {genre && (<div className="flex flex-wrap gap-2">
                {genre.split(",").map((g, i) => (<Badge key={i} variant="secondary">
                    {g.trim()}
                  </Badge>))}
              </div>)}

            {creator && (<p className="text-muted-foreground">
                <span className="font-semibold">{isMovie ? "Director" : "Author"}:</span> {creator}
              </p>)}

            {description && (<div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{description}</p>
              </div>)}

            <div className="flex gap-4 pt-4">
              <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "secondary"}>
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`}/>
                {isFavorite ? "Saved" : "Save to Favorites"}
              </Button>
              {user && <AddToCollectionDialog itemId={id} itemType={type} title={title} posterUrl={poster} year={year}/>}
            </div>
          </div>
        </div>

        <ReviewSection itemId={id} itemType={type} userId={user?.id}/>
      </main>
    </div>);
};
export default Detail;
