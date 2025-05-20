import React from 'react';
import { X, Search, XCircle, MapPin } from 'lucide-react';
import type { FacetFilter } from '../../types/search';
import { getFacetLabel } from '../../utils/facetLabels';

interface SearchConstraintsProps {
  facets: FacetFilter[];
  query: string;
  bbox?: string;
  onRemoveFacet: (facet: FacetFilter) => void;
  onRemoveQuery: () => void;
  onRemoveBbox: () => void;
  onClearAll: () => void;
}

export function SearchConstraints({
  facets,
  query,
  bbox,
  onRemoveFacet,
  onRemoveQuery,
  onRemoveBbox,
  onClearAll,
}: SearchConstraintsProps) {
  if (facets.length === 0 && !query && !bbox) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-medium text-gray-500">Active Filters:</h2>
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <XCircle size={16} />
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {query && (
          <button
            onClick={onRemoveQuery}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Search size={14} className="text-blue-500" />
            <span className="text-sm">Search: {query}</span>
            <X size={14} className="text-blue-500" />
          </button>
        )}
        {bbox && (
          <button
            onClick={onRemoveBbox}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <MapPin size={14} className="text-blue-500" />
            <span className="text-sm">Map Area</span>
            <X size={14} className="text-blue-500" />
          </button>
        )}
        {facets.map((facet, index) => (
          <button
            key={`${facet.field}-${index}`}
            onClick={() => onRemoveFacet(facet)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <span className="text-sm">
              {getFacetLabel(facet.field)}: {facet.value}
            </span>
            <X size={14} className="text-blue-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
