import {
  JsonApiResponse,
  SearchResponse,
  GeoDocumentDetails,
  SortOption,
  Facet,
  FacetGroup,
} from '../types/api';
import { FacetFilter } from '../types/search';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const defaultHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/json',
  // Only include CSRF token if it exists
  ...(import.meta.env.VITE_CSRF_TOKEN
    ? {
      'X-CSRF-Token': import.meta.env.VITE_CSRF_TOKEN,
    }
    : {}),
};

const defaultFetchOptions: FetchOptions = {
  useJsonp: import.meta.env.VITE_USE_JSONP === 'true',
};

// Add a request cache at the top of the file
const requestCache: Record<string, Promise<any>> = {};

// Helper function to ensure HTTPS URL
function ensureHttps(url: string): string {
  // Check if the environment variable for enforcing HTTPS is set to true
  const enforceHttps = import.meta.env.VITE_ENFORCE_HTTPS === 'true';
  if (enforceHttps) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
}

// Helper function to create a URL with common parameters
function createApiUrl(baseUrl: string): URL {
  const url = new URL(ensureHttps(baseUrl), window.location.origin);
  url.searchParams.set('format', 'json');
  return url;
}

// Add this helper function to convert WKT to GeoJSON object
function wktToGeoJSON(wkt: string | null): GeoJSON.FeatureCollection | null {
  if (!wkt) return null;

  try {
    // Match the polygon coordinates
    const match = wkt.match(/POLYGON\(\((.*?)\)\)/);
    if (!match) return null;

    // Split into coordinate pairs and convert to numbers
    const coordinates = match[1]
      .split(',')
      .map((pair) => {
        try {
          const [lon, lat] = pair.trim().split(' ').map(Number);
          if (isNaN(lon) || isNaN(lat)) return null;
          return [lon, lat];
        } catch (e) {
          console.error('Error converting WKT to GeoJSON:', e);
          return null;
        }
      })
      .filter((coord): coord is [number, number] => coord !== null);

    // Ensure we have valid coordinates
    if (coordinates.length < 3) return null;

    // Create GeoJSON FeatureCollection structure
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        },
      ],
    };
  } catch (error) {
    console.error('Error converting WKT to GeoJSON:', error);
    return null;
  }
}


function transformDocument(item: any): GeoDocumentDetails {
  const attributes = item.attributes || {};
  const ogm = attributes.ogm || {};
  const meta = item.meta || {};
  const metaUi = meta.ui || {};
  const metaViewer = meta.viewer || {};

  return {
    id: item.id,
    type: item.type,
    attributes: {
      id: item.id,
      dct_title_s: ogm.dct_title_s,
      dct_creator_sm: ogm.dct_creator_sm || [],
      dct_description_sm: ogm.dct_description_sm || [],
      dc_publisher_sm: ogm.dc_publisher_sm || [],
      dct_spatial_sm: ogm.dct_spatial_sm || [],
      gbl_resourceclass_sm: ogm.gbl_resourceClass_sm || ogm.gbl_resourceclass_sm || [],
      gbl_resourcetype_sm: ogm.gbl_resourceType_sm || ogm.gbl_resourcetype_sm || [],
      b1g_language_sm: ogm.b1g_language_sm || [],
      dct_language_sm: ogm.dct_language_sm || [],
      dct_subject_sm: ogm.dct_subject_sm || [],
      dc_subject_sm: ogm.dc_subject_sm || [],
      schema_provider_s: ogm.schema_provider_s || '',
      dct_provenance_s: ogm.schema_provider_s || '',
      dct_accessrights_s: ogm.dct_accessRights_s || ogm.dct_accessrights_s || '',
      gbl_georeferenced_b: ogm.gbl_georeferenced_b ? 'true' : 'false',
      b1g_georeferenced_allmaps_b: ogm.b1g_georeferenced_allmaps_b || '',
      dct_temporal_sm: ogm.dct_temporal_sm || [],
      dct_rightsholder_sm: ogm.dct_rightsholder_sm || [],
      dct_license_sm: ogm.dct_license_sm || [],
      dct_references_s: ogm.dct_references_s || '',
      locn_geometry: ogm.locn_geometry,
      gbl_wxsidentifier_s: ogm.gbl_wxsIdentifier_s || '',
      ui_downloads: metaUi.downloads || [],
      ui_citation: metaUi.citation || '',
    },
    ui_thumbnail_url: metaUi.thumbnail_url || attributes.ui_thumbnail_url || '',
    ui_citation: metaUi.citation || '',
    ui_viewer_protocol: metaViewer.protocol || attributes.ui_viewer_protocol || '',
    ui_viewer_endpoint: metaViewer.endpoint || attributes.ui_viewer_endpoint || '',
    ui_viewer_geometry: metaViewer.geometry || attributes.ui_viewer_geometry || wktToGeoJSON(ogm.locn_geometry || null),
    // Detailed fields
    creator_sm: ogm.dct_creator_sm || [],
    dct_spatial_sm: ogm.dct_spatial_sm || [],
    dc_subject_sm: ogm.dc_subject_sm || [],
  };
}
// ...
export async function fetchSearchResults(
  query: string,
  page: number = 1,
  perPage: number = 10,
  facets: FacetFilter[] = [],
  onApiCall?: (url: string) => void,
  sort?: string,
  bbox?: string,
  options: FetchOptions = defaultFetchOptions
): Promise<SearchResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/search`
    : 'https://geo.btaa.org/api/v1/search';
  const url = createApiUrl(baseUrl);

  // Ensure we ask for JSON:API format to get metadata like thumbnails
  url.searchParams.set('response_format', 'json_api');
  url.searchParams.set('datetime_format', 'iso8601');

  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', query);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());

  if (sort && sort !== 'relevance') {
    url.searchParams.set('sort', sort);
  }

  if (bbox) {
    url.searchParams.set('bbox', bbox);
  }

  facets.forEach(({ field, value }) => {
    url.searchParams.append(`fq[${field}][]`, value);
  });

  if (onApiCall) {
    onApiCall(url.toString());
  }

  try {
    const response = await unifiedFetch<JsonApiResponse>(
      url.toString(),
      options
    );
    return transformJsonApiResponse(response);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

function transformJsonApiResponse(jsonApiResponse: JsonApiResponse): SearchResponse {
  // Transform documents
  const docs = jsonApiResponse.data.map(transformDocument);

  // Transform included facets
  const facets = jsonApiResponse.included
    ?.filter((item): item is Facet => item.type === 'facet')
    .reduce((acc, facet) => {
      acc[facet.id] = {
        label: facet.attributes.label,
        items: facet.attributes.items.map(([value, hits]) => ({
          label: value.toString(),
          value: value,
          hits: hits,
          url: facet.links.applyTemplate.replace('{value}', encodeURIComponent(value.toString())),
        })),
      };
      return acc;
    }, {} as { [key: string]: FacetGroup });

  // Transform sort options
  const sortOptions = jsonApiResponse.included
    ?.filter((item): item is SortOption => item.type === 'sort')
    .map(item => ({
      type: 'sort' as const,
      id: item.id,
      attributes: {
        label: item.attributes.label,
      },
      links: {
        self: item.links.self,
      },
    }));

  return {
    response: {
      docs,
      numFound: jsonApiResponse.meta.totalCount,
      start: ((jsonApiResponse.meta.currentPage || 1) - 1) * 10,
      maxScore: 1.0,
    },
    facets: facets || {},
    sortOptions: sortOptions || [],
    meta: {
      pages: {
        current_page: jsonApiResponse.meta.currentPage,
        next_page: null,
        prev_page: null,
        total_pages: jsonApiResponse.meta.totalPages,
        limit_value: 10,
        offset_value: ((jsonApiResponse.meta.currentPage || 1) - 1) * 10,
        total_count: jsonApiResponse.meta.totalCount,
        first_page: jsonApiResponse.meta.currentPage === 1,
        last_page: jsonApiResponse.meta.currentPage === jsonApiResponse.meta.totalPages,
      },
      spelling_suggestions: jsonApiResponse.meta.spellingSuggestions || [],
    },
  };
}

// ... jsonp and unifiedFetch ...

export async function fetchItemDetails(
  id: string,
  onApiCall?: (url: string) => void,
  options: FetchOptions = defaultFetchOptions
): Promise<GeoDocumentDetails> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/resources/`
    : 'https://geo.btaa.org/';
  const url = createApiUrl(`${baseUrl}${id}`);

  // Ensure we ask for JSON:API format
  url.searchParams.set('response_format', 'json_api');
  url.searchParams.set('datetime_format', 'iso8601');

  onApiCall?.(url.toString());

  try {
    const response = await unifiedFetch<{
      data: {
        id: string;
        type: string;
        attributes: {
          ogm: any;
          b1g?: any
        }
      };
      meta?: {
        ui?: any;
        viewer?: any;
      }
    }>(
      url.toString(),
      options
    );
    console.log('Item details response:', response);

    const item = response.data;
    const ogm = item.attributes.ogm || {};
    const metaUi = response.meta?.ui || {};
    const metaViewer = response.meta?.viewer || {};

    // Map API fields (CamelCase) to internal types (lowercase)
    const attributes = {
      id: item.id,
      dct_title_s: ogm.dct_title_s,
      dct_creator_sm: ogm.dct_creator_sm || [],
      dct_description_sm: ogm.dct_description_sm || [],
      dc_publisher_sm: ogm.dc_publisher_sm || [],
      dct_spatial_sm: ogm.dct_spatial_sm || [],
      gbl_resourceclass_sm: ogm.gbl_resourceClass_sm || [],
      gbl_resourcetype_sm: ogm.gbl_resourceType_sm || [],
      b1g_language_sm: ogm.b1g_language_sm || [], // Check casing? Response had dct_language_sm
      dct_language_sm: ogm.dct_language_sm || [],
      dct_subject_sm: ogm.dct_subject_sm || [],
      dc_subject_sm: ogm.dc_subject_sm || [],
      schema_provider_s: ogm.schema_provider_s || '',
      dct_provenance_s: ogm.schema_provider_s || '', // Map provider to provenance if missing?
      dct_accessrights_s: ogm.dct_accessRights_s || '',
      gbl_georeferenced_b: ogm.gbl_georeferenced_b ? 'true' : 'false',
      b1g_georeferenced_allmaps_b: ogm.b1g_georeferenced_allmaps_b || '',
      dct_temporal_sm: ogm.dct_temporal_sm || [],
      dct_issued_s: ogm.dct_issued_s || '',
      dct_rightsholder_sm: ogm.dct_rightsholder_sm || [],
      dct_license_sm: ogm.dct_license_sm || [],
      dct_references_s: ogm.dct_references_s || '',
      locn_geometry: ogm.locn_geometry,
      gbl_wxsidentifier_s: ogm.gbl_wxsIdentifier_s || '', // Guessing casing or might be absent
      dct_identifier_sm: ogm.dct_identifier_sm || [],
      dct_format_s: ogm.dct_format_s || '',

      // Inject UI fields into attributes for legacy components if they look there
      ui_downloads: metaUi.downloads || [],
      ui_relationships: metaUi.relationships || {},
      ui_citation: metaUi.citation || '',
    };

    return {
      id: item.id,
      type: item.type,
      attributes: attributes, // Top level attributes
      ui_thumbnail_url: metaUi.thumbnail_url || '',
      ui_citation: metaUi.citation || '',
      ui_viewer_protocol: metaViewer.protocol || '',
      ui_viewer_endpoint: metaViewer.endpoint || '',
      ui_viewer_geometry: metaViewer.geometry || wktToGeoJSON(ogm.locn_geometry || null),

      // Helper fields for GeoDocumentDetails
      creator_sm: ogm.dct_creator_sm || [],
      dct_spatial_sm: ogm.dct_spatial_sm || [],
      dc_subject_sm: ogm.dc_subject_sm || [],
    };
  } catch (error) {
    console.error('Error fetching item details:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Failed to fetch item details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ... jsonp and unifiedFetch ...

// Update the jsonp function to use the cache
function jsonp<T>(url: string, callbackName: string = 'rui'): Promise<T> {
  console.log('Starting JSONP request:', url);

  // Check if this URL is already being requested
  const cacheKey = url;
  if (requestCache[cacheKey]) {
    console.log('Using cached JSONP request for:', url);
    return requestCache[cacheKey] as Promise<T>;
  }

  // Create a new promise for this request
  const requestPromise = new Promise<T>((resolve, reject) => {
    const uniqueCallback = `${callbackName}_${Date.now()}`;
    console.log('Using callback name:', uniqueCallback);
    let script: HTMLScriptElement | null = document.createElement('script');
    // Set timeout to prevent hanging requests
    const timeoutId = window.setTimeout(() => {
      console.error('JSONP request timed out:', url);
      cleanup();
      reject(new Error('JSONP request timed out'));
      // Remove from cache on timeout
      delete requestCache[cacheKey];
    }, 30000); // 30 second timeout

    // Cleanup function to remove script and callback
    const cleanup = () => {
      console.log('Cleaning up JSONP request:', uniqueCallback);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[uniqueCallback];
      window.clearTimeout(timeoutId);
      script = null;
    };

    // Add the callback to window
    (window as any)[uniqueCallback] = (
      data: T | { detail: string; path: string; method: string }
    ) => {
      console.log('JSONP callback received data:', data);
      cleanup();

      // Check if response is an error
      if (typeof data === 'object' && data !== null && 'detail' in data) {
        console.error('JSONP error response:', data);
        reject(new ApiError(`API Error: ${data.detail}`));
        // Remove from cache on error
        delete requestCache[cacheKey];
        return;
      }

      resolve(data as T);
      // Keep successful responses in cache for 5 seconds
      setTimeout(() => {
        delete requestCache[cacheKey];
      }, 5000);
    };

    // Create script element with all properties set before appending to DOM
    const urlWithCallback = new URL(ensureHttps(url));
    urlWithCallback.searchParams.set('callback', uniqueCallback);
    if (!urlWithCallback.searchParams.has('format')) {
      urlWithCallback.searchParams.set('format', 'json');
    }

    console.log('Final JSONP URL:', urlWithCallback.toString());

    if (script) {
      script.src = urlWithCallback.toString();
      script.onerror = (error) => {
        console.error('JSONP script error:', error);
        cleanup();
        reject(new Error('JSONP request failed'));
        // Remove from cache on error
        delete requestCache[cacheKey];
      };
      script.crossOrigin = 'anonymous';

      // Only append the script to the document once
      document.head.appendChild(script);
      console.log('JSONP script added to document');
    }
  });

  // Store the promise in the cache
  requestCache[cacheKey] = requestPromise;
  return requestPromise;
}

interface FetchOptions {
  useJsonp?: boolean;
}

async function unifiedFetch<T>(
  url: string,
  options: FetchOptions = defaultFetchOptions
): Promise<T> {
  const finalUrl = new URL(ensureHttps(url), window.location.origin);
  console.log('unifiedFetch called with options:', {
    url: finalUrl.toString(),
    useJsonp: options.useJsonp,
    envValue: import.meta.env.VITE_USE_JSONP,
  });

  // Ensure format parameter is set
  if (!finalUrl.searchParams.has('format')) {
    finalUrl.searchParams.set('format', 'json');
  }

  if (options.useJsonp) {
    console.log('Using JSONP for request:', finalUrl.toString());
    return jsonp<T>(finalUrl.toString());
  }

  console.log('Using regular fetch:', finalUrl.toString());

  // For document endpoints, request a specific response format
  if (url.includes('/resources/')) {
    finalUrl.searchParams.set('response_format', 'json_api');
    finalUrl.searchParams.set('datetime_format', 'iso8601');
  }

  try {
    const response = await fetch(finalUrl.toString(), {
      headers: {
        ...defaultHeaders,
        Accept: 'application/javascript, application/json',
      },
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new ApiError(
          errorJson.detail || 'API request failed',
          response.status
        );
      } catch (e) {
        console.error('Error parsing API error response:', e);
        throw new ApiError(
          `HTTP error ${response.status}: ${errorText}`,
          response.status
        );
      }
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}



// NOTE: fetchItemDetails is already defined above, ensuring no duplicates.

interface Suggestion {
  type: 'suggestion';
  id: string;
  attributes: {
    text: string;
    title: string;
    score: number;
  };
}

interface SuggestResponse {
  data: Suggestion[];
}

export async function fetchSuggestions(
  query: string,
  options: FetchOptions = defaultFetchOptions
): Promise<Suggestion[]> {
  if (!query.trim()) return [];

  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/suggest`
    : 'https://geo.btaa.org/suggest';

  const url = createApiUrl(baseUrl);
  url.searchParams.set('q', query);

  try {
    const data = await unifiedFetch<SuggestResponse>(url.toString(), options);
    // Only return the text field from each suggestion
    return data.data.map((suggestion) => ({
      ...suggestion,
      attributes: {
        ...suggestion.attributes,
        // Remove the title from the display
        title: '',
      },
    }));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

export async function fetchBookmarkedItems(
  ids: string[],
  onApiCall?: (url: string) => void,
  options: FetchOptions = defaultFetchOptions
): Promise<SearchResponse> {
  if (ids.length === 0) {
    return {
      response: { docs: [], numFound: 0, start: 0, maxScore: 0 },
      facets: {},
      sortOptions: [],
      meta: {
        pages: {
          current_page: 1,
          total_pages: 0,
          limit_value: 10,
          offset_value: 0,
          total_count: 0,
          next_page: null,
          prev_page: null
        },
        spelling_suggestions: []
      }
    };
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/search/`
    : 'https://geo.btaa.org/';
  const url = createApiUrl(baseUrl);

  url.searchParams.set('search_field', 'all_fields');
  url.searchParams.set('q', '');

  ids.forEach((id) => {
    url.searchParams.append('fq[id_agg][]', id);
  });

  const finalUrl = url.toString();
  onApiCall?.(finalUrl);

  try {
    const data = await unifiedFetch<JsonApiResponse>(finalUrl, options);

    if (!data.data || !Array.isArray(data.data)) {
      throw new ApiError('Invalid response format from API');
    }

    return transformJsonApiResponse(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(`Failed to fetch bookmarked items: ${error.message}`);
    }
    throw new ApiError('Failed to fetch bookmarked items');
  }
}
