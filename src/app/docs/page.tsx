import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/lib/docs";
export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Practical guides to installing, configuring and operating Kervan.",
  alternates: { canonical: "/docs/" },
};
export default function DocsIndex() {
  return (
    <main id="main" className="section container docs-index">
      <span className="eyebrow">BUILD ON A SHARED FOUNDATION</span>
      <h1>
        A clear path.
        <br />
        <span className="muted-heading">From here.</span>
      </h1>
      <p>Everything you need to connect, configure and run Kervan.</p>
      <div className="docs-index-grid">
        {docs.map((doc, i) => (
          <Link href={`/docs/${doc.slug}/`} key={doc.slug}>
            <span className="eyebrow">
              0{i + 1} / {doc.category}
            </span>
            <h2>
              {doc.title}
              <ArrowUpRight />
            </h2>
            <p>{doc.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
