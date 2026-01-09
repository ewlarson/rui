import React from 'react';
import { Link } from 'react-router-dom';

interface SimilarItem {
    id: string;
    title: string;
    thumbnail_url?: string;
    temporal_coverage?: string[];
}

interface SimilarItemsProps {
    items?: SimilarItem[];
}

export function SimilarItems({ items }: SimilarItemsProps) {
    console.log('SimilarItems items:', items);
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Similar Items</h2>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to={`/items/${item.id}`}
                            className="group block"
                        >
                            <div className="w-full h-48 overflow-hidden rounded-lg bg-gray-100 mb-2 border border-gray-200">
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.title}
                                        className="h-full w-full object-cover object-center group-hover:opacity-75"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                                        <span className="text-sm">No Preview</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                                {item.title}
                            </h3>
                            {item.temporal_coverage && item.temporal_coverage.length > 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                    {item.temporal_coverage.join(', ')}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
