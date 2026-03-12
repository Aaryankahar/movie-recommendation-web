'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface Movie {
  id: string;
  title: string;
  year: string;
  rating: string;
  poster: string | null;
}

export function MovieSearch() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setMovies([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch recommendations');
        return;
      }

      setMovies(data.movies);
      if (data.movies.length === 0) {
        setError('No recommendations found. Try a different movie title.');
      }
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-white text-pretty">
          Movie Recommendation System
        </h1>
        <p className="text-lg text-neutral-400">
          Discover personalized movie recommendations powered by machine learning
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
        />
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-8"
        >
          {loading ? <Spinner className="mr-2" /> : null}
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Movie Results Grid */}
      {movies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Recommended Movies ({movies.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group cursor-pointer rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all"
              >
                {/* Poster */}
                <div className="relative w-full aspect-[2/3] bg-neutral-800 overflow-hidden">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      No Poster Available
                    </div>
                  )}
                </div>

                {/* Movie Info */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-white line-clamp-2">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">{movie.year}</span>
                    {movie.rating !== 'N/A' && (
                      <span className="inline-block px-3 py-1 bg-neutral-800 rounded-full text-amber-400 font-medium">
                        ★ {movie.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && movies.length === 0 && !error && (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-lg">Start by searching for a movie to get recommendations</p>
        </div>
      )}
    </div>
  );
}
