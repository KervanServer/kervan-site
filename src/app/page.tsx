import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  FileCheck2,
  FolderLock,
  Gauge,
  HardDrive,
  KeyRound,
  Layers3,
  Network,
  Package,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Architecture } from "@/components/architecture";
import { CopyButton } from "@/components/copy-button";
import { Github } from "@/components/github-icon";
import { HeroArt } from "@/components/hero-art";
import { Mark } from "@/components/logo";
import { ProtocolExplorer } from "@/components/protocol-explorer";
import { Quickstart } from "@/components/quickstart";
import { REPO, SITE, SOURCE, VERSION } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };
const faqs = [
  [
    "What is Kervan?",
    "Kervan is an open-source file transfer server written in pure Go. FTP, FTPS, SFTP and SCP share a single authentication engine, virtual filesystem, session manager and audit pipeline, packaged in one binary.",
  ],
  [
    "Do I need Go or a database to run it?",
    "No. Release archives contain a standalone binary with the WebUI embedded. The default user store is an embedded JSON-backed store. Go and Node.js are needed when building the server and its WebUI from source.",
  ],
  [
    "Can I use my existing clients?",
    "Kervan is tested with OpenSSH sftp/scp and curl. It implements FTP with active and passive modes, explicit and implicit FTPS, SFTP v3, and legacy SCP. The project lists broader FileZilla, WinSCP, lftp and Cyberduck interoperability checks on its roadmap; validate your specific client and workflow.",
  ],
  [
    "Is S3 storage available today?",
    "Yes. The current repository ships an S3-compatible backend using SigV4. Files are staged locally and uploaded in a single PutObject on close. Allow temporary disk space; the single-PUT limit is 5 GB and multipart upload is still planned.",
  ],
  [
    "How do I secure my first deployment?",
    "Create an admin before startup, use a unique strong password, and configure TLS for FTPS and the management interface. Prefer SFTP or FTPS for encrypted transfers. IP rules, per-user restrictions, scoped API keys and brute-force controls let you narrow access further.",
  ],
  [
    "Can I use Kervan commercially?",
    "Yes. Kervan is MIT licensed. You can use, modify and distribute it, including in commercial projects, under the license terms. The product repository contains the full license and contributor guide.",
  ],
];

function ManagementPreview() {
  return (
    <div className="management-preview">
      <div className="preview-top">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>
          <ShieldCheck size={12} /> localhost:8080
        </span>
        <span className="preview-tag">INTERFACE OVERVIEW</span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <Mark />
          <span className="preview-sidebar-label">WORKSPACE</span>
          {[
            { icon: Gauge, title: "Dashboard" },
            { icon: Users, title: "Users" },
            { icon: Network, title: "Sessions" },
            { icon: FolderLock, title: "Files" },
            { icon: Workflow, title: "Transfers" },
            { icon: FileCheck2, title: "Audit log" },
          ].map((item, i) => (
            <span className={i === 4 ? "selected" : ""} key={item.title}>
              <item.icon size={15} />
              {item.title}
            </span>
          ))}
          <span className="preview-admin">
            <span className="avatar">A</span>Administrator
          </span>
        </aside>
        <div className="preview-content">
          <div className="preview-title">
            <div>
              <span className="eyebrow">ONE PLACE TO SEE IT ALL</span>
              <h3>Transfers</h3>
            </div>
            <span className="preview-live">
              <span className="live-dot" /> Live updates
            </span>
          </div>
          <div className="preview-metrics">
            <div>
              <span>Track</span>
              <strong>Every session</strong>
              <Network size={21} />
            </div>
            <div>
              <span>Manage</span>
              <strong>Every protocol</strong>
              <Layers3 size={21} />
            </div>
            <div>
              <span>Understand</span>
              <strong>Every transfer</strong>
              <Radio size={21} />
            </div>
          </div>
          <div className="preview-table">
            <div className="preview-table-row table-head">
              <span>FILE</span>
              <span>PROTOCOL</span>
              <span>STATUS</span>
            </div>
            {[
              { file: "release.tar.gz", protocol: "SFTP", status: "Completed" },
              {
                file: "nightly-backup.zip",
                protocol: "FTPS",
                status: "Transferring",
              },
              { file: "report.csv", protocol: "SCP", status: "Completed" },
            ].map((row) => (
              <div className="preview-table-row" key={row.file}>
                <span>
                  <Package size={15} />
                  {row.file}
                </span>
                <span className="protocol-tag">{row.protocol}</span>
                <span
                  className={
                    row.status === "Completed"
                      ? "completed-status"
                      : "transfer-status"
                  }
                >
                  {row.status === "Completed" ? (
                    <CircleCheck size={12} />
                  ) : (
                    <span className="live-dot" />
                  )}
                  {row.status}
                </span>
              </div>
            ))}
          </div>
          <div className="preview-bottom">
            <span>Illustrative interface · sample data</span>
            <span>
              One shared transfer registry <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kervan",
    url: SITE,
    description:
      "A unified FTP, FTPS, SFTP and SCP file transfer server written in pure Go.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    softwareVersion: VERSION,
    license: `${SOURCE}/LICENSE`,
    codeRepository: REPO,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return (
    <main id="main">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <section className="hero-stage" aria-labelledby="hero-title">
        <div className="hero container">
          <div className="hero-copy">
            <a
              className="release-pill"
              href={`${REPO}/releases/tag/${VERSION}`}
            >
              <span className="live-dot" />
              <span>{VERSION}</span>
              <span className="pill-divider" />
              One less thing to manage.
              <ArrowRight size={14} />
            </a>
            <h1 id="hero-title">
              One binary.
              <br />
              <span>Every protocol.</span>
              <br />
              Total control<span className="gold-period">.</span>
            </h1>
            <p className="hero-lead">File transfers, on your terms.</p>
            <p className="hero-description">
              FTP, FTPS, SFTP and SCP. One shared filesystem, one auth engine,
              one audit trail. Everything you need to move files. All in a
              single Go binary.
            </p>
            <div className="hero-actions">
              <Link href="/docs/getting-started/" className="button primary">
                Start transferring
                <ArrowRight size={18} />
              </Link>
              <a href={REPO} className="button secondary">
                <Github />
                Explore the source
                <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="hero-command">
              <Terminal size={17} />
              <code>
                <span>$</span> ./kervan
              </code>
              <CopyButton text="./kervan" label="Copy start command" />
            </div>
            <div className="hero-trust">
              <span>
                <Check />
                Pure Go. Zero CGO.
              </span>
              <span>
                <Check />
                MIT licensed
              </span>
              <span>
                <Check />
                Yours to run
              </span>
            </div>
          </div>
          <HeroArt />
          <a className="hero-scroll" href="#features">
            <ArrowDown size={14} /> LESS INFRASTRUCTURE. MORE FORWARD.
          </a>
        </div>
      </section>
      <div className="capability-strip">
        <div className="container capability-inner">
          <span className="strip-label">
            FOUR WAYS IN.
            <br />
            ONE WAY FORWARD.
          </span>
          <span>
            <Network />4 transfer protocols
          </span>
          <span>
            <Layers3 />
            Unified filesystem
          </span>
          <span>
            <ShieldCheck />
            Shared authentication
          </span>
          <span>
            <Radio />
            Built-in observability
          </span>
          <span>
            <Package />
            One binary
          </span>
        </div>
      </div>
      <section className="section container" id="features">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LESS TO MANAGE. MORE TO BUILD.</span>
            <h2>
              Different connections.
              <br />
              <span className="muted-heading">The same foundation.</span>
            </h2>
          </div>
          <p>
            Stop managing a different server for every protocol. Give your teams
            a consistent way to connect, with the controls you need underneath.
          </p>
        </div>
        <div className="feature-layout">
          <article className="feature-featured">
            <span className="feature-number">01 / IDENTITY</span>
            <h3>
              One identity.
              <br />
              Every door.
            </h3>
            <p>
              Local accounts, LDAP, SSH keys and WebUI single sign-on. Set
              permissions once. Keep access consistent across your file transfer
              workflows.
            </p>
            <div className="identity-art" aria-hidden="true">
              <div className="identity-user">
                <Users />
                <span>YOUR TEAM</span>
              </div>
              <div className="identity-lines" />
              <div className="identity-protocols">
                <span>FTP</span>
                <span>FTPS</span>
                <span>SFTP</span>
                <span>SCP</span>
              </div>
            </div>
            <Link className="text-link" href="/docs/security/">
              Access, under control
              <ArrowRight size={16} />
            </Link>
          </article>
          <article className="feature-featured filesystem-feature">
            <span className="feature-number">02 / FILESYSTEM</span>
            <h3>
              Your files.
              <br />A common ground.
            </h3>
            <p>
              A shared virtual filesystem with per-user chroot, permissions and
              quotas. Keep files on disk, in memory, or in S3-compatible object
              storage.
            </p>
            <div className="filesystem-art" aria-hidden="true">
              <div className="filesystem-path">
                <FolderLock size={18} />
                <span>/home/alice</span>
                <span className="path-badge">CHROOT</span>
              </div>
              <div className="storage-chips">
                <span>
                  <HardDrive />
                  Local disk
                </span>
                <span>
                  <Layers3 />
                  Memory
                </span>
                <span>
                  <Package />
                  S3
                </span>
              </div>
            </div>
            <Link className="text-link" href="/docs/storage/">
              Explore the filesystem
              <ArrowRight size={16} />
            </Link>
          </article>
          <div className="feature-details">
            {[
              {
                icon: FileCheck2,
                title: "A record of every move.",
                description:
                  "Structured JSONL audit events, HMAC integrity chains, webhooks and syslog. Keep your record of truth close.",
                href: "/docs/operations/",
              },
              {
                icon: Gauge,
                title: "Know what’s moving.",
                description:
                  "Live sessions, transfer tracking, Prometheus-style metrics and an embedded management interface.",
                href: "/docs/operations/",
              },
              {
                icon: Terminal,
                title: "Small operational footprint.",
                description:
                  "No external runtime to install. Release binaries for Linux, macOS and Windows. Docker and systemd, too.",
                href: "/docs/getting-started/",
              },
            ].map((item) => (
              <article className="feature-detail" key={item.title}>
                <item.icon size={23} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link
                    href={item.href}
                    aria-label={`Learn about ${item.title}`}
                  >
                    <ArrowUpRight size={20} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-tinted" id="protocols">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SPEAK YOUR CLIENT’S LANGUAGE</span>
              <h2>
                Four protocols.
                <br />
                <span className="muted-heading">Zero identity crisis.</span>
              </h2>
            </div>
            <p>
              Keep the clients, scripts and workflows you already use. Every
              connection meets the same users, files and policies.
            </p>
          </div>
          <ProtocolExplorer />
        </div>
      </section>
      <section className="section container" id="architecture">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONNECTED BY DESIGN</span>
            <h2>
              One core.
              <br />
              <span className="muted-heading">Everything in sync.</span>
            </h2>
          </div>
          <p>
            Protocol listeners at the edge. A common foundation underneath.
            Authentication, storage policy and audit work together inside one
            process.
          </p>
        </div>
        <Architecture />
        <div className="architecture-caption">
          <span>
            <span className="figure-number">FIG. 02</span> Shared services.
            Consistent behavior.
          </span>
          <Link className="text-link" href="/docs/storage/">
            Look under the hood
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section section-tinted" id="management">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CLARITY, ALREADY INCLUDED</span>
              <h2>
                A control room.
                <br />
                <span className="muted-heading">Already inside.</span>
              </h2>
            </div>
            <p>
              The React WebUI is embedded in the binary. Manage users, browse
              files, follow sessions and inspect audit events, without deploying
              another application.
            </p>
          </div>
          <ManagementPreview />
          <div className="management-capabilities">
            <span>
              <Users />
              Users & groups
            </span>
            <span>
              <Workflow />
              Live sessions & transfers
            </span>
            <span>
              <FileCheck2 />
              Searchable audit events
            </span>
            <span>
              <KeyRound />
              Scoped API keys
            </span>
            <Link href="/docs/api/">
              Built for automation
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container" id="use-cases">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR INFRASTRUCTURE. YOUR WAY.</span>
            <h2>
              Wherever files go.
              <br />
              <span className="muted-heading">Kervan fits.</span>
            </h2>
          </div>
          <p>
            From the scripts you run every night to the files you exchange with
            a partner. A shared server for the work between systems.
          </p>
        </div>
        <div className="use-cases">
          {[
            {
              n: "01",
              icon: Workflow,
              title: "Automate the handoff.",
              text: "Move build artifacts and scheduled exports with SSH keys, SCP scripts and scoped API keys. Keep the transfer trail alongside your automation.",
              tag: "CI / CD & AUTOMATION",
            },
            {
              n: "02",
              icon: Users,
              title: "Make room for partners.",
              text: "Give each partner a confined home directory. Set account expiry, protocol restrictions and quotas without maintaining separate servers.",
              tag: "TEAMS & FILE EXCHANGE",
            },
            {
              n: "03",
              icon: Server,
              title: "Keep the keys.",
              text: "Run on your own hardware or in a container. Choose local or object storage, connect your monitoring and own your operational data.",
              tag: "SELF-HOSTED INFRASTRUCTURE",
            },
          ].map((item) => (
            <article key={item.n}>
              <div className="use-case-top">
                <span>{item.n}</span>
                <item.icon size={26} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="use-case-tag">{item.tag}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-tinted" id="quickstart">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM DOWNLOAD TO FIRST TRANSFER</span>
              <h2>
                A small start.
                <br />
                <span className="muted-heading">A clear path forward.</span>
              </h2>
            </div>
            <Link href="/docs/getting-started/" className="text-link">
              Follow the full quick start
              <ArrowRight size={17} />
            </Link>
          </div>
          <Quickstart />
        </div>
      </section>
      <section className="section container faq-section">
        <div className="faq-heading">
          <span className="eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</span>
          <h2>
            Before you
            <br />
            <span className="muted-heading">connect.</span>
          </h2>
          <p>
            Something else on your mind?
            <br />
            The source is open.
          </p>
          <a className="text-link" href={`${REPO}/issues`}>
            Start a conversation
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], i) => (
            <details key={question}>
              <summary>
                <span className="faq-number">0{i + 1}</span>
                {question}
                <span className="faq-toggle">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <span className="eyebrow">OPEN SOURCE. OPEN POSSIBILITIES.</span>
            <h2>
              Your next transfer.
              <br />A simpler beginning.
            </h2>
            <div className="hero-actions">
              <Link
                className="button dark-button"
                href="/docs/getting-started/"
              >
                Let’s get connected
                <ArrowRight size={18} />
              </Link>
              <a className="button gold-outline" href={REPO}>
                <Github />
                Star on GitHub
                <ArrowUpRight size={14} />
              </a>
            </div>
            <p>Pure Go. MIT licensed. Built to move things forward.</p>
          </div>
          <Mark className="cta-mark" />
        </div>
      </section>
    </main>
  );
}
