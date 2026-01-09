import React from 'react';

interface LinkItem {
    label: string;
    url: string;
}

interface LinksTableProps {
    links?: Record<string, LinkItem[]>;
}

export function LinksTable({ links }: LinksTableProps) {
    // Check if there are any links
    if (!links || Object.keys(links).length === 0) return null;

    // Verify if there are any non-empty arrays
    const hasContent = Object.values(links).some(arr => arr.length > 0);
    if (!hasContent) return null;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Links</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {Object.entries(links).map(([category, categoryLinks]) => {
                    if (!categoryLinks || categoryLinks.length === 0) return null;

                    return (
                        <div key={category} className="px-6 py-4 hover:bg-gray-50">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {category}
                            </div>
                            <ul className="space-y-2">
                                {categoryLinks.map((link, idx) => (
                                    <li key={`${category}-${idx}`}>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
