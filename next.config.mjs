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
                        // Previene clickjacking - no permite que el sitio sea embebido en iframes
                        key: 'X-Frame-Options',
                        value: 'DENY'
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
                        // Controla cuánta información de referrer se envía
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        // Controla qué features del navegador pueden ser usadas
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
                    },
                    {
                        // Fuerza HTTPS en todas las conexiones futuras (1 año)
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    },
                    {
                        // Content Security Policy - protege contra XSS y otros ataques de inyección
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://meet.jit.si https://8x8.vc",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: https: blob:",
                            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://meet.jit.si wss://*.jitsi.net",
                            "frame-src 'self' https://meet.jit.si https://8x8.vc",
                            "media-src 'self' https: blob:",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                            "upgrade-insecure-requests"
                        ].join('; ')
                    }
                ]
            }
        ];
    }
};

export default nextConfig;

