export const FACET_LABELS: Record<string, string> = {
  dct_spatial_sm: 'Place',
  gbl_resourceClass_sm: 'Resource Class',
  gbl_resourceType_sm: 'Resource Type',
  dct_publisher_sm: 'Provider',
  dct_creator_sm: 'Creator',
  dct_accessRights_s: 'Access',
  dct_year_sm: 'Year',
  b1g_language_sm: 'Language',
  gbl_georeferenced_b: 'Georeferenced',
  // ... add more facets and control their order through this object
};

// We could also add an explicit order array
export const FACET_ORDER = [
  'dct_spatial_sm',
  'gbl_resourceClass_sm',
  'gbl_resourceType_sm',
  'dct_publisher_sm',
  'dct_creator_sm',
  'dct_accessRights_s',
  'dct_year_sm',
  'b1g_language_sm',
  'gbl_georeferenced_b',
  // ... etc
];

export function getFacetLabel(field: string): string {
  return FACET_LABELS[field] || field;
}
