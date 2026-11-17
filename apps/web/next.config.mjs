const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

// Pages that show private data must never be cached (rule 3).
const noStore = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
];

export default {
  transpilePackages: ["@phonebook/shared"],
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "@electric-sql/pglite"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noStore },
      { source: "/contacts/:path*", headers: noStore },
      { source: "/contacts", headers: noStore },
      { source: "/logins", headers: noStore },
      { source: "/settings/:path*", headers: noStore },
      { source: "/settings", headers: noStore },
      { source: "/login", headers: noStore },
      { source: "/signup", headers: noStore },
      { source: "/recover", headers: noStore },
    ];
  },
};
