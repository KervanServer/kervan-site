import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Info,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/code-block";
import { docs } from "@/lib/docs";
import { SITE, SOURCE_REVISION } from "@/lib/site";
export const dynamicParams = false;
export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs.find((d) => d.slug === slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}/` },
    openGraph: {
      title: `${doc.title} | Kervan`,
      description: doc.description,
      url: `${SITE}/docs/${doc.slug}/`,
    },
  };
}
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = docs.findIndex((d) => d.slug === slug);
  const doc = docs[index];
  if (!doc) notFound();
  const previous = docs[index - 1],
    next = docs[index + 1];
  return (
    <main id="main" className="container docs-layout">
      <aside className="docs-sidebar">
        <Link className="docs-back" href="/">
          <ArrowLeft size={14} />
          Back to Kervan
        </Link>
        <span className="eyebrow">
          <BookOpen size={14} /> DOCUMENTATION
        </span>
        <nav aria-label="Documentation">
          {docs.map((item, i) => (
            <div key={item.slug}>
              {(i === 0 || item.category !== docs[i - 1].category) && (
                <span className="docs-category">{item.category}</span>
              )}
              <Link
                href={`/docs/${item.slug}/`}
                aria-current={slug === item.slug ? "page" : undefined}
              >
                {item.title}
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </nav>
        <a
          className="docs-source"
          href={`https://github.com/KervanServer/kervan/tree/${SOURCE_REVISION}`}
        >
          Source-checked guide
          <ArrowUpRight size={13} />
          <small>Reviewed October 18, 2026</small>
        </a>
      </aside>
      <article className="docs-article">
        <div className="docs-breadcrumb">
          Documentation<span>/</span>
          {doc.category.toLowerCase()}
        </div>
        <span className="eyebrow">{doc.category}</span>
        <h1>
          {doc.title}
          <span className="gold-period">.</span>
        </h1>
        <p className="docs-description">{doc.description}</p>
        <div className="docs-meta">
          <span>
            <span className="live-dot" /> Kervan · v0.9.0
          </span>
          <a href={doc.source}>
            Read the upstream source
            <ArrowUpRight size={13} />
          </a>
        </div>
        {doc.sections.map((section) => (
          <section className="docs-section" id={section.id} key={section.id}>
            <h2>
              <a href={`#${section.id}`}>
                {section.title}
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            {section.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
            {section.code && (
              <CodeBlock
                code={section.code}
                title={section.language === "yaml" ? "kervan.yaml" : "terminal"}
                language={section.language ?? "bash"}
              />
            )}
            {section.table && (
              <section
                className="table-scroll"
                aria-label={`${section.title} table`}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable tables must be reachable by keyboard on narrow viewports.
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {section.table.headers.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => (
                          <td key={section.table?.headers[i]}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {section.note && (
              <div className="docs-note">
                <Info size={18} />
                <p>{section.note}</p>
              </div>
            )}
          </section>
        ))}
        <div className="docs-next">
          {previous ? (
            <Link href={`/docs/${previous.slug}/`}>
              <ArrowLeft size={17} />
              <span>
                <small>PREVIOUS</small>
                {previous.title}
              </span>
            </Link>
          ) : (
            <Link href="/">
              <ArrowLeft size={17} />
              Back to home
            </Link>
          )}
          {next && (
            <Link href={`/docs/${next.slug}/`}>
              <span>
                <small>NEXT</small>
                {next.title}
              </span>
              <ArrowRight size={17} />
            </Link>
          )}
        </div>
        <p className="docs-correction">
          Found something to improve?{" "}
          <a href="https://github.com/kervanserver/kervan-site/issues">
            Open a website issue
            <ArrowUpRight size={12} />
          </a>
        </p>
      </article>
      <aside className="docs-toc">
        <span className="eyebrow">ON THIS PAGE</span>
        <nav aria-label="On this page">
          {doc.sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </nav>
      </aside>
    </main>
  );
}
