// sparse embedding transformer model for extracting meanings from search
import { SentenceTransformer } from '@xenova/transformers';


//*-----output-----*//
// testing with location
export interface LocationResult {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: { 
        location: { lat: number; lng: number};
    };
    rating?: number;
    types: string[]; // cafe, restaurant, etc
    // measure the similarity between the query and result
    similarity_score?: number;
    semantic_relevance?: number;
}

//*-----input-----*//
// create a single search session per @. capture user activity
export interface SearchSession {
    timestamp: Date; // use the date as the primary key
    query: string;
    embeddings: Embedding[];
    clusters: string[]; // list of semantics themes
    results: LocationResult[]; // return the n amount of best locations
}

//*-----analysis-----*//
// sparse embedding
export interface Embedding {
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

//*------ main service-----*//

class SearchService {
    private static instance: SearchService;
    private model: Pipeline | null = null;
    private googleApiKey: string;
    // create a temp cache for recent search results
    private searchCache: Map<string, { results: LocationResult[]; timestamp: number }> = new Map();
    private searchSessions: SearchSession[] = [];
    private isModelLoading: boolean = false;
    private modelLoadPromise: Promise<void> | null = null; 

    // embedding optimization
    private readonly SPARSITY_THRESHOLD = 0.01; // remove dimensions that do not express the feature at all
    private readonly MAX_DIMENSIONS = 100; // keep only top 100 dimensions

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
                quantized: true; // quantize (reduce size) to save memory
            })
            this.isModelLoading = false;
        } catch(error) {
            this.isModelLoading = false;
            throw new Error(`Failed to load model: ${error}`);
        }
    }

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

    // calculate cosine similarity between 2 sparse embeddings for scoring search results with the query
    private calculateSparseSimilarity(embedding1: SparseEmbedding, embedding2: SparseEmbedding): number {
        // calculate dot product between each index within embedding
        let dotProduct = 0;
        let i = 0, j = 0;
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

            // calculate cosine similarity
            const similarity = dotProduct / (embedding1.magnitude * embedding2.magnitude);
            return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
        }
        
    }

    // analyze query to extract user intent
    
}