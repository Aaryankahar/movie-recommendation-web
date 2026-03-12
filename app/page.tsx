import { MovieSearch } from '@/components/movie-search';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <MovieSearch />
      </div>
    </main>
  );
}
