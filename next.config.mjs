import path from 'path';
import { fileURLToPath } from 'url';
import { imageHosts } from './image-hosts.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix workspace root resolution to avoid scanning parent user directory
    outputFileTracingRoot: path.resolve(__dirname),
    
    serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth', '@napi-rs/canvas', 'docx', 'pptxgenjs'],
    
    // Explicitly trace pdfjs worker into Vercel/Next serverless function bundles
    outputFileTracingIncludes: {
        '/api/documents/parse': [
            './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
            './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            './node_modules/pdfjs-dist/build/pdf.worker.mjs',
            './node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
        ],
        '/api/**/*': [
            './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
        ],
    },
    
    // Performance and compression
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    productionBrowserSourceMaps: process.env.GENERATE_SOURCEMAPS === 'true',
    distDir: process.env.DIST_DIR || '.next',
    
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: imageHosts,
        minimumCacheTTL: 3600,
        formats: ['image/avif', 'image/webp'],
        qualities: [75, 85, 100],
    },

    // 301 Permanent Redirects
    // These are evaluated at the edge before any page rendering.
    async redirects() {
        return [
            // Normalize old/alternate URL patterns
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            {
                source: '/index',
                destination: '/',
                permanent: true,
            },
            // Redirect old chat URL patterns to current workspace
            {
                source: '/chat',
                destination: '/ai-topper-chat',
                permanent: true,
            },
            {
                source: '/study',
                destination: '/ai-study-assistant',
                permanent: true,
            },
            {
                source: '/flashcards',
                destination: '/ai-flashcard-generator',
                permanent: true,
            },
            {
                source: '/quiz',
                destination: '/ai-quiz-generator',
                permanent: true,
            },
            {
                source: '/planner',
                destination: '/ai-study-planner',
                permanent: true,
            },
            {
                source: '/exam-prep',
                destination: '/ai-exam-prep',
                permanent: true,
            },
            // Legacy/alternative URL patterns
            {
                source: '/privacy-policy',
                destination: '/privacy',
                permanent: true,
            },
            {
                source: '/terms-of-service',
                destination: '/terms',
                permanent: true,
            },
            {
                source: '/terms-and-conditions',
                destination: '/terms',
                permanent: true,
            },
            {
                source: '/help',
                destination: '/faq',
                permanent: true,
            },
            {
                source: '/support',
                destination: '/contact',
                permanent: true,
            },
            {
                source: '/pricing',
                destination: '/upgrade',
                permanent: true,
            },
            {
                source: '/plans',
                destination: '/upgrade',
                permanent: true,
            },
        ];
    },
    
    // Optimize barrel package imports for lightning-fast compilation and minimal bundle size
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            'framer-motion',
            'motion',
            '@radix-ui/react-slot',
            '@radix-ui/react-toggle',
            'clsx',
            'tailwind-merge',
            'sonner',
        ],
    },
    
    webpack(config, { dev, isServer }) {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                child_process: false,
                'node:fs': false,
            };
        }
        if (dev) {
            // Only enable component-tagger if explicitly requested to avoid AST parsing overhead
            if (process.env.ENABLE_COMPONENT_TAGGER === 'true') {
                config.module.rules.push({
                    test: /\.(jsx|tsx)$/,
                    exclude: [/node_modules/],
                    use: [{
                        loader: '@dhiwise/component-tagger/nextLoader',
                    }],
                });
            }

            const ignoredPaths = (process.env.WATCH_IGNORED_PATHS || '')
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean);

            config.watchOptions = {
                ignored: [
                    '**/.git/**',
                    '**/.next/**',
                    '**/node_modules/**',
                    ...(ignoredPaths.length
                        ? ignoredPaths.map((p) => `**/${p.replace(/^\/+|\/+$/g, '')}/**`)
                        : []),
                ],
                aggregateTimeout: 200,
                poll: false,
            };
        }
        return config;
    },
};

export default process.env.ANALYZE === 'true'
    ? (await import('@next/bundle-analyzer')).default({ enabled: true })(nextConfig)
    : nextConfig;