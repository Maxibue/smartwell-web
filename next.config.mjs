/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    },
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },

    // ✅ SEGURIDAD: Headers de seguridad para proteger contra ataques comunes
    async headers() {
        return [
            {
                // Aplicar headers a todas las rutas
                source: '/:path*',
                headers: [
                    {
                        // Previene clickjacking - permite el sitio en su propia página
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        // Previene MIME sniffing - el navegador debe respetar el Content-Type
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        // Habilita protección XSS del navegador
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        // Content Security Policy - protege contra XSS y otros ataques de inyección
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://meet.jit.si https://8x8.vc https://js.hsforms.net https://js.hs-scripts.com https://js.hscollectedforms.net",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: https: blob: https://forms.hubspot.com https://hubspot-forms-static-embed.s3.amazonaws.com",
                            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://meet.jit.si wss://*.jitsi.net https://forms.hubspot.com https://api.hubspot.com https://forms.hsforms.com https://hubspot-forms-static-embed.s3.amazonaws.com",
                            "frame-src 'self' https://meet.jit.si https://8x8.vc https://forms.hubspot.com https://share.hsforms.com https://forms.hsforms.com",
                            "media-src 'self' https: blob:",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self' https://forms.hubspot.com",
                            "frame-ancestors 'self'",
                            "upgrade-insecure-requests"
                        ].join('; ')
                    }
                ]
            }
        ];
    }
};

export default nextConfig;

