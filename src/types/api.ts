export interface GeoAttributes {
  id: string;
  dct_title_s: string;
  dct_creator_sm: string[];
  dct_description_sm?: string[];
  dc_publisher_sm: string[];
  dct_spatial_sm: string[];
  gbl_resourceclass_sm: string[];
  gbl_resourcetype_sm: string[];
  b1g_language_sm: string[];
  dct_language_sm: string[];
  dc_subject_sm: string[];
  schema_provider_s: string;
  dct_accessrights_s: string;
  gbl_georeferenced_b: string;
  b1g_georeferenced_allmaps_b: string;
  dct_temporal_sm: string[];
  dct_rightsholder_sm: string[];
  dct_license_sm: string[];
  dct_subject_sm: string[];
  dct_references_s: string;
  dct_provenance_s?: string;
  dct_issued_s?: string;
  dct_format_s?: string;
  locn_geometry?: string;
  gbl_wxsidentifier_s?: string;
  ui_downloads?: any[];
  ui_citation?: string;
}

export interface GeoDocument {
  id: string;
  type: string;
  attributes: GeoAttributes;
  ui_thumbnail_url: string;
  ui_citation: string;
  ui_viewer_protocol: string;
  ui_viewer_endpoint: string;
  ui_viewer_geometry: any;
}

export interface GeoDocumentDetails extends GeoDocument {
  creator_sm: string[];
  dct_spatial_sm: string[];
  dc_subject_sm: string[];
  ui_links?: Record<string, { label: string; url: string }[]>;
  similar_items?: {
    id: string;
    title: string;
    thumbnail_url?: string;
    temporal_coverage?: string[];
  }[];
}

export interface ParsedFacet {
  field: string;
  value: string;
}

export interface Facet {
  type: 'facet';
  id: string;
  links: {
    applyTemplate: string;
  };
  attributes: {
    label: string;
    items: Array<[string | number, number]>;
  };
}

export interface SortOption {
  type: 'sort';
  id: string;
  attributes: {
    label: string;
  };
  links: {
    self: string;
  };
}

export interface JsonApiResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      ogm: {
        dct_title_s: string;
        dct_temporal_sm?: string[];
        dct_description_sm?: string[]; // Note: API has dct_description_sm, interface had description
        dct_provenance_s?: string;
        dc_publisher_sm?: string[];
        dct_issued_s?: string;
        dct_creator_sm?: string[]; // Note: API has dct_creator_sm, interface had creator_sm
        dct_spatial_sm?: string[];
        dc_subject_sm?: string[];
        dct_references_s?: string;
        gbl_resourceclass_sm?: string[];
        gbl_resourcetype_sm?: string[];
        b1g_language_sm?: string[];
        dct_accessrights_s?: string;
        gbl_georeferenced_b?: boolean; // API might be string or boolean check later
        b1g_georeferenced_allmaps_b?: string;
        dct_rightsholder_sm?: string[];
        dct_license_sm?: string[];
        locn_geometry?: string;
      };
      ui_viewer_protocol?: string;
      ui_viewer_endpoint?: string;
      ui_thumbnail_url?: string;
      ui_viewer_geometry?: any;
    };
    meta?: {
      ui?: {
        thumbnail_url?: string;
        citation?: string;
        downloads?: any[];
        links?: Record<string, any>;
        relationships?: Record<string, any>;
      };
      viewer?: {
        protocol?: string;
        endpoint?: string;
        geometry?: any;
      };
      static_map?: string;
    };
  }>;
  included?: Array<Facet | SortOption>;
  meta: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    query?: string;
    sort?: string | null;
    spellingSuggestions?: SpellingSuggestion[];
  };
}

interface SpellingSuggestion {
  text: string;
  highlighted: string;
  score: number;
}

interface SearchResponseMeta {
  pages: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    limit_value: number;
    offset_value: number;
    total_count: number;
    first_page?: boolean;
    last_page?: boolean;
  };
  spelling_suggestions: SpellingSuggestion[];
}

export interface SearchResponse {
  response: {
    numFound: number;
    start: number;
    maxScore: number;
    docs: GeoDocument[];
  };
  facets: {
    [key: string]: FacetGroup;
  };
  sortOptions: SortOption[];
  meta: SearchResponseMeta;
}

export interface FacetGroup {
  label: string;
  items: Array<{
    label: string;
    value: string | number;
    hits: number;
    url: string;
  }>;
}
