import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container section not-found">
      <span className="eyebrow">404 / CONNECTION NOT FOUND</span>
      <h1>
        This path
        <br />
        ends here<span className="gold-period">.</span>
      </h1>
      <p>Let’s find you a better way forward.</p>
      <Link href="/" className="button primary">
        Back to Kervan →
      </Link>
    </main>
  );
}
