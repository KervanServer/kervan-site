import { SOURCE } from "./site";
export type DocSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
  language?: string;
  note?: string;
  table?: { headers: string[]; rows: string[][] };
};
export type Doc = {
  slug: string;
  title: string;
  category: string;
  description: string;
  source: string;
  sections: DocSection[];
};
export const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Your first transfer",
    category: "GETTING STARTED",
    description:
      "Download one binary, create an admin, and connect with the client you already use.",
    source: `${SOURCE}/README.md#quick-start`,
    sections: [
      {
        id: "install",
        title: "1. Get Kervan",
        paragraphs: [
          "Download the v0.9.0 release archive for Linux, macOS or Windows from GitHub Releases, verify it against checksums.txt, and extract it into a working directory. The release binary includes the management WebUI. You do not need Go, Node.js or an external database to run it.",
          "The examples below use a Unix shell. On Windows, run .\\kervan.exe instead of ./kervan. Keep the working directory consistent: the default kervan.yaml and ./data paths are relative to it.",
        ],
        code: "# Check the extracted binary\n./kervan version\n\n# Generate kervan.yaml in the current directory\n./kervan init",
      },
      {
        id: "admin",
        title: "2. Create your first admin",
        paragraphs: [
          "Create an administrator before you start the server. Choose a strong, unique password; the value below is an example to replace. The default configuration does not ship with an admin password.",
        ],
        code: "./kervan admin create \\\n  --username admin \\\n  --password 'Choose-a-unique-password!'\n\n# Validate your configuration\n./kervan check\n\n# Start the server\n./kervan",
        note: "Review listener exposure and firewall rules before making the server reachable. FTP is unencrypted; use SFTP or configure FTPS for sensitive transfers. Enable TLS for a remotely accessible WebUI.",
      },
      {
        id: "connect",
        title: "3. Make a connection",
        paragraphs: [
          "Open http://localhost:8080 to sign in to the embedded WebUI. Create a regular transfer user with its own home directory and permissions. The CLI can also create users while the server is running.",
        ],
        code: "# In a second terminal, from the same working directory\n./kervan user create \\\n  --username alice \\\n  --password 'Another-unique-password!' \\\n  --home-dir /uploads\n\n# Connect, verify the server host key, and enter Alice’s password\nsftp -P 2222 alice@localhost",
        note: "Keep administration and file transfer accounts separate. In SFTP, use put report.csv to upload and ls to list files.",
      },
      {
        id: "ports",
        title: "Default listeners",
        paragraphs: [
          "SFTP and SCP share one SSH listener. Explicit FTPS shares the FTP listener; the optional implicit TLS listener uses its own port.",
        ],
        table: {
          headers: ["Service", "Port", "Default behavior"],
          rows: [
            ["FTP", "2121", "Enabled; passive ports 50000–50100"],
            ["FTPS", "2121 / 990", "Disabled; certificate and key required"],
            ["SFTP / SCP", "2222", "Enabled; Ed25519 host key generated"],
            [
              "WebUI / API / metrics",
              "8080",
              "Enabled; create an admin before startup",
            ],
            [
              "Debug / pprof",
              "6060",
              "Disabled; localhost binding when enabled",
            ],
          ],
        },
      },
      {
        id: "configure",
        title: "Configuration that stays readable",
        paragraphs: [
          "Kervan reads kervan.yaml by default. Pass -config for a different file. YAML values can be overridden with KERVAN_<SECTION>__<KEY> environment variables, with double underscores between nested levels.",
        ],
        code: "# Use a specific config file\n./kervan -config /etc/kervan/kervan.yaml\n\n# Example environment override (Unix shell)\nKERVAN_FTP__PORT=2221 ./kervan",
        note: "Selected WebUI, security and bandwidth settings can reload at runtime. Listener and storage changes can require a restart; the reload API reports applied_paths and restart_paths.",
      },
      {
        id: "source",
        title: "Build from source",
        paragraphs: [
          "Source builds require Go 1.26.1 or newer; the repository pins Go 1.26.9. Building the embedded WebUI also requires Node.js and npm. Run the repository’s build helper before compiling the server.",
        ],
        code: "git clone https://github.com/KervanServer/kervan.git\ncd kervan\ngo run ./scripts\ngo build -o kervan ./cmd/kervan\n./kervan init",
      },
    ],
  },
  {
    slug: "protocols",
    title: "Four ways to connect",
    category: "THE FOUNDATIONS",
    description:
      "FTP, FTPS, SFTP and SCP. Familiar protocols with one shared policy underneath.",
    source: `${SOURCE}/README.md#protocols`,
    sections: [
      {
        id: "ftp",
        title: "FTP: active and passive",
        paragraphs: [
          "Kervan implements FTP with active PORT/EPRT and passive PASV/EPSV data channels. Configure the passive port range and advertised passive IP when running behind NAT or Docker. Active callbacks are restricted to the control connection’s address and unprivileged ports.",
          "The protocol supports uploads, downloads, appends, resumable transfers, directory operations, renames, machine-readable listings, timestamps and transfer cancellation. TYPE A is accepted for compatibility, but data is always transferred byte for byte.",
        ],
        code: "curl --user alice ftp://localhost:2121/\ncurl --user alice -T report.csv ftp://localhost:2121/",
        note: "Plain FTP does not encrypt credentials or file contents. Choose FTPS or SFTP where encryption is required.",
      },
      {
        id: "ftps",
        title: "FTPS: explicit or implicit TLS",
        paragraphs: [
          "FTPS is disabled by default. Set ftps.enabled and provide a certificate and private key. Select explicit, implicit or both modes. Explicit TLS uses AUTH TLS on the FTP port; implicit TLS defaults to port 990.",
          "TLS 1.2 and 1.3 limits are configurable. Optional client-certificate verification uses the FTPS client CA setting. Configuring TLS on the WebUI alone does not enable FTPS.",
        ],
        code: 'ftps:\n  enabled: true\n  mode: explicit\n  min_tls_version: "1.2"\n  max_tls_version: "1.3"\n  cert_file: /etc/kervan/tls/cert.pem\n  key_file: /etc/kervan/tls/key.pem',
        language: "yaml",
      },
      {
        id: "sftp",
        title: "SFTP: SSH file transfers",
        paragraphs: [
          "SFTP v3 runs on the SSH listener at port 2222 by default. Passwords and SSH public keys are supported. An Ed25519 host key is generated on first start; the keygen command can also pre-create Ed25519 or RSA keys.",
          "Supported OpenSSH extensions include posix-rename, statvfs/fstatvfs, fsync and limits. The server provides file transfers rather than an interactive shell or port forwarding. Symlinks, SSH certificate authentication and keyboard-interactive authentication are not supported.",
        ],
        code: "sftp -P 2222 alice@localhost\n\n# Pre-create a host key before starting the server\n./kervan keygen --type ed25519 --output ./data/host_keys",
      },
      {
        id: "scp",
        title: "SCP: scripts welcome",
        paragraphs: [
          "Legacy SCP implements source and sink modes, recursive copies and time preservation. It uses the same SSH listener as SFTP and the same VFS and audit pipeline. Modern OpenSSH scp uses SFTP by default; -O explicitly requests legacy SCP.",
        ],
        code: "# Default SFTP transport on modern OpenSSH\nscp -P 2222 report.csv alice@localhost:/\n\n# Legacy SCP, recursively\nscp -O -P 2222 -r ./reports alice@localhost:/",
      },
      {
        id: "compatibility",
        title: "Test your client workflow",
        paragraphs: [
          "The repository includes live interoperability tests with OpenSSH sftp/scp and curl. Wider checks with FileZilla, WinSCP, lftp and Cyberduck remain on the roadmap. Validate the exact client, protocol features and network setup you plan to deploy.",
          "FTP virtual hosts use RFC 7151 HOST or FTPS SNI and can restrict logins by group. They do not apply to SFTP or SCP, because SSH does not carry an equivalent host name.",
        ],
      },
    ],
  },
  {
    slug: "storage",
    title: "One filesystem, everywhere",
    category: "THE FOUNDATIONS",
    description:
      "Understand the shared VFS, storage backends and the boundaries that apply to your data.",
    source: `${SOURCE}/README.md#virtual-filesystem`,
    sections: [
      {
        id: "vfs",
        title: "A shared virtual filesystem",
        paragraphs: [
          "Protocol handlers use a common VFS layer. Each session resolves paths inside the user’s home directory, with path normalization and symlink containment on local storage. Mount resolution can compose directory roots from different backends.",
          "Permissions, storage quotas, file-count quotas and bandwidth policy are shared across protocols and WebUI/API transfers. A user’s parallel sessions do not get independent quota or bandwidth allowances.",
        ],
      },
      {
        id: "local",
        title: "Local disk",
        paragraphs: [
          "The local backend stores files underneath a configured root. In the default configuration that root is ./data/files. Persist both application state and file storage when deploying in containers.",
        ],
        code: "storage:\n  default_backend: local\n  backends:\n    local:\n      type: local\n      options:\n        root: ./data/files",
        language: "yaml",
      },
      {
        id: "memory",
        title: "In-memory storage",
        paragraphs: [
          "The memory backend is useful for ephemeral workloads and testing. Its files live inside the server process and are lost when it stops. Choose durable local or object storage for files that must survive a restart.",
        ],
        code: "storage:\n  default_backend: ephemeral\n  backends:\n    ephemeral:\n      type: memory",
        language: "yaml",
      },
      {
        id: "s3",
        title: "S3-compatible object storage",
        paragraphs: [
          "The S3 backend uses Kervan’s own SigV4 client and can connect to compatible object stores. Configure the endpoint, region, bucket and credential options for your provider. Each user’s home becomes a key prefix; directories are represented by marker objects.",
          "An object is downloaded to a local temporary file on open. A written file is uploaded in a single PutObject when closed. Large files therefore require local temporary space and are limited to S3’s 5 GB single-PUT maximum. Multipart uploads remain planned.",
          "The S3 backend does not store POSIX permissions or timestamps and does not support symlinks. Validate those semantics against your workflow.",
        ],
        bullets: [
          "Supported options: endpoint, region, bucket, prefix, access_key, secret_key, force_path_style, disable_ssl.",
          "Keep object-store credentials out of source control and restrict their bucket access.",
          "Local and S3 backends have different metadata semantics; do not assume a complete POSIX filesystem.",
        ],
      },
      {
        id: "groups",
        title: "Groups, quotas and bandwidth",
        paragraphs: [
          "A primary group supplies permission and quota defaults. Users can receive explicit overrides. Secondary groups record membership only. Storage and file-count quotas apply to regular users when quotas are enabled; administrators are exempt.",
          "Bandwidth can be limited globally and per user or group. A user’s connections share the allowance, including FTP, FTPS, SFTP, SCP and WebUI/API transfers.",
        ],
        code: "quota:\n  enabled: true\n  default_max_storage: 1073741824\n  default_max_files: 0\n  check_interval: 60s\n\nbandwidth:\n  max_total: 104857600\n  default_user_rate: 0",
        language: "yaml",
        note: "These sizes and rates are bytes and bytes per second. A zero default_max_files or max_total means unlimited. Inspect the full schema for inheritance and per-user override semantics.",
      },
    ],
  },
  {
    slug: "security",
    title: "Access, under control",
    category: "RUNNING KERVAN",
    description:
      "Choose identities, narrow permissions and configure encrypted connections deliberately.",
    source: `${SOURCE}/README.md#security`,
    sections: [
      {
        id: "identities",
        title: "One engine, several identity paths",
        paragraphs: [
          "Local users live in the embedded store with Argon2id hashing by default; bcrypt is also supported. LDAP integration can authenticate directory users. SFTP and SCP accept passwords and SSH public keys.",
          "WebUI OIDC single sign-on uses discovery and the authorization-code flow with PKCE. OIDC covers WebUI/API sessions, not FTP or SSH authentication. Enforce MFA at the identity provider for SSO; Kervan’s local TOTP flow is separate.",
          "Use plain OpenSSH public keys. Account key management rejects authorized_keys options because their restrictions would not be enforced. SSH certificates and keyboard-interactive authentication are not supported.",
        ],
      },
      {
        id: "boundaries",
        title: "Give each user a boundary",
        paragraphs: [
          "Set home directories, permissions, group templates, expiry times, allowed addresses, allowed protocols and session limits. Protocol restrictions can require FTPS for an individual user instead of allowing plain FTP.",
          "Global and per-user IP restrictions combine to narrow access. Deny rules take precedence. Open transfer sessions are periodically checked for account deletion, disablement, expiry and address restrictions; WebUI/API requests are checked on each call.",
        ],
        code: "./kervan user access --username alice \\\n  --expires 2026-12-31 \\\n  --allowed-ips 10.0.0.0/8 \\\n  --protocols ftps,sftp \\\n  --max-sessions 2",
      },
      {
        id: "network",
        title: "Protect every listener",
        paragraphs: [
          "IP/CIDR allow and deny rules apply across FTP, SSH and the WebUI/API. Per-protocol connection caps and a cross-protocol per-IP connection cap can bound exposure. Brute-force controls include account lockouts and shared IP bans.",
          "Behind a reverse proxy, the API sees the proxy’s address. Filter external WebUI clients at the proxy as needed. The /health endpoint remains available for local health checks.",
        ],
        code: "security:\n  allowed_ips: [10.0.0.0/8]\n  denied_ips: []\n  max_connections_per_ip: 20\n  brute_force:\n    enabled: true\n    max_attempts: 5\n    lockout_duration: 15m\n    ip_ban_threshold: 20\n    ip_ban_duration: 1h",
        language: "yaml",
      },
      {
        id: "tls",
        title: "Encrypt connections explicitly",
        paragraphs: [
          "SFTP and SCP use SSH transport encryption. FTPS requires its own certificate and key configuration. The WebUI can serve TLS or sit behind a TLS reverse proxy. Plain FTP and an HTTP management listener do not provide encryption.",
          "Kervan’s WebUI includes CSP, frame protection and other HTTP hardening headers, with HSTS on TLS connections. Cross-origin access is disabled by default; configure only the specific origins that need it.",
        ],
        note: "These are documented controls, not a certification or guarantee for a particular deployment. Keep releases current and test your own threat model and network configuration.",
      },
      {
        id: "keys",
        title: "Scoped automation credentials",
        paragraphs: [
          "Create API keys with the smallest permission set a task requires. The CLI can list supported scopes and presets. Keys can be revoked from the CLI or WebUI, and raw key material is shown once on creation.",
        ],
        code: "./kervan apikey scopes\n./kervan apikey presets\n./kervan apikey create --username alice \\\n  --name 'Report uploader' \\\n  --permissions files:read,files:write",
      },
    ],
  },
  {
    slug: "operations",
    title: "Run it with a clear view",
    category: "RUNNING KERVAN",
    description:
      "Deploy with Docker or systemd. Follow sessions, keep an audit trail and plan recovery.",
    source: `${SOURCE}/README.md#audit-log`,
    sections: [
      {
        id: "docker",
        title: "Docker deployment",
        paragraphs: [
          "Published images cover linux/amd64 and linux/arm64. The image runs as a non-root user and persists state under /var/lib/kervan/data. A built-in health check probes port 8080. Set KERVAN_ADMIN_PASSWORD in your environment before running the example.",
        ],
        code: "docker run --name kervan \\\n  -p 2121:2121 -p 2222:2222 -p 8080:8080 \\\n  -p 50000-50100:50000-50100 \\\n  -e KERVAN_ADMIN_PASSWORD \\\n  -v kervan-data:/var/lib/kervan/data \\\n  ghcr.io/kervanserver/kervan:0.9.0",
        note: "For remote passive FTP, set ftp.passive_ip to the Docker host’s reachable address. Enable FTPS and publish port 990 separately if using implicit TLS. The product repository includes a Compose file and environment template.",
      },
      {
        id: "systemd",
        title: "A service on your own host",
        paragraphs: [
          "The repository includes deploy/systemd/kervan.service as an example Linux service. Provision the kervan user, binary, configuration and data directory first. The unit uses a non-root identity, restart handling and CAP_NET_BIND_SERVICE for privileged ports.",
          "Review the unit’s paths and permissions for your installation rather than enabling it unchanged on an unprepared host. Use the documented install steps in the product README.",
        ],
      },
      {
        id: "observe",
        title: "Sessions, transfers and metrics",
        paragraphs: [
          "The shared session registry reports protocol, client address and activity. Transfer tracking records in-flight and recent transfers with byte counts and duration. The WebUI receives live snapshots over WebSocket.",
          "Prometheus-style /metrics output includes active sessions, transfer counters, uptime and HTTP request counters and latency aggregates. The REST API exposes the corresponding operational data. Structured HTTP access logs include request and trace identifiers.",
        ],
        code: '# A running local instance\ncurl http://localhost:8080/health\n\n# Supply a bearer token or scoped API key for protected metrics\ncurl -H "Authorization: Bearer $KERVAN_TOKEN" \\\n  http://localhost:8080/metrics',
        note: "The optional pprof listener is disabled by default and binds to localhost when enabled. Keep profiling access restricted.",
      },
      {
        id: "audit",
        title: "Keep the record of truth",
        paragraphs: [
          "JSONL file audit outputs record authentication, file activity, sessions and administration. HMAC-SHA256 integrity chaining is enabled by default. Preserve the audit key with your logs if you need to verify their chain.",
          "File outputs apply backpressure rather than dropping queued events. HTTP, webhook and syslog outputs have independent bounded queues and best-effort delivery; remote events can be dropped when collectors fall behind. Keep a file output as the record of truth and monitor dropped-event metrics.",
        ],
        code: "audit:\n  enabled: true\n  integrity:\n    enabled: true\n  outputs:\n    - type: file\n      path: ./data/audit.jsonl\n      max_size_mb: 100\n      max_backups: 10\n    - type: syslog\n      url: tls://siem.example.com:6514\n      format: rfc5424",
        language: "yaml",
      },
      {
        id: "backup",
        title: "Back up, verify, recover",
        paragraphs: [
          "The operational backup CLI packages the embedded store, audit log and active configuration in a ZIP with a checksum manifest. Verification checks archive structure and recorded hashes. Restore with the server stopped for the cleanest recovery.",
          "Plan separate backups for transferred file payloads, object-store data, SSH host keys and other deployment secrets as appropriate. An operational archive is not a substitute for a tested full-data recovery plan.",
        ],
        code: "./kervan backup create --config ./kervan.yaml \\\n  --output ./backups/kervan-backup.zip\n./kervan backup verify --input ./backups/kervan-backup.zip\n\n# With the server stopped\n./kervan backup restore --config ./kervan.yaml \\\n  --input ./backups/kervan-backup.zip --force",
        note: "Restore overwrites operational state. Verify the archive and destination before using --force.",
      },
    ],
  },
  {
    slug: "api",
    title: "Built for your workflow",
    category: "REFERENCE",
    description:
      "Connect your tools with the REST API, live WebSocket snapshots, metrics and the stdio MCP server.",
    source: `${SOURCE}/docs/openapi.yaml`,
    sections: [
      {
        id: "rest",
        title: "The management API",
        paragraphs: [
          "The management listener serves the WebUI, versioned REST endpoints and metrics on port 8080 by default. Authenticate using a session bearer token or a scoped API key. Administrative endpoints also require an admin identity.",
          "The product repository’s OpenAPI document is the authoritative operation and schema reference. Check it for request fields, permission scopes, filters, pagination and response formats.",
        ],
        table: {
          headers: ["Method", "Path", "Purpose"],
          rows: [
            ["GET", "/health", "Liveness and subsystem checks"],
            ["POST", "/api/v1/auth/login", "Password sign-in"],
            ["GET", "/api/v1/users", "List users (admin)"],
            ["GET", "/api/v1/sessions", "Active sessions"],
            ["GET", "/api/v1/transfers", "Active and recent transfers"],
            ["GET", "/api/v1/audit/events", "Filtered audit events"],
            ["GET", "/metrics", "Prometheus-style exposition"],
          ],
        },
      },
      {
        id: "request",
        title: "Make an authenticated request",
        paragraphs: [
          "Set KERVAN_TOKEN to your own bearer session token or API key. Only grant the scopes needed by the calling service. Use HTTPS when the management interface is accessible outside a trusted local environment.",
        ],
        code: '# KERVAN_TOKEN is supplied by your environment\ncurl -H "Authorization: Bearer $KERVAN_TOKEN" \\\n  http://localhost:8080/api/v1/transfers\n\ncurl -H "Authorization: Bearer $KERVAN_TOKEN" \\\n  \'http://localhost:8080/api/v1/audit/events?type=file.write\'',
      },
      {
        id: "websocket",
        title: "Follow live snapshots",
        paragraphs: [
          "Connect to /api/v1/ws?types=server,sessions,transfers,audit for WebSocket snapshots. Non-browser clients can send the Authorization header. Browser clients offer auth.<token> alongside kervan.v1 in Sec-WebSocket-Protocol; the server only echoes kervan.v1.",
          "Authentication tokens are not accepted in the WebSocket URL. Keep the connection on a trusted local origin or use WSS for remote deployments.",
        ],
      },
      {
        id: "mcp",
        title: "An MCP interface for local tools",
        paragraphs: [
          "Kervan also includes an MCP server over stdio. It lets a compatible MCP client inspect and administer a local installation using the same configuration. Only stdio transport is currently supported.",
          "Treat a locally configured MCP client as an administrative integration and review the operations it can invoke.",
        ],
        code: "./kervan mcp --config ./kervan.yaml",
      },
      {
        id: "roadmap",
        title: "Current boundaries",
        paragraphs: [
          "The server and site document shipped features separately from planned work. S3 multipart uploads and wider desktop-client interoperability testing remain on the project roadmap. A queryable audit store and database-backed metadata are longer-term directions.",
          "Read the current release notes and contributor guide before relying on newly added behavior. This website is a static guide; examples are not executed against a server in your browser.",
        ],
      },
    ],
  },
];
