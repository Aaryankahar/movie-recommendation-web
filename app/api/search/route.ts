import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'https://movie-recommendation-api-pc9g.onrender.com';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '91302802';
const OMDB_API_URL = 'https://www.omdbapi.com/';

// Parse MovieLens title format: "Title (YYYY)" -> { title: "Title", year: "YYYY" }
function parseMovieLensTitle(fullTitle: string) {
  const match = fullTitle.match(/^(.+?)\s\((\d{4})\)$/);
  if (match) {
    return { title: match[1].trim(), year: match[2] };
  }
  return { title: fullTitle, year: '' };
}

// Fetch movie details from OMDb with title and year
async function fetchOmdbMovie(title: string, year: string) {
  try {
    // First try with year for more accurate results
    if (year) {
      const response = await fetch(
        `${OMDB_API_URL}?t=${encodeURIComponent(title)}&y=${year}&apikey=${OMDB_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
          return data;
        }
      }
    }

    // Fallback: try without year
    const response = await fetch(
      `${OMDB_API_URL}?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.Response === 'True') {
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching OMDb for "${title} (${year})":`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get recommendations from ML backend
    console.log(`[v0] Calling FastAPI at: ${FASTAPI_URL}/recommend?movie=${query}`);
    
    const recommendResponse = await fetch(
      `${FASTAPI_URL}/recommend?movie=${encodeURIComponent(query)}`,
      { 
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    console.log(`[v0] FastAPI response status: ${recommendResponse.status}`);
    
    if (!recommendResponse.ok) {
      const errorBody = await recommendResponse.text();
      console.error(`[v0] FastAPI error: ${recommendResponse.status} ${recommendResponse.statusText}`);
      console.error(`[v0] Response body:`, errorBody);
      
      // Check if it's a 404 - likely endpoint doesn't exist
      if (recommendResponse.status === 404) {
        return NextResponse.json(
          { 
            error: 'FastAPI backend /recommend endpoint not found. Please verify the FastAPI server is running and the endpoint exists.',
            movies: [],
            debugInfo: `Tried: ${FASTAPI_URL}/recommend?movie=${query}`
          },
          { status: 200 }
        );
      }
      
      // For other errors, return them
      return NextResponse.json(
        { 
          error: `FastAPI error: ${recommendResponse.status} ${recommendResponse.statusText}`,
          movies: [] 
        },
        { status: 200 }
      );
    }

    const recommendData = await recommendResponse.json();
    console.log(`[v0] FastAPI response data:`, recommendData);
    
    const recommendedTitles = recommendData.recommendations || [];

    if (recommendedTitles.length === 0) {
      console.log(`[v0] No recommendations returned from FastAPI for: ${query}`);
      return NextResponse.json({ 
        movies: [],
        message: 'No recommendations found for this movie'
      });
    }

    // Step 2: Fetch OMDb details asynchronously for all recommendations
    const moviePromises = recommendedTitles.map(async (fullTitle: string) => {
      const { title, year } = parseMovieLensTitle(fullTitle);
      const omdbData = await fetchOmdbMovie(title, year);

      if (omdbData) {
        return {
          id: omdbData.imdbID,
          title: omdbData.Title,
          year: omdbData.Year,
          rating: omdbData.imdbRating,
          poster:
            omdbData.Poster && omdbData.Poster !== 'N/A'
              ? omdbData.Poster.replace(/^http:/, 'https:')
              : null,
        };
      }
      return null;
    });

    const results = await Promise.all(moviePromises);
    const movies = results.filter((movie) => movie !== null);

    console.log(`[v0] Successfully fetched ${movies.length} movies with posters`);
    return NextResponse.json({ movies });
  } catch (error) {
    console.error(`[v0] Search error:`, error);
    return NextResponse.json(
      { 
        error: `Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        movies: [] 
      },
      { status: 200 }
    );
  }
}
