/** Makes /admin installable as an app on the phone ("Add to Home Screen" / "Install app"). */
export function GET() {
  return Response.json(
    {
      name: "SOM·DATT — Booking desk",
      short_name: "Bookings",
      description: "Requests, calendar and bookings for Somdatt Sharma.",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b0a09",
      theme_color: "#0b0a09",
      icons: [
        { src: "/admin-icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/admin-icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/admin-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } },
  );
}
