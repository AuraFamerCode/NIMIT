/**
 * Full-page iframe loads `public/landing.html` — same markup and Tailwind CDN
 * as `code (1).html`, so styling matches the design exactly.
 * CTAs use target="_top" to leave the iframe and open `/app` in the main app.
 */
export default function Landing() {
  const src = `${import.meta.env.BASE_URL}landing.html`;
  return (
    <iframe
      title="YuktiAI"
      src={src}
      className="block h-[100dvh] w-full min-h-screen border-0 bg-[#131313]"
    />
  );
}
