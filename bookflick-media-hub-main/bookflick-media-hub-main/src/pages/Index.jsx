import { useState, useEffect } from "react";
import { Search, Film, Book, User, Heart, Star, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchResults from "@/components/SearchResults";
import Header from "@/components/Header";
import { useDebounce } from "@/hooks/useDebounce";
const Index = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("movies");
    const [isSearching, setIsSearching] = useState(false);
    const [genre, setGenre] = useState("all");
    const [sortBy, setSortBy] = useState("relevance");
    const [showFilters, setShowFilters] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 500);
    useEffect(() => {
        if (debouncedSearch.trim()) {
            setIsSearching(true);
        }
        else {
            setIsSearching(false);
        }
    }, [debouncedSearch]);
    const movieGenres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"];
    const bookGenres = ["Fiction", "Non-Fiction", "Science", "History", "Biography", "Mystery"];
    const currentGenres = activeTab === "movies" ? movieGenres : bookGenres;
    return (<div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            BookFlick
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover Movies & Books You'll Love
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"/>
              <Input type="text" placeholder="Search for movies or books..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-border focus:border-primary transition-colors"/>
              {searchQuery && (<Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={() => setSearchQuery("")}>
                  <X className="w-4 h-4"/>
                </Button>)}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-md mx-auto mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="movies" className="flex items-center gap-2">
                <Film className="w-4 h-4"/>
                Movies
              </TabsTrigger>
              <TabsTrigger value="books" className="flex items-center gap-2">
                <Book className="w-4 h-4"/>
                Books
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="max-w-2xl mx-auto">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="mb-4">
              <Filter className="w-4 h-4 mr-2"/>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>

            {showFilters && (<div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-card rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre</label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="All genres"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All genres</SelectItem>
                      {currentGenres.map((g) => (<SelectItem key={g} value={g.toLowerCase()}>
                          {g}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Relevance"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>)}
          </div>
        </div>

        {/* Search Results */}
        {isSearching && debouncedSearch && (<SearchResults query={debouncedSearch} type={activeTab} genre={genre} sortBy={sortBy}/>)}

        {/* Feature Cards */}
        {!isSearching && (<div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-card border border-border text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary"/>
              </div>
              <h3 className="text-lg font-semibold mb-2">Save Favorites</h3>
              <p className="text-muted-foreground">
                Create your personal collection of movies and books
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-secondary"/>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rate & Review</h3>
              <p className="text-muted-foreground">
                Share your thoughts and discover community reviews
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-6 h-6 text-accent"/>
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalized</h3>
              <p className="text-muted-foreground">
                Get recommendations based on your taste
              </p>
            </div>
          </div>)}
      </main>
    </div>);
};
export default Index;
