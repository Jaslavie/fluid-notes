// sparse embedding transformer model for extracting meanings from search
import { pipeline } from "@xenova/transformers";

import KeywordManager from "./KeywordManager";
import { AMBIANCE_MAP, LOCATION_PATTERNS, LOCATION_MAP } from "./Keywords";

// Type definitions for the transformer model

//*-----output-----*//
// testing with location
export interface LocationResult {
  // initial request result
  place_id: string;
  name: string;
  description: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  types: string[]; // cafe, restaurant, etc

  // measure the similarity between the query and result
  similarity_score?: number;

  // ambiance analysis for reasoning
  ambiance_analysis?: {
    factors: string[];
    reasoning: string;
    keywordMatches: string[];
    weights: {
      similarity: number;
      rating: number;
      category: number;
      keyword: number;
    };
  };
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

//*------ main class-----*//
class SearchService {
  //* ---- main variables *-----//
  private static instance: SearchService;
  private model: unknown | null = null;
  private yelpApiKey: string;
  // create a temp cache for recent search results
  private searchCache: Map<
    string,
    { results: LocationResult[]; timestamp: number }
  > = new Map();
  private searchSessions: SearchSession[] = [];
  private isModelLoading: boolean = false;
  private modelLoadPromise: Promise<void> | null = null;
  // embedding optimization
  private readonly SPARSITY_THRESHOLD = 0.001; // remove dimensions that do not express the feature at all
  private readonly MAX_DIMENSIONS = 100; // keep only top 100 dimensions (384D model)

  //* ---- main functions *----//
  private constructor() {
    this.yelpApiKey = process.env.YELP_API_KEY!;
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
      console.log(
        "🤖 Loading transformer model: sentence-transformers/all-MiniLM-L6-v2"
      );
      this.model = await pipeline(
        "feature-extraction",
        "sentence-transformers/all-MiniLM-L6-v2",
        { quantized: false }
      );
      console.log("Transformer model loaded successfully");
      this.isModelLoading = false;
    } catch (error) {
      console.error("Failed to load transformer model:", error);
      this.isModelLoading = false;
      throw new Error(`Failed to load model: ${error}`);
    }
  }

  //* ----- KEYWORD ENHANCEMENT ------ *//
  // enhance query with relevant keywords from notes
  private enhanceQueryWithKeywords(
    query: string,
    notesContent: string
  ): string {
    // Extract location context from notes
    const locationContext = this.extractLocationContext(notesContent);

    // Create ambiance-focused query instead of exact name search
    const ambianceTerms = this.extractAmbianceTerms(query);

    // Get relevant keywords from notes
    const relevantKeywords = KeywordManager.findKeywords(notesContent);
    const keywordsToAdd = relevantKeywords.slice(0, 3); // Limit to 3 most relevant

    // Combine: ambiance + location + keywords
    const enhancedQuery =
      `${ambianceTerms} ${locationContext} ${keywordsToAdd.join(" ")}`.trim();

    console.log("Query enhancement:", {
      original: query,
      ambiance: ambianceTerms,
      location: locationContext,
      keywords: keywordsToAdd,
      enhanced: enhancedQuery,
    });

    return enhancedQuery;
  }

  // Extract location context from notes (e.g., "Washington DC", "San Francisco")
  private extractLocationContext(notesContent: string): string {
    for (const pattern of LOCATION_PATTERNS) {
      const match = notesContent.match(pattern);
      if (match) {
        let location = match[0].trim();

        // Clean up the location string - remove "trip:" prefix
        if (location.includes("trip:")) {
          location = location.replace(/trip:\s*/gi, "").trim();
        }

        const mappedLocation = LOCATION_MAP[location.toLowerCase()] || location;
        console.log("Location:", mappedLocation);
        return mappedLocation;
      }
    }

    // default to the user's current location
    return "";
  }

  // Convert user query to ambiance-focused search terms
  private extractAmbianceTerms(userQuery: string): string {
    const terms = userQuery.toLowerCase().split(/\s+/);
    const expandedTerms: string[] = [];

    // Always include coffee/cafe terms for ambiance queries
    const hasCafeTerms = terms.some((term) =>
      ["cozy", "cute", "warm", "intimate", "comfortable", "relaxing"].includes(
        term
      )
    );

    for (const term of terms) {
      if (AMBIANCE_MAP[term]) {
        expandedTerms.push(...AMBIANCE_MAP[term]);
      } else {
        expandedTerms.push(term);
      }
    }

    // If query has ambiance terms but no explicit cafe terms, add them
    if (
      hasCafeTerms &&
      !terms.some((term) => ["cafe", "coffee", "coffeeshop"].includes(term))
    ) {
      expandedTerms.push("coffee", "cafe");
    }

    return expandedTerms.join(" ");
  }

  //* ----- WORKFLOW STEPS ------ *//
  // convert dense to sparse embedding
  // compresses 384D vector (all-MiniLM-L6-v2)
  private createSparseEmbedding(denseEmbedding: number[]): SparseEmbedding {
    // initialize params for sparse embedding
    const indices: number[] = [];
    const values: number[] = [];

    // normalize length of vector for fair comparisons
    const magnitude = Math.sqrt(
      denseEmbedding.reduce((sum, val) => sum + val * val, 0)
    );

    // create index-value pairs, filter by absolute value
    // used to filter and clean values within the embedding (remove trash)
    const indexedValues = denseEmbedding
      .map((value, index) => ({ value, index, absValue: Math.abs(value) }))
      .filter((item) => item.absValue > this.SPARSITY_THRESHOLD)
      .sort((a, b) => b.absValue - a.absValue)
      .slice(0, this.MAX_DIMENSIONS); // keep only top N dimensions

    console.log("Embedding:", {
      total: indexedValues.length,
      threshold: this.SPARSITY_THRESHOLD,
    });

    // extract indices and values
    indexedValues.forEach((item) => {
      indices.push(item.index);
      values.push(item.value);
    });

    return { indices, values, dimension: denseEmbedding.length, magnitude };
  }

  // calculate cosine similarity between 2 dense embeddings for matching search results with the query
  private calculateDenseSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number {
    if (embedding1.length !== embedding2.length) {
      console.error(
        "❌ Embedding dimension mismatch:",
        embedding1.length,
        "vs",
        embedding2.length
      );
      return 0;
    }

    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
    }

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(
      embedding1.reduce((sum, val) => sum + val * val, 0)
    );
    const magnitude2 = Math.sqrt(
      embedding2.reduce((sum, val) => sum + val * val, 0)
    );

    // Calculate cosine similarity
    const similarity = dotProduct / (magnitude1 * magnitude2);

    const finalSimilarity = Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
    console.log("Similarity:", finalSimilarity.toFixed(4));

    return finalSimilarity;
  }

  // turn query and results into dense embeddings
  private async embedQuery(query: string): Promise<number[]> {
    if (!this.model) await this.initializeModel();

    if (!this.model) {
      throw new Error("Model not loaded");
    }

    try {
      // create a embedding pool of the entire query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await (this.model as any)(query, {
        pooling: "mean",
        normalize: false, // Don't normalize here, we'll do it manually
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outputAny = output as any;
      // Try different possible output structures
      let denseEmbedding: number[];
      if (outputAny.data && Array.isArray(outputAny.data)) {
        denseEmbedding = outputAny.data;
      } else if (outputAny.data && outputAny.data instanceof Float32Array) {
        // Handle Tensor objects with Float32Array data
        denseEmbedding = Array.from(outputAny.data);
      } else if (
        outputAny.last_hidden_state &&
        Array.isArray(outputAny.last_hidden_state)
      ) {
        denseEmbedding = outputAny.last_hidden_state;
      } else if (Array.isArray(output)) {
        denseEmbedding = output;
      } else {
        console.error("❌ Unknown model output structure:", output);
        throw new Error("Unknown model output structure");
      }

      // Normalize the dense embedding by dividing by the magnitude
      const magnitude = Math.sqrt(
        denseEmbedding.reduce((sum, val) => sum + val * val, 0)
      );
      const normalizedEmbedding = denseEmbedding.map((val) => val / magnitude);

      console.log("Query embedding:", {
        length: normalizedEmbedding.length,
        magnitude: magnitude.toFixed(4),
      });

      return normalizedEmbedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  // function to normalize embedding
  private normalizeEmbedding(embedding: SparseEmbedding): SparseEmbedding {
    if (embedding.magnitude === 0) return embedding;

    // L2 normalization
    const normalizedValues = embedding.values.map(
      (val) => val / embedding.magnitude
    );

    return {
      ...embedding,
      values: normalizedValues,
      magnitude: 1.0, // After normalization, magnitude is 1
    };
  }

  private async embedLocations(
    locations: LocationResult[]
  ): Promise<number[][]> {
    return Promise.all(
      locations.map(async (loc) => {
        // combine all fields into a single text query for better embedding
        let text = "";
        if (loc.name) text += `${loc.name}`;
        if (loc.description) text += ` ${loc.description}`;
        if (loc.formatted_address) text += ` ${loc.formatted_address}`;
        if (loc.types && loc.types.length > 0)
          text += ` ${loc.types.join(", ")}`;
        if (loc.rating) text += ` rating ${loc.rating}`;

        text = text.trim();

        // Use embedQuery which already handles normalization
        return await this.embedQuery(text);
      })
    );
  }

  private getReviews(reviews: string[]): string[] {
    // Simple review filtering - return first few reviews
    return reviews.slice(0, 3);
  }

  // search places on yelp and get raw location data
  private async searchPlaces(
    query: string,
    userLocation: string = "",
    notesContent: string = ""
  ): Promise<LocationResult[]> {
    console.log("Searching Yelp API for:", query);
    // fetch response to user query from yelp search api
    const response = await fetch(
      `/api/locations?query=${encodeURIComponent(query)}&location=${encodeURIComponent(userLocation)}&notesContent=${encodeURIComponent(notesContent)}`
    );

    const data = await response.json();
    console.log(
      "Yelp API response:",
      data.results?.length || 0,
      "results found"
    );
    return (data.results || []).slice(0, 10); // get top 10 results
  }

  // ranking pipeline for results
  private async rankBySimilarity(
    queryEmbedding: number[],
    locations: LocationResult[]
  ): Promise<LocationResult[]> {
    if (locations.length === 0) return [];

    console.log(
      "🎯 Starting similarity ranking for",
      locations.length,
      "locations"
    );

    // create embeddings for all search results
    const locationEmbeddings = await this.embedLocations(locations);

    // calculate similarities and embed scores
    const scoredLocations = locations.map((location, index) => {
      const similarity = this.calculateDenseSimilarity(
        queryEmbedding,
        locationEmbeddings[index]
      );

      // Raw parameter output
      console.log(`${location.name}:`);
      console.log(`   Similarity Score: ${similarity.toFixed(4)}`);
      console.log(`   Categories: ${location.types.join(", ")}`);
      console.log(`   Rating: ${location.rating || "N/A"}`);
      console.log(`   Address: ${location.formatted_address}`);

      return {
        ...location,
        similarity_score: similarity,
      };
    });

    // get the most similar elements
    const filtered = scoredLocations.sort(
      (a, b) => b.similarity_score! - a.similarity_score!
    );

    console.log("Top 5 locations ranked by similarity:");
    filtered.slice(0, 5).forEach((location, index) => {
      console.log(
        `   ${index + 1}. ${location.name} (${location.similarity_score!.toFixed(4)})`
      );
    });

    return filtered.slice(0, 5);
  }

  //*--- main pipeline ----*//
  async searchLocations(
    userQuery: string,
    notesContent: string = ""
  ): Promise<{
    results: LocationResult[];
    queryEmbedding: number[];
  }> {
    if (!userQuery.trim()) {
      return {
        results: [],
        queryEmbedding: [],
      };
    }

    const cacheKey = userQuery.toLowerCase().trim(); // use user query as the key to access cache
    // return cache if exists
    const cached = this.searchCache.get(cacheKey);
    if (cached)
      return {
        results: cached.results,
        queryEmbedding: [],
      };

    try {
      // create embedding
      const queryEmbedding = await this.embedQuery(userQuery);

      // search yelp places
      const rawResults = await this.searchPlaces(userQuery, "", notesContent);

      // ranking
      const rankedResults = await this.rankBySimilarity(
        queryEmbedding,
        rawResults
      );

      // Cache results with embedding
      this.searchCache.set(cacheKey, {
        results: rankedResults,
        timestamp: Date.now(),
      });

      // Cleanup cache
      if (this.searchCache.size > 50) {
        const oldestKey = this.searchCache.keys().next().value;
        if (oldestKey) {
          this.searchCache.delete(oldestKey);
        }
      }

      return { results: rankedResults, queryEmbedding };
    } catch (error) {
      console.error("Search error:", error);
      return {
        results: [],
        queryEmbedding: [],
      };
    }
  }

  // keyword-enhanced location search
  async searchLocationsWithContext(
    userQuery: string,
    notesContent: string
  ): Promise<LocationResult | null> {
    if (!userQuery.trim()) return null;

    // Create a cache key that includes both query and notes content
    const cacheKey = `${userQuery}:${notesContent.slice(0, 100)}`;

    // Check if we already have results for this exact query and context
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutes cache
      console.log("🔄 Using cached results for:", userQuery);
      return cached.results.length > 0 ? cached.results[0] : null;
    }

    try {
      console.log("Starting location search with context");
      console.log("User query:", userQuery);
      console.log("Notes content length:", notesContent.length);

      // Extract location context first
      const locationContext = this.extractLocationContext(notesContent);
      console.log("Using location context:", locationContext);

      // Create enhanced query with location context
      const ambianceTerms = this.extractAmbianceTerms(userQuery);
      const contextualQuery = `${ambianceTerms} ${locationContext}`.trim();
      console.log("Contextual query:", contextualQuery);

      // Search with location context first
      let searchResult = await this.searchLocations(
        contextualQuery,
        notesContent
      );
      console.log(
        "Contextual search results:",
        searchResult.results.length,
        "locations found"
      );

      // If no results with contextual query, try with original user query
      if (searchResult.results.length === 0) {
        console.log(
          "No results with contextual query, trying original query..."
        );
        searchResult = await this.searchLocations(userQuery, notesContent);
      }

      console.log(
        "Final search results:",
        searchResult.results.length,
        "locations found"
      );

      // Now use embeddings to rank the results by similarity to user query
      if (searchResult.results.length > 0) {
        console.log("Using embeddings to rank results by similarity...");

        // Create embedding for the user's original query (not the enhanced one)
        const queryEmbedding = await this.embedQuery(userQuery);

        // Log the final query and combined location representation used in embedding
        console.log("=== LOCATION SELECTION REASONING ===");
        console.log("Final query used for embedding:", userQuery);
        console.log("Combined location representation:", {
          originalQuery: userQuery,
          locationContext: locationContext,
          ambianceTerms: ambianceTerms,
          contextualQuery: contextualQuery,
          queryEmbeddingLength: queryEmbedding.length,
          queryEmbeddingMagnitude: Math.sqrt(
            queryEmbedding.reduce((sum, val) => sum + val * val, 0)
          ).toFixed(4),
        });

        // Rank results by similarity to the original user query
        const rankedResults = await this.rankBySimilarity(
          queryEmbedding,
          searchResult.results
        );

        // Cache the results
        this.searchCache.set(cacheKey, {
          results: rankedResults,
          timestamp: Date.now(),
        });

        // Return the best match
        const bestMatch = rankedResults.length > 0 ? rankedResults[0] : null;
        if (bestMatch) {
          console.log("BEST LOCATION SELECTED:");
          console.log(`   Name: ${bestMatch.name}`);
          console.log(
            `   Similarity Score: ${bestMatch.similarity_score?.toFixed(4) || 0}`
          );
          console.log(`   Categories: ${bestMatch.types.join(", ")}`);
          console.log(`   Rating: ${bestMatch.rating || "N/A"}`);
          console.log(`   Address: ${bestMatch.formatted_address}`);
        } else {
          console.log("No locations found after all fallback strategies");
        }
        return bestMatch;
      } else {
        console.log("No locations found after all fallback strategies");
        return null;
      }
    } catch (error) {
      console.error("Keyword-enhanced search error:", error);
      return null;
    }
  }
}

export default SearchService;
