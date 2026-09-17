import path from 'path';
import { fileURLToPath } from 'url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { imageHosts } from './image-hosts.config.mjs';

const withBundleAnalyzerConfig = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix workspace root resolution to avoid scanning parent user directory
    outputFileTracingRoot: path.resolve(__dirname),
    
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
    
    webpack(config, { dev }) {
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

export default withBundleAnalyzerConfig(nextConfig);