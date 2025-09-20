// sparse embedding transformer model for extracting meanings from search
import { pipeline } from '@xenova/transformers';


//*-----output-----*//
// testing with location
export interface LocationResult {
    // initial request result
    place_id: string;
    name: string;
    description: string;
    formatted_address: string;
    geometry: { 
        location: { lat: number; lng: number};
    };
    rating?: number;
    types: string[]; // cafe, restaurant, etc

    // measure the similarity between the query and result
    similarity_score?: number;
}

//*-----input-----*//
// create a single search session per @. capture user activity
export interface SearchSession {
    timestamp: Date; // use the date as the primary key
    query: string;
    embeddings: SparseEmbedding[];
    clusters: string[]; // list of semantics themes
    results: LocationResult[]; // return the n amount of best locations
}

//*-----analysis-----*//
// sparse embedding
export interface SparseEmbedding {
    indices: number[]; // location of zeros
    values: number[]; // location of non-zero values
    dimension: number; // original vector length
    magnitude: number; // l2 norm of vector which is used to compute distance between vectors
}
// query analysis
interface QueryAnalysis {
    intent: 'location' | 'restaurant' | 'business' | 'general'; 
    entities: string[];        // Extracted entities (cuisine, location type, etc.)
    clusters: string[]; // Detected themes for clustering
    confidence: number;        // Analysis confidence score
}



//*------ main class-----*//
class SearchService {
    //* ---- main variables *-----//
    private static instance: SearchService;
    private model: pipeline | null = null;
    private googleApiKey: string;
    // create a temp cache for recent search results
    private searchCache: Map<string, { results: LocationResult[]; timestamp: number }> = new Map();
    private searchSessions: SearchSession[] = [];
    private isModelLoading: boolean = false;
    private modelLoadPromise: Promise<void> | null = null; 
    // embedding optimization
    private readonly SPARSITY_THRESHOLD = 0.01; // remove dimensions that do not express the feature at all
    private readonly MAX_DIMENSIONS = 100; // keep only top 100 dimensions
    // keywords for filtering search results
    private readonly keywords = [
        'cozy', 'intimate', 'spacious', 'outdoor', 'patio', 'rooftop', 'dim lighting',
        'live music', 'DJ', 'quiet', 'background music',
        'romantic', 'family-friendly', 'trendy', 'chill', 'lively', 'crowded', 'busy', 'locals', 'tourists'
    ];


    //* ---- main functions *----//
    private constructor() {
        this.googleApiKey = process.env.GOOGLE_API_KEY!;
    }

    // a new instance will be created on first access
    static getInstance(): SearchService {
        if (!SearchService.instance) {
            SearchService.instance = new SearchService();
        }
        return SearchService.instance;
    }

    // initialize service by running the load function (which also downloads the model)
    async initializeModel(): Promise<void> {
        if (this.model || this.isModelLoading) {
            return this.modelLoadPromise || Promise.resolve();
        }

        this.isModelLoading = true;
        this.modelLoadPromise = this.loadModel();

        // try loading promise
        try {
            await this.modelLoadPromise;
        } catch (error) {
            this.isModelLoading = false;
            throw error;
        } 
    }

    // load sentence transformer
    // all-MiniLM-L6-v2 with 384 dimensions
    private async loadModel(): Promise<void> {
        try {
            this.model = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2', {
                quantized: true // quantize (reduce size) to save memory
            })
            this.isModelLoading = false;
        } catch(error) {
            this.isModelLoading = false;
            throw new Error(`Failed to load model: ${error}`);
        }
    }

    //* ----- WORKFLOW STEPS ------ *//
    // convert dense to sparse embedding
    // compresses 384D vector
    private createSparseEmbedding(denseEmbedding: number[]): SparseEmbedding {
        // initialize params for sparse embedding
        const indices: number[] = [];
        const values: number[] = [];

        // normalize length of vector for fair comparisons
        const magnitude = Math.sqrt(denseEmbedding.reduce((sum, val) => sum + val * val, 0))

        // create index-value pairs, filter by absolute value
        // used to filter and clean values within the embedding (remove trash)
        const indexedValues = denseEmbedding
             .map((value, index) => ({ value, index, absValue: Math.abs(value) }))
             .filter(item => item.absValue > this.SPARSITY_THRESHOLD)
             .sort((a, b) => b.absValue - a.absValue)
             .slice(0, this.MAX_DIMENSIONS); // keep only top N dimensions

        // extract indices and values
        indexedValues.forEach(item => {
            indices.push(item.index);
            values.push(item.value);
        })

        return { indices, values, dimension: denseEmbedding.length, magnitude };
    }

    // calculate cosine similarity between 2 sparse embeddings for matching search results with the query
    private calculateSparseSimilarity(embedding1: SparseEmbedding, embedding2: SparseEmbedding): number {
        // calculate dot product between each index within embedding
        let dotProduct = 0;
        let i = 0, j = 0;

        // calculate dot produt
        while (i < embedding1.indices.length && j < embedding2.indices.length) {
            // if same index, add product of values
            if (embedding1.indices[i] === embedding2.indices[j]) {
                dotProduct += embedding1.values[i] * embedding2.values[j];
                ++i;
                ++j;
            // iterate through embedding
            } else if (embedding1.indices[i] < embedding2.indices[j]) {
                ++i;
            } else {
                ++j;
            }
        }
        
        // calculate cosine similarity
        const similarity = dotProduct / (embedding1.magnitude * embedding2.magnitude);
        return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
    }

    // turn query and results into embeddings with the sparse encoder
    private async embedQuery(query: string): Promise<SparseEmbedding> {
        if (!this.model) await this.initializeModel();

        // create a embedding pool of the entire query
        const output = await this.model!(query, {pooling: 'mean', normalize: true});
        return this.createSparseEmbedding(output.data);
    }
    private async embedLocations(locations: LocationResult[]): Promise<SparseEmbedding[]> {
        return Promise.all(
            locations.map(async (loc) => {
                let text = ' '; // combine all fields in a link into a single text query
                if (loc.name) text += `${loc.name}`;
                if (loc.description) text += ` ${loc.description}`;
                if (loc.types && loc.types.length > 0) text += ` ${loc.types.join(', ')}`;

                text = text.trim();
                return this.embedQuery(text);
            })
        );
    }

    private getReviews(reviews: string[]): string[] {
        const relevant = reviews.filter(review => 
            this.keywords.some(keyword => review.toLowerCase().includes(keyword))
        );
        // return the most recent review if there are no reviews that match the keyword
        if (relevant.length === 0 && reviews.length  > 0) return [reviews[0]];

        return relevant.slice(0, 3); 
    }

    // search places on google and get raw location data
    private async searchPlaces(query: string): Promise<LocationResult[]> {
        // fetch response to user query from google search api
        const response = await fetch(
            `/api/places/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) throw new Error(`Places API failed: ${response.status}`);

        const data = await response.json();
        return (data.results || []).slice(0, 10); // get top 10 results
    }

    // ranking pipeline for results
    private async rankBySimilarity(
        queryEmbedding: SparseEmbedding,
        locations: LocationResult[]
    ): Promise<LocationResult[]> {
        if (locations.length === 0) return [];
        // create embeddings for all search results
        const locationEmbeddings = await this.embedLocations(locations);
        
        // calculate similarities and embed scores
        // map/attach to the location data struc at the index
        const scoredLocations = locations.map((location, index) => ({
            ...location,
            similarity_score: this.calculateSparseSimilarity(queryEmbedding, locationEmbeddings[index])
        }));

        // get the most similar elements
        const filtered = scoredLocations
            .sort((a,b) => b.similarity_score! - a.similarity_score!);
        
        return filtered.slice(0, 5);
    }

    //*--- main pipeline ----*//
    async searchLocations(userQuery: string): Promise<LocationResult{
        results: LocationResult[];
        queryEmbedding: this.SparseEmbedding;
    }> {
        if (!userQuery.trim()) {
            return { results: [], queryEmbedding: { indices: [], values: [], norm: 0 } };
          }

        const cacheKey = userQuery.toLowerCase().trim(); // use user query as the key to access cache
        // return cache if exists
        const cached = resultCache.get(cacheKey);
        if (cached) 
            return { results: cached.results, queryEmbedding: cached.embedding };

        try{
            // create embedding
            const queryEmbedding = await this.embedQuery(userQuery);
            
            // search google places
            const rawResults = await this.searchPlaces(userQuery);

            // ranking
            const rankedResults = await this.rankBySimilarity(queryEmbedding, rawResults);

            // Cache results with embedding
      this.resultCache.set(cacheKey, {
        results: rankedResults,
        timestamp: Date.now(),
        embedding: queryEmbedding
      });

      // Cleanup cache
      if (this.resultCache.size > 50) {
        const oldestKey = this.resultCache.keys().next().value;
        this.resultCache.delete(oldestKey);
      }
        }

    }
    
}

export default SearchService;