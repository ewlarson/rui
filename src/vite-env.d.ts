/// <reference types="vite/client" />

interface Window {
    Stimulus: any;
    Geoblacklight: any;
}

declare module '@geoblacklight/frontend' {
    const content: any;
    export default content;
}
