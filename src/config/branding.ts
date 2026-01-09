export interface BrandingConfig {
    institutionName: string;
    appTitle: string;
    logo: {
        src: string;
        alt: string;
        width?: string;
        height?: string;
    };
    colors: {
        primary: string;
        secondary: string;
    };
    header: {
        title: string;
        showLogo: boolean;
    };
    footer: {
        text: string;
    };
}

export const brandingConfig: BrandingConfig = {
    institutionName: 'BTAA',
    appTitle: 'BTAA Geoportal',
    logo: {
        src: '/vite.svg', // Placeholder or actual logo path
        alt: 'BTAA Logo',
    },
    colors: {
        primary: '#3b82f6', // blue-500
        secondary: '#1d4ed8', // blue-700
    },
    header: {
        title: 'BTAA Geoportal',
        showLogo: true,
    },
    footer: {
        text: '© Big Ten Academic Alliance',
    },
};
