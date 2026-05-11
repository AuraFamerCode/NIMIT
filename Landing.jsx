/**
 * Landing page component - renders the static HTML content directly
 */
export default function Landing() {
  return (
    <div className="block h-[100dvh] w-full min-h-screen bg-[#131313]">
      <iframe
        title="YuktiAI"
        src="/landing.html"
        className="block h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
