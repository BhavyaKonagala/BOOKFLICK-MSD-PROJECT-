import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MovieCard from "./MovieCard";
import BookCard from "./BookCard";
import { Loader2 } from "lucide-react";
const TMDB_API_KEY = "9b4e1a813e03f2741c0495dac07fea6f";
const GOOGLE_BOOKS_API_KEY = "AIzaSyBXBu9qOZMEO8j-gGpr-4Rtvp7ANLC-XIs";
const SearchResults = ({ query, type, genre = "all", sortBy = "relevance" }) => {
    // Fetch search results (movies or books)
    const { data, isLoading, error } = useQuery({
        queryKey: ["search", query, type],
        queryFn: async () => {
            if (type === "movies") {
                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                return data.results || [];
            }
            else {
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=40`);
                const data = await response.json();
                return data.items || [];
            }
        },
        enabled: query.length > 0,
    });

    // Fetch TMDB genre list once so we can map friendly genre names to TMDB IDs reliably
    const { data: tmdbGenres } = useQuery({
        queryKey: ["tmdb-genres"],
        queryFn: async () => {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`);
                const json = await res.json();
                return (json.genres || []).reduce((acc, g) => {
                    acc[g.name.toLowerCase()] = g.id;
                    return acc;
                }, {});
            }
            catch (e) {
                return {};
            }
        },
        enabled: Boolean(TMDB_API_KEY),
        staleTime: 1000 * 60 * 60,
    });
    const filteredAndSortedData = useMemo(() => {
        if (!data)
            return [];
        let filtered = [...data];
            // Filter by genre
            if (genre !== "all") {
                const genreKey = String(genre).toLowerCase();

                filtered = filtered.filter((item) => {
                    if (type === "movies") {
                        // Try to resolve the genre to a TMDB id using the fetched genre list first
                        const genreId = tmdbGenres?.[genreKey];

                        if (genreId) {
                            return item.genre_ids?.includes(genreId);
                        }

                        // fallback mapping for common aliases
                        const fallbackMap = {
                            "sci-fi": 878,
                            "science fiction": 878,
                            action: 28,
                            comedy: 35,
                            drama: 18,
                            horror: 27,
                            romance: 10749,
                            thriller: 53,
                        };
                        const fbId = fallbackMap[genreKey];
                        if (fbId) return item.genre_ids?.includes(fbId);

                        // As a last resort, match the genre name text against the movie's title or overview
                        return (item.title || "").toLowerCase().includes(genreKey) || (item.overview || "").toLowerCase().includes(genreKey);
                    }
                    else {
                        // Books: match against categories if present, otherwise try title/description
                        const cats = item.volumeInfo?.categories;
                        if (cats && cats.length > 0) {
                            return cats.some((cat) => cat.toLowerCase().includes(genreKey));
                        }
                        return (item.volumeInfo?.title || "").toLowerCase().includes(genreKey) || (item.volumeInfo?.description || "").toLowerCase().includes(genreKey);
                    }
                });
            }
        // Sort
        if (sortBy === "year") {
            filtered.sort((a, b) => {
                const yearA = type === "movies" ? parseInt(a.release_date?.split("-")[0] || "0") : parseInt(a.volumeInfo?.publishedDate?.split("-")[0] || "0");
                const yearB = type === "movies" ? parseInt(b.release_date?.split("-")[0] || "0") : parseInt(b.volumeInfo?.publishedDate?.split("-")[0] || "0");
                return yearB - yearA;
            });
        }
        else if (sortBy === "rating") {
            filtered.sort((a, b) => {
                const ratingA = type === "movies" ? (a.vote_average || 0) : (a.volumeInfo?.averageRating || 0);
                const ratingB = type === "movies" ? (b.vote_average || 0) : (b.volumeInfo?.averageRating || 0);
                return ratingB - ratingA;
            });
        }
        return filtered;
    }, [data, genre, sortBy, type]);
    if (isLoading) {
        return (<div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    if (error) {
        return (<div className="text-center py-20">
        <p className="text-destructive">Error loading results. Please try again.</p>
      </div>);
    }
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) {
        return (<div className="text-center py-20">
        <p className="text-muted-foreground">No results found for "{query}"</p>
      </div>);
    }
    return (<div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">
        Search Results ({filteredAndSortedData.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {type === "movies"
            ? filteredAndSortedData.map((movie) => (<MovieCard key={movie.id} movie={movie}/>))
            : filteredAndSortedData.map((book) => (<BookCard key={book.id} book={book}/>))}
      </div>
    </div>);
};
export default SearchResults;
