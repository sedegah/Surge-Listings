Surge Solutions: Consolidated Product, Design and Implementation Document
Digital Repossessed and Distressed Asset Marketplace and Management Platform. Version 1.0, dated 17 October 2026. Combines the Product Requirements Document (referred to as the PRD, file red.md), the Page and Endpoint Breakdown, the UI Design Direction (file req.md, 8 October 2026, @Kimathi) and the project README for the current implementation.

1. How to Use This Document
This document merges four sources into one reference.

Part	Content	Source
1	Product summary, scope, personas, architecture, multi-tenancy	PRD
2	Domain model, state machines, functional requirements, permissions, security, quality	PRD
3	UI design direction (Windows-form style)	UI Design Direction
4	Page by page breakdown with endpoints, rules and requirement IDs	Page and Endpoint Breakdown
5	Cross-cutting endpoints, delivery plan, current implementation, run instructions, open questions	All sources
Assumption carried over. The PRD says endpoints in Spec section 30 are the baseline, but that section was not in the material provided. Endpoints named in the PRD are used as written. All others are proposed paths that follow the /api/v1/{public|bank|admin}/* areas. Confirm against Spec section 30 before building.

Legal note. Legal and statutory content must be reviewed by qualified Ghanaian legal and compliance counsel before it is treated as a production requirement.

Page ID prefixes: PUB = Public Marketplace, BNK = Bank Portal, ADM = Surge Admin.

PART 1. PRODUCT, SCOPE AND ARCHITECTURE
2. Product Summary
Vision. Surge Solutions controls the marketplace relationship while financial institutions retain control of their assets and decisions.

What it is. A multi-tenant platform for marketing and controlled sale of bank-repossessed, distressed and court-realized assets in Ghana, delivered as three applications that share one backend, one database and one set of business rules.

Business objectives (each maps to acceptance tests in section 13):

Protect the bank: the public can never identify or bypass the bank.

Protect confidential data: borrower, loan, recovery officer and internal legal data stay restricted.

Surge is the sole intermediary: no direct buyer to bank contact.

Fully auditable sales process from marketing to final sale and fees.

Many banks, one platform, strict data separation.

Success metrics. Zero cross-tenant data leaks (verified by automated tests). 100% of state-changing actions reconstructable from the audit log. No listing published while an injunction is active. Monthly bank report generated automatically for every active bank. Fee and commission changes made without deployment.

3. The Three Applications
Public Marketplace	Bank Portal	Surge Admin
Audience	Buyers and the general public	Bank staff, one isolated tenant per bank	Surge employees only
Suggested address	www.surge...	banks.surge...	admin.surge... (restrict by IP/VPN if possible)
Login	None to browse; phone OTP session for KYC and offers	Individual accounts plus MFA	Individual accounts plus mandatory MFA
UI technology	React and TypeScript (Next.js for SEO)	React, TypeScript, Tailwind CSS, shadcn/ui	React, TypeScript, Tailwind CSS, shadcn/ui
API area	/api/v1/public/*	/api/v1/bank/*	/api/v1/admin/*
Sees	Approved public fields only; always "Listed by Surge Solutions"	Own bank's assets, offers, reports and billing only	All banks, assets, legal files, leads, KYC, offers, fees, audit logs
Main jobs	Search, view assets, enquire, KYC, request viewing, submit offer	Submit assets and documents, track progress, approve or reject offers, view reports and invoices	Review and verify assets, legal holds, publish listings, run leads, viewings and offers, billing, reports, users, settings
Delivery phases	6, 7	4	5 (plus parts of 7, 8, 9)
Rules that apply to all three:

Each application is a separate deployable web front end with its own domain, cookies and CORS policy. A bank login can never open the admin site, and a public visitor can never reach bank or admin endpoints.

The three share one backend service and application core layer (@surge/domain, @surge/application, @surge/infrastructure), so a rule such as the injunction block is written once and enforced for every caller.

Authorization is checked on the API for each area, not only in the UI. Tokens issued for one area are rejected by the other two.

Tenant isolation applies to the Bank Portal and anything a bank user can reach. Surge Admin reads across tenants through explicit, audited permissions.

Build order follows the delivery plan in section 25: shared foundation first, then Bank Portal, Surge Admin and Public Marketplace.

Conventions that apply to every page

Errors use RFC 7807 problem details. Unauthorized and non-existent IDs both return 404.

Create-offer and payment calls require an Idempotency-Key header.

Updates use ETag or row version for optimistic concurrency.

Every state-changing call writes an AuditLog row (actor, old and new values).

Tokens are area-specific: a bank token is rejected on /admin/* and /public/* restricted routes.

Lists support pagination and sorting. Money is GHS, decimal(18,2). Times display in Africa/Accra.

4. Personas and Roles
Persona	Roles (scope)
Public Buyer	Anonymous visitor, then Buyer (identified via KYC)
Bank users	Bank Administrator (BA), Asset Officer (AO), Legal/Recovery Officer (LRO), Approver (AP), Finance Officer (FO), Viewer (VW)
Surge users	Super Administrator (SA), Asset/Property Manager (PM), Legal/Verification Officer (LO), Sales Agent (SG), Finance Officer (FO), Viewer/Auditor (AU)
Every person has individual credentials; shared logins are prohibited. Role names in the Spec are inconsistent (for example "Asset Manager" versus "Property Manager"; the bank "Legal/Recovery Officer" appears in Spec section 4 but not in the section 24 matrix). Decision for build: use the union list above (see Open Questions, section 28).

5. Scope
In scope: everything in the Spec's 36 sections across 9 phases.

Out of scope for v1 (unless confirmed): native mobile apps; online payment-gateway collection from buyers for the purchase price (sale completion is tracked, not transacted, by the platform); automated Lands Commission integration (searches are uploaded and verified manually); OpenSearch (designed for, not built). Online purchase-price payment, Lands Commission integration and mobile apps therefore have no pages in this document.

6. Target Architecture (TypeScript / Node.js)
Architecture style: modular monolith with clean layering using TypeScript / Node.js, deployable as one container set, extractable later.

Concern	Spec (Django)	TypeScript / Node.js choice
Runtime	Python	Node.js 22 LTS / Bun (TypeScript 5.x)
API	Django REST Framework	Express.js / Fastify / NestJS API server, OpenAPI generator (Zod/TypeBox validation), versioning at /api/v1
ORM and DB	Django ORM / PostgreSQL	Prisma ORM or Kysely / Drizzle ORM with PostgreSQL 16+
Auth	Django Auth plus MFA	Passport.js / Jose / Lucia Auth (cookies for portals, JWT bearer for API clients), otplib for TOTP MFA plus SMS OTP fallback
Authorization	RBAC plus object-level	CASL / Policy-based authorization middleware: permission claims from RolePermission plus resource-based handlers for object-level checks
Background jobs	Celery plus Redis	BullMQ (Redis-backed task queue) or Agenda; Redis for cache, rate limiting and distributed locks
File storage	Private S3-compatible	@aws-sdk/client-s3 (S3, MinIO or compatible), pre-signed URLs
Image processing	none	Sharp (sharp) for watermark derivatives
Reports	PDF and Excel	@react-pdf/renderer or PDFKit (PDF), ExcelJS (Excel)
Search	PostgreSQL, then OpenSearch	Postgres full-text (tsvector) and trigram (pg_trgm) behind an IAssetSearch service interface
Public frontend	React and TypeScript	React and TypeScript (Next.js recommended for SEO), consuming /api/v1/public/*
Bank portal and Surge Admin	Django custom UI plus Jazzmin	React, TypeScript, Next.js / Vite SPA with Tailwind CSS, Radix UI / shadcn/ui; themed in Surge red and blue; purpose-built screens for critical workflows, generic CRUD grids for lookups
Maps	Mapbox	Mapbox GL JS on all frontends (react-map-gl)
SMS and OTP	Hubtel (subject to availability)	SmsSender interface abstraction; Hubtel axios/fetch adapter, swappable
Observability	none	Pino / Winston logger, OpenTelemetry Node SDK, health checks, Seq/Grafana/Application Insights
Deployment	Docker	Docker container images, CI/CD (GitHub Actions), separate dev/staging/prod, secrets in environment/vault
Solution layout (Clean Architecture / Workspace Monorepo, one deployable container):

surge-monorepo/
  apps/
    api/              Public and internal REST API server (Node.js/Express or NestJS)
    web-bank/         Bank Portal frontend (React/Next.js/Vite)
    web-admin/        Surge Admin frontend (React/Next.js/Vite)
    web-public/       Public Marketplace frontend (React/Next.js)
  packages/
    domain/           Entities, value objects, enums, domain rules, domain events
    application/      Use cases, commands, queries, validators (Zod), interfaces, DTOs
    infrastructure/   Prisma/Drizzle EF equivalent, Auth, S3, SMS, Email, BullMQ, Sharp, Reports
    ui/               Shared React components (Windows-style UI, Tailwind CSS, shadcn/ui)
    config/           TypeScript, ESLint, and Tailwind shared configs
  tests/              Unit, integration (Testcontainers for Node.js / PostgreSQL), architecture tests
Cross-cutting rules

Money: decimal / string-represented fixed precision (precision 18,2), currency GHS, stored explicitly. Dates in UTC (timestamptz); display in Africa/Accra.

IDs: String UUID v7. Human references are generated by a database sequence service (section 8).

All state transitions go through domain or application services, never direct field updates from API controllers or UI handlers.

Soft-delete for business entities; hard deletes only via background retention jobs.

7. Multi-Tenancy and Data Isolation
Requirement MT-1. A bank is a tenant (Organization). Surge is the platform operator tenant.

Implementation (defence in depth):

TenantContext middleware resolves organizationId and scope (Surge or Bank) from the authenticated JWT/session principal, never from request input.

Prisma client extension / Kysely middleware automatically applies tenant filters on every tenant-owned query (where: { bankId: tenant.id } unless scope is Surge).

PostgreSQL row-level security as a second layer (SET app.current_org per connection or transaction), so a missed filter still cannot leak rows.

Resource-based authorization handlers on every by-ID endpoint to defeat IDOR; unauthorized and non-existent IDs both return 404.

Public endpoints use dedicated read models and DTO projections that physically exclude restricted columns.

Automated cross-tenant tests (section 13) run in CI and fail the build on any leak.

PART 2. DOMAIN, REQUIREMENTS AND QUALITY
8. Domain Model
The full field list is in Spec section 6 and is normative. Entities are grouped by bounded module.

Module	Entities
Identity and Tenancy	Organization, Bank, User, Role, Permission, RolePermission
Assets	Asset, AssetCategory, AssetImage, AssetVideo, Listing
Legal	EnforcementCase, LegalInstrument, Memorandum, Settlement, Judgment, StatutoryNotice
Title and Valuation	TitleInformation, LandSearch, Valuation
Documents	Document, DocumentVerification
CRM	Buyer, KYCApplication, Consent, Lead, LeadActivity, Viewing
Transactions	Offer, Fee, Invoice, Payment, Commission
Platform	Notification, AuditLog, plus the additions below
Additions required by the PRD (not in Spec section 6):

OfferRevision: one row per offer or counter-offer (amount, proposed_by buyer/bank, created_at, note) to support the counter-offer loop.

BuyerAccessGrant: which buyer may see which asset's restricted data, granted on KYC Verified plus required Consents; has expiry and revocation.

DocumentAccessLog: who requested or received a signed link, when, from which IP (also emitted to AuditLog).

SystemSetting / ValidityRule: configurable validity windows (land search, valuation) and watermark rules per asset classification.

BankAgreement: per-bank fee and commission terms with effective dates, so rates are configuration, not code.

LegalHoldEvent: history of hold placed or released with reason and actor.

ReferenceSequence: per-type, per-year counters.

Enquiry: raw public enquiry message before it is promoted to a Lead.

8.1 Reference generation
Reference	Format	Rule
Asset public ref	SS-{CAT}-{YYYY}-{#####}, e.g. SS-RE-2026-00241	Sequence per year; must not encode the bank; category code is generic (RE, VH, EQ)
Lead	SL-LEAD-{YYYY}-{######}	Sequential, gap-tolerant
Offer	OFF-{YYYY}-{######}	Sequential, gap-tolerant
Generation uses a Postgres sequence or locked counter row; values are unique-indexed.

9. State Machines
Each is an explicit state machine in the Domain layer (allowed-transitions table, guard conditions, audit emission). Invalid transitions throw a domain exception mapped to HTTP 409.

9.1 Asset lifecycle. Draft, Submitted by Bank, Surge Review, Legal Review, Title Review, Valuation Review, Approved, Live, Buyer Interest, Viewing, Offer, Bank Decision, Sale, Completed. Interrupt states: Rejected, Changes Required (returns to Draft or Submitted), Legal Hold, Withdrawn, Expired, Sold.

Guards:

Approved to Live requires all of: legal verified, title verified, valid valuation, valid land search, at least one exterior image (where applicable), no active injunction, no legal hold.

Legal Hold is reachable from any non-terminal state and, when active, force-unpublishes the listing.

Buyer Interest, Viewing and Offer are derived or aggregate states: the asset stays publicly Live until an offer is accepted or the asset is withdrawn (to confirm, Open Question 3).

9.2 Lead pipeline. New, Contacted, Qualified, KYC Requested, KYC Verified, Viewing, Interested, Offer, Negotiation, Sale. Terminals: No Response, Not Interested, Unqualified, Cancelled, Lost.

9.3 Offer workflow. Submitted, Surge Review, Forwarded to Bank, Under Bank Review, then Accepted (to Completion), Rejected, or Countered (back to Surge Review).

9.4 Other. KYC: Requested, Submitted, then Verified or Rejected. Viewing: Requested, Confirmed, then Completed, Cancelled, Rescheduled or No-show. Invoice: Draft, Issued, then Paid, Overdue or Cancelled. Enforcement case: Pending Verification, then Verified, Legal Hold or Rejected.

10. Functional Requirements
Priority: M = must, S = should. Each requirement is a testable unit.

10.1 Identity, users, roles (Phase 1)
ID	Requirement	P
ID-1	Individual accounts for all Surge and bank staff; unique email; admin-invited onboarding with email verification	M
ID-2	MFA (TOTP) mandatory for Surge users and bank Administrators and Approvers; optional but encouraged for others; MFA secret encrypted at rest	M
ID-3	Lockout after repeated failures, login monitoring, session timeout, concurrent-session control, forced logout on role change	M
ID-4	Roles and permissions in DB; permissions are codes like asset.create, offer.review; role to permission mapping editable by Super Administrator and enforced server-side	M
ID-5	Bank Administrator manages only their own bank's users	M
ID-6	Password reset via time-limited single-use token; breached-password and complexity checks	M
10.2 Asset management (Phase 2)
ID	Requirement	P
AS-1	Create and edit assets with identification, location, description, occupancy, pricing fields	M
AS-2	Auto-generate public reference at creation	M
AS-3	Media: up to 20 photos (configurable), video, site plans; one primary image; sort order	M
AS-4	At least one exterior image required to publish where applicable	M
AS-5	Public derivative image generated asynchronously with configurable watermark per asset classification; original kept private	M
AS-6	Bank submits asset (Draft to Submitted); Surge reviews, requests changes, rejects or advances	M
AS-7	Every price, reserve and status change recorded in AuditLog with old and new values	M
AS-8	Publish and unpublish create or update a Listing row; publish only via the PublishListing service enforcing guards	M
10.3 Enforcement and legal (Phase 3)
ID	Requirement	P
LG-1	Each asset has an EnforcementCase with one or more LegalInstruments (Memorandum, Settlement, Judgment, Statutory notice), each with instrument-specific fields per Spec section 9	M
LG-2	Legal Blocking Rule: if any Judgment has injunction_active = true, publishing is blocked, an existing listing is unpublished, and Surge users see the LISTING BLOCKED banner. Enforced in the PublishListing application service and a domain invariant, not by UI state. A DB check or trigger is the backstop	M
LG-3	Legal Verification Officer verifies or rejects instruments with notes; every decision audited	M
LG-4	Place and release Legal Hold with mandatory reason; notifies bank and Surge legal	M
LG-5	Legal document checklist per asset (Default Notice, Affidavit of Service, Judgment, Title Docs, Valuation) with computed status	M
LG-6	Settlement agreements and judgments are never public; classification is Legal/Confidential	M
10.4 Title, land search, valuation (Phase 3)
ID	Requirement	P
TL-1	Capture perfection status and title fields per Spec section 10	M
TL-2	Land search validity window (configurable validity_period_days); daily BullMQ job sets Expired and raises a notification N days before expiry (N configurable)	M
VL-1	Valuation records with report document; daily job flags review_required = true outside the validity window	M
VL-2	Expired or review-required items show as REVIEW REQUIRED and block Approved to Live	M
10.5 Pricing, reserve, occupancy and risk
ID	Requirement	P
PR-1	reserve_price and minimum_offer are restricted fields (Surge plus owning bank)	M
PR-2	show_reserve_publicly = true shows reserve in the public DTO; false shows "Price on Application"	M
PR-3	Offer below reserve is accepted, flagged below_reserve, and routed to a Request Bank Exception step; never silently rejected or blocked	M
PR-4	Offer below minimum_offer is rejected at validation (distinct from below reserve)	S
OC-1	For Occupied - Hostile and Land Guard Risk, scheduling a viewing requires an explicit admin override recorded with reason; HIGH-RISK OCCUPANCY banner shown	M
10.6 Public Marketplace (Phase 6)
ID	Requirement	P
PM-1	Anonymous search with filters: region, category, price band, property type, approximate location, occupancy	M
PM-2	Cards and detail pages show only the public field whitelist (Spec section 15); always "Listed by Surge Solutions"	M
PM-3	Never expose: bank name, borrower, Ghana Card data, loan amount, recovery officer contact, exact address, confidential legal data, internal bank reference; enforced by projection DTOs plus automated serialization tests	M
PM-4	Enquiry form (CAPTCHA, rate-limited) creates Enquiry, then Lead, and notifies the assigned agent	M
PM-5	Public refs, URLs and image filenames must not leak bank identity (strip EXIF and metadata from public derivatives)	M
PM-6	Pagination, sort, SEO-friendly URLs, approximate-location map pin (never exact coordinates)	M
10.7 Buyer KYC, consent, disclosure (Phase 7)
ID	Requirement	P
KY-1	KYC form: full name, Ghana Card number (encrypted), card front and back, phone plus OTP, email, address, source of funds, proof of funds, related asset (field set configurable)	M
KY-2	Surge reviewer verifies or rejects with notes; status transitions audited	M
KY-3	Consents (NDA, Buyer Disclaimer, Data Protection, Terms, Intermediary Disclosure) captured with document version, timestamp, IP, session ID; versions managed by admin	M
KY-4	BuyerAccessGrant created only when KYC is Verified and all required consents are accepted; asset-scoped, time-limited, revocable	M
KY-5	Restricted information released only to holders of a valid grant	M
KY-6	KYC data retention and deletion jobs configured from final legal guidance	M
10.8 Secure documents (cross-cutting)
ID	Requirement	P
DC-1	All files in a private bucket; keys are random GUIDs, never meaningful paths; no public ACLs	M
DC-2	Access via POST /documents/{id}/request-access-link: authorization check, pre-signed URL (default 5 min, configurable), DocumentAccessLog plus AuditLog	M
DC-3	Upload validation: type allow-list, size limits, magic-byte check, antivirus scan hook before a document becomes accessible	M
DC-4	Server-side encryption at rest; KYC and legal categories in separately permissioned prefixes	M
10.9 Leads and viewings (Phase 7)
ID	Requirement	P
LD-1	Enquiry auto-creates Lead with reference, links buyer, asset and source, assigns agent (round-robin or manual; configurable)	M
LD-2	LeadActivity timeline for every contact and status change	M
LD-3	Pipeline enforces allowed transitions; moving to Viewing requires KYC Verified	M
VW-1	Schedule, confirm, reschedule, cancel viewings; double-booking check per agent; buyer and agent notified	M
VW-2	Exact address shown to buyer only after valid grant and confirmed viewing; each disclosure audited as "exact-address disclosure"	M
10.10 Offers and transactions (Phase 8)
ID	Requirement	P
OF-1	Only buyers with KYC Verified and valid grant may submit offers; offer auto-linked to asset, buyer, KYC, bank, agent; reference generated	M
OF-2	Surge agent reviews, then forwards to bank; bank Approver records decision (Accept, Reject, Counter) with notes	M
OF-3	Counter-offers create OfferRevision rows and loop back to Surge Review	M
OF-4	Offer validity end date; daily job expires stale offers	M
OF-5	On acceptance: record final_sale_price, create Commission and Invoice(s), set asset Sale to Completed/Sold, close competing offers and leads	M
OF-6	Banks never see buyer contact details unless Surge policy allows; buyer sees no bank identity	M
10.11 Fees, commission, billing (Phase 8)
ID	Requirement	P
FE-1	Fee records (flat or percentage; bank, buyer or global; active flag) editable by authorized Surge staff without deployment	M
FE-2	Commission = FinalSalePrice x Rate%, rounded half away from zero to 2 dp; rate precedence: BankAgreement, then Bank.commission_rate_default, then global Fee	M
FE-3	Rate and fee values snapshotted onto Commission and Invoice at creation so later config changes do not alter history	M
FE-4	Invoice lifecycle with PDF export; payments recorded manually by Finance Officer; overdue job	M
FE-5	Worked example must pass: GHS 950,000 at 4% gives GHS 38,000.00	M
10.12 Reporting and dashboards (Phase 9)
ID	Requirement	P
RP-1	Bank reports: assets submitted, approved, rejected, live; enquiries; viewings; offers; accepted offers; highest offer; completed sales; final prices; fees; commission	M
RP-2	Surge reports: inventory, bank performance, lead and sales conversion, revenue, outstanding fees, agent and asset performance, legal holds, verification status	M
RP-3	Monthly bank report auto-generated on the 1st (BullMQ recurring job), stored, notified, exportable as PDF and Excel	M
RP-4	Each figure traceable to underlying records (drill-down or calculation-notes appendix)	M
RP-5	Dashboards: Surge KPI tiles (Total Assets, Live, Pending Review, Legal Hold, New Leads, KYC Pending, Active Offers, Completed Sales, Outstanding Fees); bank dashboard limited to own tenant	M
RP-6	Reporting reads from read-optimized queries or views; heavy reports run as background jobs	S
10.13 Notifications
Channels: email, SMS (OTP and key alerts), in-app. Triggers per Spec section 32: new enquiry, KYC status changes, viewing events, offer events, legal hold placed or released, land-search or valuation nearing expiry, monthly report ready. Implemented as domain events, an outbox table, and a BullMQ worker dispatcher with retry and back-off and delivery status (Pending, Sent, Failed). Templates are admin-editable; SMS and email senders are pluggable.

11. Permission Matrix (server-side)
Permissions are codes assigned to roles via RolePermission. Every endpoint declares a required permission; resource handlers additionally check tenant and ownership. This is the starting seed; the final matrix is data, editable in-app.

Permission area	Bank Admin	Asset Officer	Approver	Bank Finance	Bank Viewer	Super Admin	Legal Officer	Property Mgr	Sales Agent	Surge Finance	Auditor
Manage bank users	Yes					Yes					
Create/edit assets, upload media	Yes	Yes				Yes		Yes			
Submit for review	Yes	Yes				Yes					
Review/publish listing						Yes		Yes			
Verify legal/title docs, legal hold						Yes	Yes				
Manage leads/viewings/KYC review						Yes			Yes		
Forward offers to bank						Yes			Yes		
Bank decision on offers			Yes								
View offers	Yes		Yes		Yes	Yes		Yes	Yes		Yes
Invoices / payments	View			View		Yes				Yes	View
Reports	Yes			Yes	Yes	Yes		Yes		Yes	Yes
Audit logs						Yes					Yes
Fee/config management						Yes				Yes (fees)	
12. Data Classification, API Standards, Security and Non-Functional Requirements
Data classification. Five tiers enforced by authorization, not UI: Public, Buyer-restricted, Bank, Surge internal, Legal/confidential (explicit per-access authorization and logging). Each entity field is tagged or mapped with a classification constraint (@Classification(Tier.X) or Zod schema metadata); DTO mappers and an architecture test reject any public DTO exposing a field above Public. The public surface always says "Listed by Surge Solutions" and must contain no bank name, bank code or bank-derived identifier anywhere (text, URLs, image metadata, API payloads, error messages, sitemap).

API standards. Versioned REST under /api/v1. RFC 7807 problem details for errors, idempotency keys for create-offer and payment endpoints, cursor or offset pagination, ETag or row version for optimistic concurrency, consistent 404 for unauthorized IDs. Additions to the Spec section 30 baseline: POST /public/enquiries, POST /public/otp/request, POST /public/otp/verify, POST /offers/{id}/counter, POST /offers/{id}/request-bank-exception, POST /assets/{id}/legal-hold/release, GET /assets/{id}/publish-readiness, GET/PUT /admin/fees, /admin/bank-agreements, /admin/settings/validity-rules, POST /invoices, POST /invoices/{id}/payments, GET /reports/.../export?format=pdf|xlsx.

Security. TLS everywhere with HSTS; Argon2id / bcrypt password hashing via argon2; MFA; per-IP and per-account rate limiting (express-rate-limit / Redis); anti-forgery / double-submit CSRF cookies; strict CORS; CSP and Helmet security headers; input validation (Zod) and output encoding; Node crypto / KMS field-level encryption (AES-256-GCM) for Ghana Card numbers and MFA secrets; secrets only from environment variables; encrypted backups with tested restore; dependency (npm audit) and container scanning in CI; periodic penetration testing; separate dev, staging and prod with no production data in lower environments; login anomaly monitoring.

Area	Requirement
Availability	Target 99.5% or higher monthly initially; finalize SLA with infrastructure choice
Performance	Public search p95 under 500 ms at 10k listings; detail page p95 under 300 ms; admin lists p95 under 800 ms
Auditability	Append-only AuditLog (no UPDATE or DELETE grants to the app role); written via database middleware interceptors plus explicit domain audit events; covers all mandatory events in Spec section 25
Configurability	Fees, commissions, validity windows, watermark rules, signed-URL TTL, KYC field set editable without redeploy
Scalability	Stateless app nodes; search behind IAssetSearch; background workers scale independently
Data protection	Retention and deletion per finalized counsel guidance (Ghana Data Protection Act context to be confirmed by counsel); right-to-erasure workflow
Accessibility and UX	WCAG 2.1 AA on public site; mobile-first; low-bandwidth friendly (lazy images, WebP)
Localization	English; GHS currency formatting; Africa/Accra time zone
Backup and DR	Daily full plus PITR; documented RPO of 15 min or less, RTO of 4 h or less (to confirm)
13. Quality and Acceptance
Mandatory automated test suites (CI gates):

Tenant isolation: for every bank-scoped endpoint, Bank A token plus Bank B object ID returns 404; Prisma queries without tenant context return zero rows; RLS verified with raw SQL.

Public leakage: serialize every public DTO and assert no restricted or classified field or bank-identifying string appears; fixtures seeded with a distinctive bank name searched for in all public responses, HTML and image metadata.

Legal block: with injunction_active = true, publish via API, service and direct status update all fail; unpublishes if an injunction is added later.

Document access: no static URL works; signed link expires; unauthorized user gets none; every access logged.

State machines: table-driven tests for all allowed and forbidden transitions.

Commission math: boundary and rounding cases including the 950,000 x 4% example.

Audit completeness: each mandatory audit event produces exactly one record with actor, old and new values.

Architecture tests (ts-arch / custom AST rules): Domain package has no infrastructure dependencies; API route handlers never touch database queries directly without going through application use cases.

Definition of Done per feature: requirement ID traced to tests, permission code defined, audit events emitted, notifications wired, OpenAPI updated, security review checklist passed.

PART 3. UI DESIGN DIRECTION: PROFESSIONAL WINDOWS-FORM STYLE
The Bank Portal and Surge Admin should look and behave like a classic Windows business application: dense, structured, keyboard-friendly and calm. Built in React & TypeScript with custom compact Tailwind components / shadcn UI tokens. The Public Marketplace keeps the same colours and type but is lighter and more visual. No emojis anywhere; status is shown with text labels, coloured badges and vector icons. Where the PRD and page breakdown mention warning marks, the banner and badge system in section 17 replaces them.

14. Design Principles
Structure over decoration. Every screen is built from group boxes, labelled fields, grids and toolbars, not marketing-style cards.

Density with order. Show many fields at once, aligned on a strict grid, with clear grouping. Staff do data entry all day.

Predictable. The same layout, button positions and shortcuts on every screen. Save is always bottom-right and Ctrl+S.

Keyboard first. Full tab order, access keys, Enter to submit, Esc to cancel, F-key shortcuts for common actions.

Plain language. Labels such as "Reserve Price (GHS)", never clever copy. No emojis, no exclamation marks, no humour.

Errors are specific. Say which field and why, next to the field, and in a summary at the top of the form.

15. Application Shell (Bank Portal and Surge Admin)
The shell mimics a desktop multi-document application running in the browser.

+--------------------------------------------------------------------------+
| Surge Solutions   File  Edit  View  Assets  Legal  Sales  Reports  Help  |  Menu bar
+--------------------------------------------------------------------------+
| [New] [Open] [Save] [Submit] | [Verify] [Legal Hold] | [Print] [Export]  |  Toolbar
+----------------+---------------------------------------------------------+
| Navigation     | [ Assets ][ SS-RE-2026-00241 x ][ Offers ][ Leads ]     |  Document tabs
|                +---------------------------------------------------------+
|  Dashboard     |                                                         |
|  Assets        |   Work area: forms, grids, master-detail panes          |
|  Banks         |                                                         |
|  Legal         |                                                         |
|  Title         |                                                         |
|  Leads         |                                                         |
|  Offers        |                                                         |
|  Reports       |                                                         |
+----------------+---------------------------------------------------------+
| User: j.mensah | Role: Legal Officer | Org: Surge | Env: PROD | 14:32    |  Status bar
+--------------------------------------------------------------------------+
Region	Behaviour
Menu bar	Text menus with access keys (Alt+F, Alt+A). Items the user lacks permission for are hidden, not greyed, so staff are not confused; the API still enforces permission
Toolbar	Icon plus text buttons, grouped with separators. Context-sensitive: enabled only when the open record allows the action
Navigation pane	Collapsible tree on the left, 220 px, grouped by module. Collapses to icons
Document tabs	Each open record is a closable tab (up to 10), so a user can work on several assets at once. Unsaved tabs show an asterisk
Work area	Forms, grids, or a master-detail split with a draggable divider
Status bar	Current user, role, organisation, environment, last saved time, and a record-lock or validation message
16. Visual Style
Modern Windows (Fluent-inspired) with flat surfaces, 1 px borders, 2 to 4 px corner radius and almost no shadows. Avoid gradients, large illustrations and animation beyond a short fade.

Token	Value (starting point)	Use
Primary blue	#0B3C75	Title bar, primary buttons, selected tab, links
Accent red	#B3262E	Surge brand mark, destructive actions, blocking banners
Window background	#F3F3F3	Behind panels
Panel surface	#FFFFFF	Forms, grids
Border	#C8C8C8	Group boxes, inputs, grid lines
Text	#1F1F1F / #5A5A5A	Primary / secondary text
Success / Warning / Danger / Info	#1E7B34 / #9A6700 / #B3262E / #0B3C75	Status badges
Element	Spec
Font	Segoe UI (fallback: Inter, Arial). Body 13 px, labels 12 px, headings 16 px semibold. No more than three sizes per screen
Row height	Inputs 28 px, grid rows 28 px (compact option 24 px)
Spacing	8 px grid. 12 px inside group boxes, 16 px between groups
Icons	One vector set (Lucide React or Fluent System Icons) at 16 px. Monochrome, coloured only for state
Dark mode	Optional, later phase. Same tokens, redefined
The React layout shell and tokens live in one shared UI package (@surge/ui) used by both portals, so the look stays identical.

Forms
Forms follow the WinForms pattern: group boxes with a caption, labels on the left, inputs aligned in columns.

+- Identification --------------------------------------------------------+
| Public Reference   [ SS-RE-2026-00241 ]  (read only)                     |
| Category *         [ House                  v]                           |
| Asset Type         [ 4 bedroom detached                 ]                |
| Internal Bank Ref  [ BNK-LN-88213                       ]  Restricted    |
+- Location --------------------------------------------------------------+
| Region *  [ Greater Accra v]   District * [ Tema West v]                 |
| Town/Area [ Community 25   ]   Public Location [ Tema, Greater Accra ]   |
| Exact Address (restricted) [ ......................................... ]  |
+- Pricing ---------------------------------------------------------------+
| Reserve Price (GHS) [ 950,000.00 ]  [x] Show reserve publicly            |
| Minimum Offer (GHS) [ 900,000.00 ]                                       |
+--------------------------------------------------------------------------+
                                    [ Save ]  [ Submit for Review ]  [ Close ]
Required fields are marked with an asterisk and a legend at the bottom of the form.

Restricted fields carry a small text tag ("Restricted") and a lock icon, not colour alone.

Tabbed forms for large records: Asset, Legal, Title, Valuation, Media, Documents, History. Each tab shows a count or a status badge.

Validate on blur and on save (using React Hook Form + Zod). A validation summary lists every error as a link to its field.

Read-only fields are visibly different (grey background), never hidden inputs.

Dirty-state guard: closing a modified tab prompts Save, Don't Save, Cancel.

Dialogs are modal only for confirmations and short edits; long edits open as a tab.

Grids and lists
Grids are the main working surface (implemented via TanStack Table / AG Grid in React).

Feature	Detail
Columns	Sortable, resizable, reorderable; a column chooser; saved views per user
Filtering	Filter row under the header plus an advanced filter dialog; filter chips shown above the grid
Selection	Single and multi-select with checkboxes; Shift and Ctrl selection; row count and selected count in the footer
Paging	Server-side, 25 / 50 / 100 rows; keyboard page navigation
Actions	Double-click or Enter opens the record in a tab; right-click context menu duplicates toolbar actions
Export	Excel and PDF of the current view, respecting filters and permissions
Status column	Text badge (for example "Live", "Legal Hold", "Pending Review"), never colour alone
Empty state	A plain sentence and one action, for example "No assets match this filter. Clear filters"
Master-detail is used wherever a record has children: an asset grid on top and a tabbed detail pane below (Legal, Title, Offers, Leads, Audit).

17. Status, Warnings and Blocking Rules Without Emojis
Situation	Presentation
Listing blocked by injunction	Red banner across the top of the asset tab: LISTING BLOCKED. "An active injunction is recorded against this asset. Resolve the legal restriction before publication." Publish button disabled with a tooltip giving the reason
High-risk occupancy	Amber banner: HIGH-RISK OCCUPANCY. "Occupancy: Occupied - Hostile. Administrator action is required before a viewing."
Valuation or land search expired	Amber badge "Review Required" beside the field, and an item in the legal checklist
Below reserve offer	Amber badge "Below Reserve" and a visible "Request Bank Exception" action
Verified / Pending / Rejected	Green / grey / red badges with text and a small icon
The legal document checklist is a table with a Status column (Verified, Missing, Expired, Rejected) and an icon, not tick marks typed as characters. All banners have a fixed position, a bold lead word, one sentence of detail and, where possible, a link to the fix.

18. Keyboard Shortcuts
Shortcut	Action
Ctrl+N / Ctrl+O	New record / open by reference
Ctrl+S	Save
Ctrl+F	Focus the grid filter
Ctrl+Tab / Ctrl+W	Next tab / close tab
F2	Edit selected row
F5	Refresh
F1	Help for this screen
Alt+letter	Menu and button access keys
Esc	Close dialog or cancel edit
19. Screen Inventory, Public Adaptation and Component Choice
Application	Main screens
Surge Admin	Dashboard, Banks, Users and Roles, Assets (grid and tabbed record), Legal and Enforcement, Title and Land Search, Valuations, Document Verification queue, Listings approval, Leads, KYC queue, Viewings calendar, Offers, Invoices and Payments, Reports, Fee and Agreement settings, Audit Log, System Settings
Bank Portal	Dashboard, My Assets, New Asset wizard, Legal and Enforcement, Title and Documents, Listings status, Viewings, Offers and Decisions, Reports, Billing, Users, Notifications
Public Marketplace	Home with search, Results (grid or map), Asset detail with gallery, Enquiry form, KYC wizard, Consent and NDA, Viewing request, Offer form
The New Asset screen in the Bank Portal is a stepped wizard, because bank users enter assets rarely and benefit from guidance. Surge staff use the dense tabbed form.

Public Marketplace adaptation. The public site must feel trustworthy and professional but cannot assume desktop habits.

Same colour tokens and Segoe UI / Inter type, flat surfaces and strong alignment.

Search panel as a structured filter box (Region, Category, Price, Occupancy) with a Search button, plus a results grid with a list or map toggle.

Asset detail uses a labelled details table (Reference, Category, Location, Title status, Valuation) next to the gallery, not decorative cards.

Always display "Listed by Surge Solutions" in the same position. Never show anything that could reveal the bank.

Mobile first: the grid becomes stacked rows; forms become single column with large touch targets (44 px).

Wizards for KYC and offers, with a progress indicator and explicit Back and Next buttons.

Component library options for React / TypeScript.

Option	Fit	Note
TanStack Table + Radix UI / shadcn/ui	Closest to custom WinForms style: ultra-dense grids, custom tab docking, keyboard navigation	Fully customizable, open source
AG Grid React	Industry standard enterprise grid (virtualized, Excel-like features, context menus)	Community / Enterprise options
Syncfusion React UI	Full suite with Windows/Fluent density and Excel-like features	Commercial / Community licence
MUI (Material UI) with Dense density	Good density, flexible customization	Open source
Recommendation: choose TanStack Table + shadcn/ui (or AG Grid for complex data tables) in React with custom @surge/ui CSS styling to achieve the dense Windows desktop aesthetic across both internal portals. The public site uses plain React + Tailwind CSS.

20. Do and Do Not
Do	Do not
Use text labels and badges for every status	Use emojis, emoticons or decorative symbols
Keep one button layout and one shortcut set	Move actions between screens
Show why an action is disabled	Silently grey out controls
Use group boxes and aligned columns	Use large cards, hero banners or parallax in the portals
Confirm destructive actions with a named dialog	Delete on a single click
Print and export from the same filtered view	Offer exports that ignore permissions
Design next steps: confirm component library choices; confirm brand colours and supply the Surge logo in SVG; build the @surge/ui shell (menu, toolbar, navigation, tabs, status bar) as the first Phase 1 task; produce clickable mock-ups of Asset record, Asset grid and Offer review before building; review banners and status wording with Surge legal and operations staff.

PART 4. PAGE AND ENDPOINT BREAKDOWN
Every page in the three applications, with the API endpoints each page calls, permissions, rules and requirement IDs. Paths marked in the assumption in section 1 are proposed unless named in the PRD.

21. Public Marketplace (React + Next.js)
Area: /api/v1/public/*. No login to browse. A phone-OTP session is required for KYC, restricted data, viewings and offers. Every page shows "Listed by Surge Solutions" and never exposes bank identity (PM-2, PM-3, PM-5).

ID	Page and route	Purpose and components	Calls	Rules
PUB-01	Home /	Entry point, featured live listings, quick search, how-it-works summary	GET /public/assets?featured=true&limit=8, GET /public/lookups	Public DTO only. No bank names in copy, meta tags or images
PUB-02	Search and listings /assets	Anonymous search (PM-1, PM-6). Filters: region, category, price band, property type, approximate location, occupancy. Result cards (watermarked primary image, public ref, headline, price or "Price on Application", approximate area), sort, pagination, map toggle with approximate pins	GET /public/assets?region=&category=&priceMin=&priceMax=&type=&occupancy=&sort=&page=, GET /public/assets/map, GET /public/lookups	Price shows only when show_reserve_publicly = true (PR-2). SEO-friendly URLs. Never exact coordinates. p95 under 500 ms at 10k listings
PUB-03	Asset detail /assets/{slug}-{publicRef}	Gallery (watermarked WebP), description, public field whitelist, approximate map, "Listed by Surge Solutions" badge, CTAs: Enquire, Request viewing, Make offer	GET /public/assets/{publicRef}, GET /public/assets/{publicRef}/similar	Not-live or blocked assets return 404, never a "blocked" message. p95 under 300 ms. EXIF stripped. Slug and filenames are bank-agnostic
PUB-04	Enquiry form (section on PUB-03, standalone /enquire)	Fields: name, phone, email, message, asset ref, CAPTCHA (PM-4, LD-1)	POST /public/enquiries	Rate-limited and CAPTCHA-protected. Creates Enquiry, then Lead (SL-LEAD-{YYYY}-{######}), assigns and notifies agent. Confirmation shows a generic message only
PUB-05	Phone verification /verify (flow or modal)	Creates the OTP-verified buyer session (assumed, Open Question 2)	POST /public/otp/request, POST /public/otp/verify	Throttled per phone and IP. OTP via SmsSender (Hubtel adapter). Session cookie scoped to the public site. Restricted pages without a session redirect here
PUB-06	KYC application /kyc (multi-step)	Steps: personal details; Ghana Card number and front/back images; address; source of funds and proof; related asset; review and submit. Field set admin-configurable (KY-1)	GET /public/kyc/form-config, POST /public/kyc, PUT /public/kyc/{id}, POST /public/kyc/{id}/documents, POST /public/kyc/{id}/submit	Ghana Card number encrypted (AES-GCM). Uploads pass allow-list, size, magic-byte and antivirus checks (DC-3). Files go to the separately permissioned KYC prefix. State: Requested to Submitted
PUB-07	Consents /kyc/consents	Accept NDA, Buyer Disclaimer, Data Protection, Terms, Intermediary Disclosure (KY-3)	GET /public/consents/current, POST /public/consents	Each acceptance stores document version, timestamp, IP, session ID. When KYC is Verified and all required consents are accepted, a BuyerAccessGrant (asset-scoped, time-limited, revocable) is created (KY-4)
PUB-08	KYC status /my/kyc	Requested, Submitted, Verified, Rejected	GET /public/kyc/me, PUT /public/kyc/{id} (resubmit)	Rejection shows the reviewer note intended for the buyer only. Internal notes are never returned
PUB-09	Restricted asset information /my/assets/{publicRef}	Buyer-restricted fields and documents where the buyer holds a valid grant (KY-5)	GET /public/assets/{publicRef}/restricted, POST /public/documents/{id}/request-access-link	No valid grant returns 404. Signed URL default 5 minutes. Each request writes DocumentAccessLog and AuditLog (DC-2). Bank identity, borrower data, loan amount and confidential legal data are never returned
PUB-10	Request a viewing /assets/{publicRef}/viewing	Slot selection and request	GET /public/assets/{publicRef}/viewing-slots, POST /public/viewings	Requires KYC Verified and a grant (LD-3). Status: Requested. High-risk occupancy is accepted as a request but confirmation needs admin override (OC-1). Exact address not shown
PUB-11	My viewings /my/viewings	List, detail, cancel, reschedule request	GET /public/viewings, GET /public/viewings/{id}, POST /public/viewings/{id}/cancel, POST /public/viewings/{id}/reschedule-request	Exact address appears only after the viewing is Confirmed and the grant is valid; audited as "exact-address disclosure" (VW-2)
PUB-12	Submit an offer /assets/{publicRef}/offer	Fields: amount (GHS), validity end date, conditions note	POST /public/offers (Idempotency-Key)	Requires KYC Verified and valid grant (OF-1). Below minimum_offer rejected at validation (PR-4). Below reserve accepted and flagged below_reserve internally; buyer sees no difference (PR-3). Reference OFF-{YYYY}-{######}
PUB-13	My offers /my/offers, /my/offers/{id}	Offer list, detail, revision history	GET /public/offers, GET /public/offers/{id}, POST /public/offers/{id}/respond (accept, reject, revise a counter), POST /public/offers/{id}/withdraw	Shows OfferRevision history (buyer and Surge-relayed counter amounts only). Buyer-safe status labels. Bank never named (OF-6)
PUB-14	Account and privacy /my/privacy	Account info, erasure request, logout	GET /public/me, POST /public/me/erasure-request, POST /public/me/logout	Erasure workflow follows counsel's retention guidance (KY-6)
PUB-15	Static and legal pages	/how-it-works, /about, /contact, /faq, /terms, /privacy, /buyer-disclaimer	GET /public/consents/current for terms and consent text	Content from a CMS or static files; consent texts rendered from the API so versions match what is recorded
PUB-16	System pages	/404, /500, /robots.txt, /sitemap.xml, /maintenance	GET /public/sitemap	Sitemap contains only bank-agnostic URLs
22. Bank Portal (React / TypeScript SPA)
Area: /api/v1/bank/*. One isolated tenant per bank. Individual accounts; MFA mandatory for Bank Administrators and Approvers. Tenant resolved from the principal, never from input (MT-1). Roles: BA, AO, LRO, AP, FO, VW.

22.1 Access and account
ID	Page and route	Calls	Rules
BNK-01	Login /login	POST /bank/auth/login	Lockout after repeated failures, login monitoring (ID-3). Cookie scoped to the bank domain only
BNK-02	MFA challenge /login/mfa	POST /bank/auth/mfa/verify, POST /bank/auth/mfa/sms-fallback	
BNK-03	MFA enrolment /account/mfa/setup	POST /bank/auth/mfa/enroll (QR and secret), POST /bank/auth/mfa/confirm	Secret encrypted at rest (ID-2). Forced on first login for BA and AP
BNK-04	Accept invitation /invite/{token}	GET /bank/auth/invite/{token}, POST /bank/auth/invite/accept	Admin-invited onboarding with email verification (ID-1). Breached-password and complexity checks
BNK-05	Forgot and reset password /forgot-password, /reset-password/{token}	POST /bank/auth/forgot-password, POST /bank/auth/reset-password	Time-limited single-use token (ID-6). Identical response whether or not the email exists
BNK-20	Notifications /notifications	GET /bank/notifications, POST /bank/notifications/{id}/read, POST /bank/notifications/read-all, GET/PUT /bank/notification-preferences	
BNK-21	My account /account	GET/PUT /bank/me, POST /bank/me/change-password, GET /bank/me/sessions, DELETE /bank/me/sessions/{id}, MFA calls from BNK-03	Concurrent-session control (ID-3)
BNK-22	System pages /403, /404, /session-expired		Shell: sidebar by permission, tenant name in header, session timeout warning
22.2 Dashboard and assets
ID	Page and route	Roles	Calls	Rules
BNK-06	Dashboard /	All	GET /bank/dashboard	Own tenant only (RP-5). Tiles: assets submitted, approved, rejected, live; changes required; open enquiries; viewings; active offers (AP sees "awaiting your decision"); outstanding invoices (BA, FO). Tiles hidden when the role lacks permission
BNK-07	Assets list /assets	BA, AO, LRO, AP, VW (read)	GET /bank/assets?status=&category=&q=&page=	Columns: internal reference, public ref (once assigned), category, status, last updated, reserve (restricted). Status chips follow the lifecycle (section 9.1). "Changes Required" and "Legal Hold" highlighted
BNK-08	Create and edit asset wizard /assets/new, /assets/{id}/edit	BA, AO (asset.create, asset.edit); editable only in Draft or Changes Required	POST /bank/assets, GET /bank/assets/{id}, PUT /bank/assets/{id}, GET /bank/assets/{id}/readiness, POST /bank/assets/{id}/submit	See wizard steps below. Submit is blocked by missing mandatory data and shows which fields
BNK-09	Asset detail /assets/{id}	BA, AO, LRO, AP, VW	GET /bank/assets/{id}, GET /bank/assets/{id}/timeline, GET /bank/assets/{id}/activity, POST /bank/assets/{id}/withdraw, POST /bank/assets/{id}/resubmit	Tabs: Overview, Timeline, Legal, Title and valuation (with validity and REVIEW REQUIRED flags), Documents, Offers, Activity. Withdraw needs a reason. Legal Hold shows the reason supplied for the bank. Place and release hold is Surge-only
BNK-12	Changes required /assets/{id}/changes	AO, BA	GET /bank/assets/{id}/review-notes, then edit and POST /bank/assets/{id}/resubmit	Shows Surge change requests as a to-do list. Returns to Draft or Submitted
BNK-08 wizard steps

Step	Content	Key rules
1 Identification	Category, title, internal reference, borrower and loan reference (internal only)	Public ref generated at creation (AS-2)
2 Location	Region, town, exact address, coordinates	Exact address stays restricted
3 Description and occupancy	Description, size, occupancy status	Occupied - Hostile and Land Guard Risk flagged for admin
4 Pricing	Valuation reference, reserve price, minimum offer, show-reserve-publicly toggle	Every change audited with old and new values (AS-7)
5 Enforcement and legal	Enforcement case, instruments (memorandum, settlement, judgment, statutory notice)	Injunction flag visible; see BNK-10
6 Title and valuation	Perfection status, title fields, land search, valuation	Validity windows computed
7 Media	Up to 20 photos, video, site plans, primary image, order	At least one exterior image to publish (AS-4)
8 Documents	Legal and title documents	See BNK-11
9 Review and submit	Readiness checklist, submit	Draft to Submitted by Bank
Media calls: POST /bank/assets/{id}/images, DELETE /bank/assets/{id}/images/{imageId}, PUT /bank/assets/{id}/images/order, PUT /bank/assets/{id}/images/{imageId}/primary, POST /bank/assets/{id}/videos, DELETE /bank/assets/{id}/videos/{videoId}. Originals are kept private; a watermarked derivative is generated asynchronously (AS-5).

22.3 Legal and documents
ID	Page and route	Roles	Calls	Rules
BNK-10	Legal checklist and instruments /assets/{id}/legal	LRO, BA edit; AO, AP, VW view	GET/PUT /bank/assets/{id}/enforcement-case, POST/PUT/DELETE /bank/assets/{id}/instruments[/{instrumentId}], GET /bank/assets/{id}/legal-checklist	Instrument-specific fields per Spec section 9. Checklist: Default Notice, Affidavit of Service, Judgment, Title Docs, Valuation, each with computed status (LG-5). Verification outcome read-only for the bank. Active injunction shows "Publishing blocked" (LG-2). Settlements and judgments are Legal/Confidential (LG-6)
BNK-11	Documents /assets/{id}/documents, /documents	BA, AO, LRO	GET /bank/documents?assetId=, POST /bank/assets/{id}/documents, DELETE /bank/documents/{id}, POST /bank/documents/{id}/request-access-link	Allow-list types, size limit, magic-byte check, antivirus hook before the file becomes accessible (DC-3). Download only through a pre-signed link logged to DocumentAccessLog (DC-2). Verification status per document shown. Delete only before submission
22.4 Offers, reports, billing and administration
ID	Page and route	Roles	Calls	Rules
BNK-13	Offers list /offers	BA, AP, FO, VW	GET /bank/offers?status=&assetId=&page=	Offers appear only after Surge forwards them. Bank sees amount, conditions, status and below_reserve flag, but no buyer contact details unless Surge policy allows (OF-6; Open Question 7)
BNK-14	Offer detail and decision /offers/{id}	Decision by Approver only (offer.decide)	GET /bank/offers/{id}, GET /bank/offers/{id}/revisions, POST /bank/offers/{id}/accept, /reject, /counter (amount, note), POST /bank/offers/{id}/request-bank-exception/decision	Components: offer summary, revision history, asset summary, reserve comparison, decision panel (Accept, Reject, Counter, mandatory notes), below-reserve exception notice. Counter creates an OfferRevision and returns to Surge Review (OF-3). Accept triggers sale completion, commission and invoice creation on the Surge side (OF-5). Approver MFA recently verified. Below-reserve approval authority is Open Question 4
BNK-15	Reports /reports	BA, FO, AP, VW	GET /bank/reports/{type}?from=&to=, GET /bank/reports/{type}/export?format=pdf|xlsx	
BNK-16	Monthly reports /reports/monthly	BA, FO	GET /bank/reports/monthly, GET /bank/reports/monthly/{id}/download?format=	Generated automatically on the 1st by BullMQ (RP-3). Report-ready notification sent
BNK-17	Invoices /billing, /billing/{id}	BA, FO view	GET /bank/invoices, GET /bank/invoices/{id}, GET /bank/invoices/{id}/pdf	Read-only. Shows snapshotted rates, commission calculation and status (Issued, Paid, Overdue)
BNK-18	Users /users, /users/new, /users/{id}	BA only, own bank only (ID-5)	GET/POST /bank/users (invite), PUT /bank/users/{id}, POST /bank/users/{id}/deactivate, /reactivate, /reset-mfa, /resend-invite, GET /bank/roles	Can assign only bank roles. Role change forces logout (ID-3). The last Bank Administrator cannot be deactivated
BNK-19	Bank profile /organization	All	GET /bank/organization	Read-only. Fee and commission terms managed by Surge only
23. Surge Admin (React / TypeScript SPA)
Area: /api/v1/admin/*. Surge staff only, mandatory MFA, ideally IP/VPN restricted. Reads across tenants through explicit, audited permissions. Roles: SA, PM, LO, SG, FO, AU.

23.1 Access, account and dashboard
ID	Page and route	Calls	Rules
ADM-01 to 03	Login /login, MFA challenge /login/mfa, MFA enrolment /account/mfa/setup	POST /admin/auth/login, /auth/mfa/verify, /auth/mfa/enroll, /auth/mfa/confirm	MFA is not optional. No sign-in without enrolment. Lockout, anomaly monitoring, session timeout (ID-2, ID-3)
ADM-04	Accept invitation, reset password /invite/{token}, /forgot-password, /reset-password/{token}	POST /admin/auth/invite/accept, /auth/forgot-password, /auth/reset-password	
ADM-05	My account /account	GET/PUT /admin/me, POST /admin/me/change-password, GET /admin/me/sessions, DELETE /admin/me/sessions/{id}	
ADM-06	Notifications /notifications	GET /admin/notifications, POST /admin/notifications/{id}/read, /read-all	
ADM-10	Dashboard / (all roles)	GET /admin/dashboard	Tiles per RP-5, filtered by permission, each linking to the matching filtered list. Read-optimized queries. Shows LISTING BLOCKED count for injunction cases
23.2 Bank and tenant management
ID	Page and route	Roles	Calls	Rules
ADM-20	Banks list /banks	SA manage; PM, FO, AU view	GET /admin/banks	Columns: name, code, status, active assets, live assets, last activity
ADM-21	Create and edit bank /banks/new, /banks/{id}/edit	SA	POST /admin/banks, GET/PUT /admin/banks/{id}, POST /admin/banks/{id}/deactivate	Fields: legal name, short code, contact, default commission rate, status, bank profile (1:1 with Organization, Open Question 14). Creating a bank also creates the first Bank Administrator invite (Phase 1 exit criterion)
ADM-22	Bank detail /banks/{id}	SA, PM, FO, AU	GET /admin/banks/{id}, /assets, /invoices, /activity	Tabs: Overview, Users, Assets, Agreement, Invoices, Reports, Activity
ADM-23	Bank users /banks/{id}/users	SA	GET/POST /admin/banks/{id}/users, POST /admin/bank-users/{userId}/deactivate, /reset-mfa	Cross-tenant access logged with the specific permission used
23.3 Asset review and listing
ID	Page and route	Roles	Calls	Rules
ADM-30	All assets /assets	SA, PM, LO, SG, FO, AU view	GET /admin/assets?...	Filters: bank, status, category, region, legal hold, validity flags, agent
ADM-31	Asset detail /assets/{id}	As above; PM edits	GET/PUT /admin/assets/{id}, GET /admin/assets/{id}/timeline, /audit	Tabs: Overview, Status and timeline, Legal, Title and valuation, Documents, Media, Pricing and reserve, Listing, Leads, Viewings, Offers, Audit. Banners: LISTING BLOCKED, HIGH-RISK OCCUPANCY, REVIEW REQUIRED. Price, reserve and status edits record old and new values (AS-7). Status changes go through the state machine only
ADM-32	Surge review queue /review/assets	PM, SA	GET /admin/review/assets?stage=submitted|surge-review, POST /admin/assets/{id}/start-review, /advance, /request-changes (reason mandatory), /reject (reason mandatory)	
ADM-33	Publish readiness and listing control /assets/{id}/listing	PM, SA (listing.publish)	GET /admin/assets/{id}/publish-readiness, POST /approve, /publish, /unpublish, GET /public-preview	Pass/fail per guard: legal verified, title verified, valid valuation, valid land search, exterior image, no active injunction, no legal hold; watermark derivative status. Approved to Live only through the PublishListing service. Blocked publish returns 409 with failing guards listed (AS-8, LG-2, VL-2). Public preview uses the same DTO as the marketplace
ADM-34	Media management /assets/{id}/media	PM	Same upload, order and primary operations as BNK-08 under /admin/assets/{id}/images|videos, plus POST /admin/assets/{id}/images/{imageId}/regenerate-derivative	
ADM-35	Asset categories /settings/categories	SA	GET/POST/PUT /admin/asset-categories	Category code is generic (RE, VH, EQ) and never encodes the bank
23.4 Legal, title and valuation
ID	Page and route	Calls	Rules
ADM-40	Legal verification queue /legal/queue (LO, SA)	GET /admin/legal/queue?status=pending	Columns: asset, bank, instrument type, submitted date, injunction flag
ADM-41	Instrument verification workspace /legal/instruments/{id}	GET /admin/legal/instruments/{id}, POST /verify, POST /reject	Instrument fields (Spec section 9), linked documents via signed-link viewer, decision panel with notes. Every decision audited (LG-3). Settlement and judgment content is Legal/Confidential, per-access logged (LG-6)
ADM-42	Enforcement cases /legal/cases, /legal/cases/{id}	GET /admin/legal/cases[/{id}], POST /admin/legal/cases/{id}/verify, /reject	Pending Verification, then Verified, Legal Hold or Rejected
ADM-43	Injunction control (on ADM-41/42)	PUT /admin/legal/instruments/{id}/injunction	Setting true blocks publishing and immediately unpublishes any live listing. LISTING BLOCKED banner shown. Enforced in the application service, the domain invariant and a DB backstop (LG-2)
ADM-44	Legal holds /legal/holds	GET /admin/legal/holds, POST /admin/assets/{id}/legal-hold and /legal-hold/release (reason mandatory), GET /admin/assets/{id}/legal-hold/history	Hold from any non-terminal state force-unpublishes. Writes a LegalHoldEvent. Notifies bank and Surge legal (LG-4)
ADM-45	Title and land search /title/{assetId}, /title/queue	GET /admin/title/queue, GET/PUT /admin/assets/{id}/title, POST /admin/assets/{id}/land-searches, POST /admin/land-searches/{id}/verify, /reject	Validity window from settings. Daily job sets Expired and raises an N-days-before-expiry notification (TL-2)
ADM-46	Valuation /valuations/queue, /valuations/{id}	GET /admin/valuations/queue, POST /admin/assets/{id}/valuations, PUT /admin/valuations/{id}, POST /verify, /reject	Daily job flags review_required outside the validity window and blocks Approved to Live (VL-1, VL-2)
ADM-47	Document verification /documents/queue, /documents/{id}	GET /admin/documents?status=&type=, GET /admin/documents/{id}, POST /verify, /reject, /request-access-link, GET /access-log	Signed URL default 5 minutes. Each request writes DocumentAccessLog and AuditLog (DC-2)
23.5 Enquiries, leads, KYC and viewings
ID	Page and route	Calls	Rules
ADM-50	Enquiries inbox /enquiries (SG, SA)	GET /admin/enquiries[/{id}], POST /admin/enquiries/{id}/promote, /spam	Manual promote to Lead
ADM-51	Leads list and pipeline board /leads	GET /admin/leads?stage=&agent=&asset=&source=, POST /admin/leads/{id}/assign, POST /admin/leads/bulk-assign	Table and kanban views. Stages and terminals per section 9.2
ADM-52	Lead detail /leads/{id}	GET /admin/leads/{id}, POST /transition, GET/POST /activities, POST /request-kyc	Buyer summary, asset, activity timeline, stage control, KYC state, viewings, offers. Moving to Viewing requires KYC Verified (LD-3). Every status change creates a LeadActivity (LD-2)
ADM-53	Buyers /buyers, /buyers/{id}	GET /admin/buyers[/{id}], GET /admin/buyers/{id}/grants, POST /admin/grants/{id}/revoke, GET /admin/buyers/{id}/consents	Ghana Card number masked; decrypted only under explicit permission with audit logging
ADM-54	Agent assignment settings /settings/lead-assignment	GET/PUT /admin/settings/lead-assignment, GET /admin/agents	Round-robin or manual
ADM-60	KYC queue /kyc	GET /admin/kyc?status=submitted	
ADM-61	KYC review /kyc/{id}	GET /admin/kyc/{id}, POST /verify, POST /reject (buyer-visible note and internal note)	Submitted fields, Ghana Card front and back and proof of funds via signed links, consent status, decision panel. Submitted to Verified or Rejected, audited (KY-2). Verify plus all required consents creates BuyerAccessGrant (KY-4). Verification against NIA is Open Question 9
ADM-62	Consent versions /settings/consents	GET/POST /admin/consent-documents, POST /admin/consent-documents/{id}/publish	Published versions are immutable. New version applies to future acceptances (KY-3)
ADM-63	KYC field configuration /settings/kyc-fields	GET/PUT /admin/settings/kyc-fields	
ADM-70	Viewings calendar and list /viewings	GET /admin/viewings?from=&to=&agent=&status=	
ADM-71	Viewing detail and scheduling /viewings/{id}	GET /admin/viewings/{id}, POST /confirm, /reschedule, /cancel, /complete, /no-show, /high-risk-override (reason mandatory), /disclose-address	Double-booking check per agent (VW-1). High-risk occupancy cannot be confirmed without a recorded override (OC-1). Address disclosure requires a valid grant and Confirmed status, and is audited (VW-2)
23.6 Offers, fees and billing
ID	Page and route	Calls	Rules
ADM-80	Offers queue /offers	GET /admin/offers?status=&asset=&bank=&belowReserve=	Below-reserve offers flagged, never hidden (PR-3)
ADM-81	Offer detail /offers/{id}	GET /admin/offers/{id}, /revisions, POST /start-review, /forward-to-bank, /request-bank-exception, /counter (relay bank counter to buyer), /reject	Flow per section 9.3. Daily job expires stale offers (OF-4). Policy toggle controls what buyer detail the bank sees (OF-6)
ADM-82	Sale completion /offers/{id}/complete	POST /admin/offers/{id}/complete-sale (final sale price)	Records final_sale_price, creates Commission and Invoice(s), sets asset Sold/Completed, closes competing offers and leads (OF-5)
ADM-90	Fees /finance/fees (SA, FO)	GET/PUT /admin/fees	Type (flat or percentage), applies to (bank, buyer, global), value, active flag. No deployment needed (FE-1)
ADM-91	Bank agreements /finance/agreements	GET/POST /admin/bank-agreements, PUT /admin/bank-agreements/{id}	Effective-dated terms. Precedence: BankAgreement, Bank default, global Fee (FE-2)
ADM-92	Commissions /finance/commissions	GET /admin/commissions[/{id}]	FinalSalePrice x Rate%, round half away from zero to 2 dp. Rate snapshot stored. Check: GHS 950,000 at 4% gives GHS 38,000.00 (FE-2, FE-3, FE-5)
ADM-93	Invoices /finance/invoices, /finance/invoices/{id}	GET /admin/invoices, POST /invoices, GET /admin/invoices/{id}, POST /issue, /cancel, GET /pdf	Draft, Issued, then Paid, Overdue or Cancelled. VAT and levies are Open Question 6
ADM-94	Payments /finance/invoices/{id}/payments	POST /invoices/{id}/payments (Idempotency-Key), GET /admin/invoices/{id}/payments	Manual recording by Finance Officer. Overdue job runs daily (FE-4)
ADM-95	Outstanding fees /finance/outstanding	GET /admin/finance/outstanding	
23.7 Reports, users, audit and system settings
ID	Page and route	Calls	Rules
ADM-100	Reports centre /reports	GET /admin/reports/{type}?from=&to=&bank=, GET /admin/reports/{type}/export?format=pdf|xlsx	
ADM-101	Monthly bank reports /reports/monthly	GET /admin/reports/monthly?bank=&month=, POST /admin/reports/monthly/generate, GET /admin/reports/monthly/{id}/download	Auto-generated on the 1st for every active bank (RP-3)
ADM-110	Surge users /users, /users/new, /users/{id} (SA)	GET/POST /admin/users, PUT /admin/users/{id}, POST /deactivate, /reset-mfa, /force-logout	Role change forces logout (ID-3). Shared logins prohibited
ADM-111	Roles and permission matrix /settings/roles	GET /admin/roles, GET /admin/permissions, PUT /admin/roles/{id}/permissions	Editable by Super Administrator only, enforced server-side (ID-4). Seeded from section 11
ADM-112	Audit log /audit (SA, AU)	GET /admin/audit?..., GET /admin/audit/{id}, GET /admin/audit/export	Filters: actor, entity type, entity ID, action, date, tenant. Append-only, read-only UI, shows old and new values, includes document access and exact-address disclosure events
ADM-120	Validity rules /settings/validity	GET/PUT /admin/settings/validity-rules	Land search and valuation validity_period_days, reminder lead time N
ADM-121	Watermark rules /settings/watermarks	GET/PUT /admin/settings/watermark-rules	Text and requirement per asset classification
ADM-122	General settings /settings/general	GET/PUT /admin/settings	Signed-URL TTL, image limit (default 20), upload limits, offer validity default, session timeout
ADM-123	Notification templates /settings/templates	GET /admin/notification-templates, PUT /{id}, POST /{id}/test-send	
ADM-124	Notification outbox monitor /system/notifications	GET /admin/system/outbox?status=Pending|Sent	
ADM-125	Background jobs /system/jobs (SA)	GET /admin/system/jobs, POST /admin/system/jobs/{id}/trigger	BullMQ Dashboard / Arena plus summary of recurring jobs: land search expiry, valuation review, offer expiry, invoice overdue, monthly reports, retention
ADM-126	Reference sequences /settings/sequences	GET /admin/settings/sequences	Read-only for most. Counters never edited by hand
ADM-127	Lookups /settings/lookups	GET/POST/PUT /admin/lookups/{type}	Regions, property types, occupancy statuses, lead sources
ADM-128	Data retention /settings/retention	GET/PUT /admin/settings/retention, GET /admin/erasure-requests, POST /admin/erasure-requests/{id}/process	Values set after counsel guidance (KY-6; Open Question 9)
ADM-129	System pages /403, /404, /session-expired, /health		Health checks, SA only
24. Cross-Cutting Endpoints and Page Counts
Endpoints with no dedicated page, called by background jobs, integrations or shared UI components:

Endpoint	Used by	Notes
GET /health, /health/ready	Ops, load balancer	No auth, no tenant data
POST /webhooks/sms-delivery	Hubtel adapter	Updates notification delivery status; signature-verified
POST /internal/antivirus/callback	AV scanner hook	Releases or quarantines an uploaded document (DC-3)
GET /openapi/v1.json	Developers	Disabled or restricted in production
BullMQ background workers (no HTTP)	Scheduler	Land search expiry, valuation review flag, offer expiry, invoice overdue, monthly reports, notification dispatcher, retention
Application	Page groups	Page IDs
Public Marketplace	Browse, enquiry, verification, KYC, restricted data, viewings, offers, privacy, static	PUB-01 to PUB-16 (16)
Bank Portal	Auth, dashboard, assets, legal, documents, offers, reports, billing, users, account	BNK-01 to BNK-22 (22)
Surge Admin	Auth, dashboard, banks, assets, legal and title, leads, KYC, viewings, offers, finance, reports, users, settings, operations	ADM-01 to ADM-129 (about 60 screens across 13 groups)
PART 5. DELIVERY, CURRENT IMPLEMENTATION AND OPEN ITEMS
25. Delivery Plan and Build Order
Phase	Scope	Exit criteria	Pages delivered
1 Foundation	Monorepo structure, CI/CD, Postgres, Auth & MFA, Organizations, Banks, Users, Roles, Permissions, tenant context & RLS, AuditLog, Logger	Isolation and audit tests green; Super Admin can create bank and bank admin	ADM-01 to 05, ADM-20 to 23, ADM-110 to 112, BNK-01 to 05
2 Assets	Asset CRUD, categories, references, media upload, watermark worker (Sharp), pricing, status machine (partial)	Asset created with public ref; watermark derivative generated; originals private	ADM-30, 31, 34, 35 (API first, thin UI)
3 Legal and Title	Enforcement, instruments, injunction rule, legal hold, title, land search, valuation, document verification, validity jobs	Legal block test green; expiry flags working	ADM-40 to 47, ADM-120, 121
4 Bank Portal	React/TypeScript bank dashboard, asset submission, documents, basic reports	Bank user completes submission end to end	BNK-06 to 22 (BNK-13, 14 stubbed until phase 8)
5 Surge Admin	Admin shell, bank management, review queues, legal verification, listing approval, user management	Asset moves Draft to Approved to Live by role	ADM-10, 32, 33, 90 to 95 shells, 110 to 111 completed
6 Public Marketplace	Search, filters, cards, details, galleries, enquiry	Leak tests green; SEO and performance targets met	PUB-01 to 04, 15, 16
7 CRM and KYC	Leads, agents, KYC, OTP, consents, grants, secure disclosure, viewings	Buyer goes enquiry to KYC to grant to viewing	PUB-05 to 11, ADM-50 to 54, 60 to 63, 70, 71
8 Offers and Transactions	Offers, counter-offers, bank decision, exception flow, sale completion, commission, invoices, payments	Full sale scenario passes; commission snapshot verified	PUB-12, 13, BNK-13, 14, ADM-80 to 82, 90 to 95 completed
9 Reporting and Production	Dashboards, monthly reports, exports, monitoring, backups, pen test, hardening, UAT	Pen-test findings closed; go-live checklist signed	BNK-15, 16, ADM-100, 101, 122 to 128
26. Current Implementation (README)
Surge is a multi-tenant marketplace foundation with three independent web applications and an API. The implementation follows the PRD (red.md) for the TypeScript / Node.js architecture and the UI Design Direction (req.md) for portal and marketplace design. The portals use a shared, compact Windows-style UI shell built in React with Tailwind CSS; the marketplace uses a mobile-first, public-field-only layout.

Service	Local address
Public Marketplace	http://localhost:3000
Bank Portal	http://localhost:5300
Surge Admin	http://localhost:5200
REST API	http://localhost:5080
26.1 Run locally
Install Docker Desktop with Docker Compose, Node.js 22 LTS, and pnpm (or npm) for workspace dependency management.

Copy .env.example to .env. Replace all values with unique secrets: a JWT signing key of at least 32 random bytes, a base64-encoded 32-byte field-encryption key, and a bootstrap password meeting the account password policy.

Run docker compose up --build.

Open the addresses above. Sign in to Surge Admin with SURGE_BOOTSTRAP_ADMIN_EMAIL and SURGE_BOOTSTRAP_ADMIN_PASSWORD.

The first sign-in requires setting up an authenticator app. Use the displayed setup key, then sign in again with its current six-digit code.

The bootstrap administrator and Surge organization are created only if they do not already exist. Database migrations run on API startup. PostgreSQL uses a separate non-superuser application role; asset and audit tables enforce row-level security, and audit rows cannot be updated or deleted through normal SQL operations. Identity authenticator secrets are encrypted using SURGE_FIELD_ENCRYPTION_KEY; preserve this key securely and do not rotate it without a re-encryption plan.

For development without Docker, start PostgreSQL with the surge_app database role, then set SURGE_DATABASE_URL, JWT_SIGNING_KEY, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before running pnpm run dev in the API directory. Portal API origins are configured in each portal's configuration file or .env.

26.2 Included foundation
Clean TypeScript monorepo with Domain, Application, Infrastructure, API, shared React UI, separate Bank and Surge portals, and test suites.

Individual identity users, short-lived JWT access tokens, lockout on repeated password failures, authenticator-based MFA setup and verification for Surge staff and designated bank roles.

Separate /api/v1/public, /api/v1/bank and /api/v1/admin API areas; portal tokens are scope-checked and bank asset access is tenant-filtered.

Asset draft creation, submission, review checks, approval, publication, legal hold, injunction blocking, audit events and yearly public-reference generation.

PostgreSQL migrations, tenant row-level security for assets and audit records, and append-only audit enforcement.

Public asset search and details use dedicated projections that omit internal addresses, organization identity, reserve and minimum-offer restrictions, and other confidential fields.

Public-site pricing, accessibility basics, API-backed search, and professional status and warning presentation without emojis.

Commission calculator with the GHS example and half-away-from-zero rounding tests.

26.3 Implementation boundary and gap against this document
This is a runnable foundation, not yet the complete nine-phase production marketplace. The following remain to be implemented:

Full media and document storage and scanning (DC-1 to DC-4, AS-3 to AS-5).

Bank user invitations and email verification (ID-1, BNK-04, ADM-23).

Permission administration (ID-4, ADM-111).

Land-search and valuation records and jobs (TL-2, VL-1, VL-2; ADM-45, 46, 120).

Public enquiries and CAPTCHA (PM-4, PUB-04).

Buyer KYC, consents and access grants (KY-1 to KY-6; PUB-05 to 09; ADM-60 to 63).

Viewing scheduling (VW-1, VW-2; PUB-10, 11; ADM-70, 71).

Offers and counter-offers (OF-1 to OF-6; PUB-12, 13; BNK-13, 14; ADM-80 to 82).

Invoices and payments (FE-1 to FE-5; ADM-90 to 95; BNK-17).

Reports (RP-1 to RP-6; BNK-15, 16; ADM-100, 101).

Notification delivery (section 10.13; ADM-123, 124).

Production observability, backup and retention workflows (sections 12 and 25, Phase 9).

Do not use real personal, legal or financial records until those controls and the Ghanaian legal and compliance decisions are complete.

26.4 Verify
Bash
pnpm install
pnpm run build
pnpm run test
The API OpenAPI document is available at /openapi/v1.json when the API server is running.

27. Gaps That Change Pages or Endpoints
These come from the PRD's Open Questions and affect what gets built.

Buyer authentication (Q2). All PUB-05 to PUB-14 pages assume a phone-OTP session. If lightweight buyer accounts are chosen instead, add register, login and password pages.

Asset state after offers (Q3). Decides whether PUB-03 stays visible once an offer is pending, and whether concurrent offers are allowed (affects BNK-13 and ADM-80).

Below-reserve exception (Q4). Decides who can call request-bank-exception decisions (BNK-14 or ADM-81) and whether a time limit field is needed.

Buyer fees (Q5). If gateway collection is wanted, add a public payment page and webhook endpoints. Currently payments are manual only (ADM-94).

Bank sight of buyer identity (Q7). Decides the fields returned by GET /bank/offers/{id}.

Bulk import (Q12). If needed, add BNK import pages and POST /bank/assets/import.

Spec section 30 baseline. Reconcile every proposed path in this document against it.

Not in PRD scope. Online purchase-price payment, Lands Commission integration and mobile apps have no pages here.

28. Open Questions and Spec Gaps
These must be answered (owner: Surge product plus counsel) before the relevant phase starts.

Role inventory: confirm final role list and naming (Asset Manager vs Property Manager; bank Legal/Recovery Officer and Viewer permissions; Viewer/Auditor separation).

Buyer authentication: buyers have no accounts. Confirm phone-OTP session plus magic link, or lightweight buyer accounts. This document assumes an OTP-verified buyer session.

Asset public status after offers: does the asset remain publicly listed while offers are pending? Can multiple offers be live concurrently?

Below-reserve exception: who approves (bank Approver only, or Surge plus bank), and is there a time limit?

Buyer fees and payments: manual recording only, or mobile money or gateway integration (for example Hubtel)? Currency always GHS?

Commission precedence: confirm BankAgreement, then Bank default, then global Fee; rounding rule; VAT and levies on invoices.

Bank visibility of buyer identity: what may a bank see about a buyer on an offer (name, KYC summary, nothing)?

Document validity defaults: default validity_period_days for land search and valuation, and reminder lead time.

KYC retention and legal basis: Ghana data-protection requirements, handling of Ghana Card numbers, counsel sign-off, and whether verification against NIA services is expected.

Watermark policy: which classifications require the watermark; text per classification.

Data residency, hosting region and SLA targets.

Bank data onboarding: is bulk import of existing assets (CSV or Excel) needed?

Asset lifecycle ambiguity: Sold and Completed both exist; confirm Completed is transaction closed and Sold is asset status, and whether Buyer Interest, Viewing and Offer are real statuses or derived from child records (recommended: derived).

Data model cleanup: Bank duplicates Organization; recommend a single table with a Bank profile 1:1. Enquiry, OfferRevision and BuyerAccessGrant need Spec owner approval.

29. Glossary
Tenant: a bank (or Surge) as an isolated data owner. Listing: the public publication state of an asset. Grant: a buyer's authorization to see an asset's restricted data. Injunction block: hard rule preventing publication while an injunction is active. Reserve: minimum price the bank wants; restricted. Signed URL: short-lived, single-purpose link to a private file.