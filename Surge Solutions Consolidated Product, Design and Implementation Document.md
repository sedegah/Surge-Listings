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


# Surge Solutions — Complete workflow and rigorous testing plan

Your platform should work as one connected asset-disposition system with three interfaces, not three separate mockups.
An asset created in the Bank Portal must progress through legal checks, document verification, approval and publication
in Surge Admin, then appear in the Public Marketplace only when all publication requirements are satisfied.

The critical requirement is that every action changes the same underlying record. If an administrator places an asset on
legal hold, for example, the marketplace must stop displaying it as available, the bank must see the updated status, and
the audit log must record who made the change.

## 1. The complete end-to-end workflow

### 1. Bank Portal

Create asset → enter title information → upload supporting documents → save draft

### 2. Legal and document checks

Enforcement basis → title verification → valuation → injunction and legal-hold checks

### 3. Surge Admin

Review submission → request corrections if needed → approve or reject → publish

### 4. Public Marketplace

Search published assets → inspect details → submit an enquiry without buyer login

### 5. Lead and viewing management

Create lead → assign officer → qualify buyer → schedule viewing → complete KYC when required

### 6. Offers, sale and settlement

Submit offer → bank decision → negotiate → approve sale → invoice → payment confirmation → close asset

The workflow must also support exceptions: rejected submissions, missing documents, title disputes, injunctions, legal
holds, expired listings, withdrawn offers, failed payments and cancelled viewings.

## 2. Shared data and status rules

Every interface must read and update the same asset, lead, viewing, offer, document and payment records.

| Record | Example lifecycle |
| ------------ |
----------------------------------------------------------------------------------------------------------- |
| Asset | Draft → Submitted → Under Review → Changes Required / Approved → Published → Under Offer → Sold / Withdrawn |
| Legal review | Not Started → In Progress → Cleared / Disputed / On Hold |
| Documents | Missing → Uploaded → Pending Verification → Verified / Rejected / Expired |
| Lead | New → Assigned → Contacted → Qualified / Unqualified → Converted / Closed |
| Viewing | Requested → Scheduled → Confirmed → Completed / Cancelled / No-Show |
| KYC | Not Required Yet → Pending → In Review → Verified / Rejected / Expired |
| Offer | Submitted → Under Review → Counteroffer / Accepted / Rejected / Withdrawn / Expired |
| Payment | Uninvoiced → Invoiced → Pending → Confirmed / Failed / Refunded |
| Listing | Unpublished → Pending Approval → Published → Suspended / Withdrawn / Sold |

These are related but separate state machines. For example, verifying documents must not automatically publish an asset,
and accepting an offer must not automatically mark payment as received.

### Mandatory business rules

- Injunctions and active legal holds: block publication and new sale progression. Existing enquiries and offers must be
handled according to the relevant legal and operational rules.
- Title and ownership: require the necessary title information and supporting evidence before approval.
- Enforcement basis: support a memorandum, borrower–lender settlement, and court judgment, with the appropriate evidence
for each.
- Confidentiality: do not reveal the bank's identity to public buyers where anonymous bank listings are required.
- Buyer access: allow public browsing and initial enquiries without creating a buyer account. Collect KYC information
securely when required by the process.
- Contact routing: buyer enquiries must go to Surge Solutions, not directly to the bank or borrower.
- Fees: support bank-side and buyer-side fee configurations, with the applicable terms, calculations, invoices and
payment status recorded.
- Auditability: record the actor, timestamp, action, affected record and relevant before-and-after values for
consequential changes.

## 3. All pages that need to be built or refined

I would treat the following as the full page inventory for your prototype. Some pages may be tabs or detail views rather
than separate URLs, but each needs its own working state, controls, validation and navigation.

### A. Bank Portal

Primary objective: enable bank officers to manage assets and make sale decisions without accessing Surge's global
administrative controls.

B01

Dashboard

Live counts for assets, submissions, offers, viewings, pending decisions and overdue tasks.

B02

My Assets / Asset Register

Search, filter, sort, create, edit, archive and open individual assets.

B03

Create / Edit Asset

Asset category, location, description, ownership, title details, valuation, pricing and sale terms.

B04

Legal & Enforcement

Enforcement basis, case references, borrower–lender settlement, court judgment, injunctions and legal status.

B05

Title & Documents

Upload, preview, classify, replace and track title documents and verification outcomes.

B06

Valuation Details

Valuation amount, currency, valuation date, valuer, supporting report and expiry.

B07

Submission & Listing Status

Submit for review, view review findings, respond to corrections and track approval.

B08

Viewings

View requests, availability, scheduling, attendance, cancellations and viewing outcomes.

B09

Offers & Decisions

Offer comparison, proposed terms, accept/reject/counteroffer decisions and decision history.

B10

Billing

Bank fees, invoices, payment status, receipts, disputes and downloadable records.

B11

Reports

Asset pipeline, sales, offer conversion, ageing, fees and exportable reports.

B12

Users & Permissions

Bank users, roles, access restrictions, invitations and account status.

B13

Notifications

Real events such as review results, new offers, viewing requests, holds and payment updates.

B14

Asset Detail / Activity History

Consolidated record, linked documents, status history, notes and permitted actions.

### B. Surge Admin

Primary objective: centrally govern the platform, verify records, control publication and manage the transaction
pipeline.

A01

Admin Dashboard

Live operational KPIs, review backlog, overdue tasks, active holds and sales pipeline.

A02

Banks

Bank onboarding, verification, organisation details, fee terms and bank activation.

A03

Users & Roles

Role assignment, access scopes, account suspension and permission checks.

A04

Asset Register

All-bank asset search, filters, asset detail, duplicate detection and record history.

A05

Legal & Enforcement Review

Check enforcement evidence, injunction status, disputes and legal holds.

A06

Title & Land Search

Title particulars, search outcomes, ownership discrepancies and supporting evidence.

A07

Valuations

Review valuation reports, identify expired valuations and request corrections.

A08

Document Verification

Secure document review, approve/reject, rejection reasons, re-upload and version history.

A09

Listings Approval

Readiness checklist, approve/reject, request changes, publication and withdrawal.

A10

Leads

Enquiry inbox, assignment, qualification, contact history and follow-up tasks.

A11

KYC Queue

Secure identity verification, restricted access, review decisions and expiry handling.

A12

Viewings

Scheduling, conflicts, assignment, confirmation, attendance and cancellation management.

A13

Offers

Offer comparison, bank decision tracking, counteroffers, expiry and transaction progression.

A14

Invoices & Payments

Fee calculations, invoice generation, payment references, reconciliation and refunds.

A15

Reports

Cross-bank operational, commercial, financial and compliance reporting.

A16

Fee & Agreement Settings

Bank and buyer fee rules, agreement versions, effective dates and calculation previews.

A17

Audit Log

Searchable, timestamped, attributable record of consequential changes.

A18

Notifications & Tasks

Actionable event inbox, assignment, delivery status and overdue follow-ups.

A19

Legal Hold & Listing Suspension

Place/release holds, record reasons and evidence, block restricted actions and track resolution.

A20

Sale Completion & Closure

Completion checklist, confirmed payment, transaction documents, final status and listing removal.

### C. Public Marketplace

Primary objective: help buyers discover assets, understand the purchase process and contact Surge without exposing
restricted bank or legal information.

P01

Buy Assets / Search Results

Search by category, location, price range and availability; functional filters and sorting.

P02

Asset Details

Images, description, location, price or price-on-application, public reference, documents summary and status.

P03

Enquiry Form

Buyer details, interest, consent, validation, submission confirmation and Surge contact information.

P04

How It Works

Accurate explanation of enquiry, viewing, KYC, offer, approval and completion.

P05

KYC & Verification Information

Explain requirements, timing, data use and secure submission channels.

P06

FAQ

Working answers and links for pricing, eligibility, viewings, offers and legal disclosures.

P07

Contact Surge

Functional contact channels and enquiry routing.

P08

Viewing Request / Confirmation

Request a viewing, receive a reference and see scheduling confirmation without buyer login.

P09

Offer Process / Offer Acknowledgement

Explain offer requirements and show a reference or next steps when an offer is submitted through the authorised process.

P10

Privacy, Terms & Disclaimers

Published legal terms, privacy information and asset-specific sale conditions.

### D. Cross-platform and system pages

These are easy to overlook, but they matter for a rigorous test.

- Authentication, session expiry and access-denied screens for bank and admin users.
- Not-found and error pages.
- Empty states, loading states and failed-save states.
- Confirmation dialogs for destructive or irreversible actions.
- File upload errors, invalid formats, excessive sizes and interrupted uploads.
- Duplicate submission handling and retry behaviour.
- Record-lock and concurrent-edit conflict handling.
- Audit history and record-level activity views.
- Export and print output.
- Responsive layouts for smaller screens.
- Data reset and test-environment controls, kept separate from production.

Highest-priority refinements: Asset creation, legal review, document verification, listing approval, marketplace
visibility, enquiries, lead management, offers, fee calculation and sale completion. These are the pages where a broken
transition can corrupt the entire workflow.

## 4. Rigorous testing plan

Use a controlled test environment and a unique test reference for every scenario. Do not use real buyer identity
documents or production financial information during prototype testing.

## Interactive QA test tracker

64 test cases across seven suites. Mark each case as passed, failed or blocked as you test. This tracker is for
organising your test session; results are not automatically connected to your application.

Overall progress

1 / 64 completed

Passed: 0

Failed: 1

Blocked: 0

Suite 1 — Asset creation and validation

T001

Create a complete property asset

Asset saves as Draft with a unique reference.

PassFailBlocked

T002

Save an incomplete draft

Draft saves only where permitted; missing fields remain visible.

PassFailBlocked

T003

Submit without required title information

Submission is blocked with field-level errors.

PassFailBlocked

T004

Submit without enforcement evidence

Submission is blocked or routed to the configured exception queue.

PassFailBlocked

T005

Enter negative price or invalid valuation

Invalid monetary values are rejected.

PassFailBlocked

T006

Create duplicate asset reference or duplicate record

Unique identifiers are enforced and likely duplicates flagged.

PassFailBlocked

T007

Edit an existing asset

Changes persist and appear on its detail page.

PassFailBlocked

T008

Refresh or reopen the page

Saved records remain intact.

PassFailBlocked

Copy full test reportReset tracker

## 5. What constitutes a successful test?

Do not mark a page as complete simply because it looks correct. A test passes only when all applicable criteria hold:

1. Behaviour: the action works and the user receives accurate feedback.
2. Persistence: the saved result survives refresh and reopening.
3. Cross-interface consistency: all permitted interfaces show the correct state.
4. Permissions: unauthorised roles cannot read or change protected information.
5. Validation: invalid inputs and prohibited state transitions are rejected.
6. Audit: consequential changes are traceable.
7. Recovery: failed requests, retries and conflicting edits do not corrupt records.

For the critical business rules, test both the normal path and attempts to bypass the interface using direct requests. A
disabled button alone is not a security control.

## 6. Important implementation distinction

The HTML you supplied contains the application shell and loads `app.js`, but it does not itself establish a production
backend. A browser-only prototype can demonstrate shared records using local storage, but that is not genuine multi-user
synchronisation: other devices, users and browsers will not share those records reliably.

For production, use a shared backend database and server-enforced permissions, validation and workflow transitions.
Document storage must also be access-controlled, particularly for title documents and KYC records. Payment confirmation
should come from a trusted reconciliation or payment-provider process, not a client-side status toggle.

My recommended order of work: first complete asset creation and legal controls, then the approval-to-publication
lifecycle, then enquiries and viewings, then offers and financial settlement, and finally permissions, audit logging and
resilience. This order tests the system's core data integrity before adding more interface polish.


# Surge Solutions — Detailed implementation specification and QA blueprint

The next step is to turn the initial workflow into an executable product specification: define exactly what each page displays, what each button does, which records it changes, what prevents an action, and how to prove that the change propagated to the other two interfaces.

For Surge Solutions, I would use a shared asset record, explicit workflow transitions, role-based access control, and an immutable audit trail as the foundation. Everything else — dashboards, listings, notifications, reports and transaction screens — should derive from that underlying system rather than maintain separate copies of the same data.

## 1. System architecture and source of truth

### Three user interfaces

Bank Portal · Surge Admin · Public Marketplace

Authenticated requests, public requests and validated responses

### Shared application API

Authentication · Permissions · Validation · Workflow rules · Audit events

Relational database

Assets, organisations, documents, leads, offers, payments and status history.

Private file storage

Title evidence, valuation reports, KYC files and controlled document access.

Event and notification service

Status-change events, user notifications, retries and delivery tracking.

Audit and reporting

Traceable changes, permission checks, financial summaries and exports.

### Data consistency rules

1. An asset has one stable ID for its entire lifetime, regardless of its publication status.
2. Each bank owns its own records; Surge's authorised operators can access cross-bank records according to assigned permissions.
3. Public pages receive only explicitly approved public fields. They should not retrieve confidential bank or buyer records and hide them with CSS.
4. Every state change is validated on the server, not merely by enabling or disabling a button.
5. Related changes that must succeed together — such as accepting an offer and recording the corresponding transaction decision — should be handled atomically.
6. Notifications and reports must derive from saved events and authoritative records. They must not invent activity to make the interface look populated.
7. A failed save must never display a false success message or silently discard user input.

For a working prototype, a single shared database and a documented API are sufficient. You do not need to introduce microservices merely to demonstrate these workflows.

## 2. Detailed Bank Portal specifications

Each page below should have a defined layout, actions, validation rules and expected result.

B01 — Dashboard

Purpose: give bank officers an accurate view of their asset pipeline.

- KPI cards: total assets, drafts, submitted for review, published, on hold, active offers and completed sales.
- Work queues: missing documents, correction requests, pending decisions and upcoming viewings.
- Recent activity: real actions with timestamps and actor names.
- Filters: date range, asset category, location and status.

Actions: open asset, continue draft, review corrections, open offer, export report.

Acceptance: each count must match the corresponding filtered records. Clicking a KPI opens that exact subset.

B02–B03 — Asset register and create/edit form

- Search by asset reference, title, location and permitted identifiers.
- Filters for category, status, assigned officer and date created.
- Asset form sections: classification, address, description, ownership, title particulars, valuation, asking price, sale terms and media.
- Save Draft, Validate, Submit for Review and Cancel.

Validation: require the fields applicable to the asset type. Validate currency and monetary precision, positive area where applicable, plausible dates, required documents and permitted state transitions.

Acceptance: saving and reopening preserves every field. Creating an asset produces one unique reference, not a duplicate every time the Save button is clicked.

B04–B06 — Legal, title, documents and valuation

- Separate enforcement basis from legal clearance.
- Capture relevant case references, title particulars, search outcomes, injunctions, disputes and supporting evidence.
- Classify uploaded files and show verification status, rejection reason, version and reviewer.
- Record valuation amount, currency, date, valuer and report.
- Display outstanding requirements prominently.

Actions: upload, replace, preview if authorised, submit for verification, respond to corrections and view history.

Acceptance: uploading a file does not automatically verify it. Replacing evidence triggers reassessment where required. An unresolved legal hold prevents publication.

B07 and B14 — Submission, listing status and asset detail

- Show a timeline of every workflow transition.
- Present outstanding checks and actionable correction requests.
- Distinguish administrative approval from public publication.
- Show the public listing reference and link only when published.
- Show suspension reasons and the role permitted to resolve them.

Actions: submit, resubmit, view decision, open public listing, request permitted withdrawal.

Acceptance: a bank cannot use a client-side shortcut to bypass review or publish directly.

B08–B10 — Viewings, offers and billing

- Viewings: requests, assigned officer, confirmed date, attendance and outcome.
- Offers: buyer reference, amount, terms, expiry, decision, counteroffers and decision history.
- Billing: fee basis, applicable rate, invoice number, payment status and receipts.

Actions: confirm or cancel a viewing, make an authorised offer decision, review invoice and export a statement.

Acceptance: the bank only sees the records associated with its organisation. An accepted offer is not the same as a completed sale or confirmed payment.

B11–B13 — Reports, users and notifications

- Reports use defined metrics and consistent date filters.
- User management supports invitations, role changes and deactivation.
- Notifications are tied to actual events and link to the relevant record.

Acceptance: revoked users lose access immediately or within the documented session policy; exports respect the same access restrictions as the pages they represent.

## 3. Detailed Surge Admin specifications

The admin portal is the control centre. It needs to do more than display all bank records: it must enforce review independence, keep the decision history intact, and prevent an operator from advancing an asset through an unsafe state.

A01

Admin Dashboard

Show review backlog, aged submissions, document failures, legal holds, unassigned leads, expiring offers, outstanding invoices and completed sales. Every KPI must link to its underlying filtered records.

A02–A03

Banks, users and roles

Onboard a bank, verify its organisation profile, assign authorised users, configure role scopes and deactivate access. Enforce organisation-level access and separation of duties.

A04

Global asset register

Search across authorised tenants, inspect the complete record, identify duplicate assets, view linked documents and transactions, and inspect the current status and history.

A05–A07

Legal review, land search and valuation

Capture review findings, source and date of evidence, outstanding checks, discrepancies and the responsible reviewer. Support escalation and prevent clearance where mandatory checks remain unresolved.

A08

Document verification

Display document type, asset link, uploader, upload time, version, review status and reviewer. Approve or reject individual documents with reasons. Prevent a rejected or superseded version from satisfying a mandatory requirement.

A09

Listing approval

Provide a readiness checklist with explicit pass/fail results for ownership, enforcement basis, legal status, documents, valuation, sale terms and public listing content. Request changes, reject, approve and publish through distinct actions.

A10–A12

Leads, KYC and viewings

Assign enquiries, record contact attempts, qualify leads, restrict identity records, manage verification decisions, resolve scheduling conflicts and record attendance or cancellation.

A13

Offers

Display offers in comparable terms and currencies, enforce expiry, support counteroffers and withdrawal, capture the authorised bank decision and preserve every decision version.

A14

Invoices and payments

Calculate charges using versioned fee rules, generate invoice references, track payment attempts, reconcile verified receipts and handle failed payments or authorised refunds.

A15–A16

Reports and configuration

Provide documented metric definitions, date and organisation filters, controlled exports, fee previews, agreement versions and effective dates. Configuration changes must not silently rewrite historical invoices.

A17–A18

Audit log, notifications and tasks

Search events by asset, actor, action and date. Track notification delivery and retries. Assign operational tasks, due dates and escalation status.

A19–A20

Legal holds, suspension and sale closure

Record hold authority, reason, supporting evidence and release conditions. Suspend publication and restrict prohibited progression. Close a sale only after the configured completion evidence and financial requirements are satisfied.

### Approval checklist: exact expected behaviour

An asset must not be publishable just because its status says `Approved`. The system should evaluate the actual current record.

| Gate               | Required check                                                                   | Failure outcome                     |
| ------------------ | -------------------------------------------------------------------------------- | ----------------------------------- |
| Ownership          | Required ownership/title evidence is present and verified                        | Block approval                      |
| Enforcement        | Applicable enforcement basis and evidence are recorded                           | Block approval                      |
| Legal status       | No unresolved blocking injunction, dispute or hold                               | Block publication                   |
| Documents          | All mandatory document types are verified and current                            | Return for correction               |
| Valuation          | Required valuation is valid under the configured policy                          | Return for correction               |
| Sale terms         | Price or POA, conditions and relevant fee disclosures are complete               | Block publication                   |
| Listing content    | Public description, category and permitted images are valid                      | Return for correction               |
| Approval authority | Reviewer has permission and any required separation-of-duties conditions are met | Deny action                         |
| Final publication  | All gates still pass at the moment of publishing                                 | Deny action if any gate has changed |

These are proposed operational controls, not a substitute for legal advice on the applicable Ghanaian asset-disposition requirements. The actual mandatory evidence and approval authorities should be configurable and formally agreed before production use.

## 4. Detailed Public Marketplace specifications

The marketplace must be functional without exposing internal operations.

P01

Search and browse

Provide category, region/location, price range, availability and keyword filters. Include clear-filter, sort-by-price, sort-by-date and pagination controls. Counts must reflect the active filters.

P02

Asset detail

Show the public reference, description, permitted location detail, photographs, price or POA, sale conditions, viewing availability and enquiry CTA. Do not expose internal bank IDs, borrower identities, private documents, legal correspondence or reviewer notes.

P03

Buyer enquiry

Collect only necessary contact information, enquiry type and consent where required. Validate the input, prevent duplicate submissions, rate-limit abuse and return a real enquiry reference.

P04

How it works

Explain the sequence from enquiry to viewing, applicable buyer checks, offer submission, bank decision, payment and completion. Avoid promising that an enquiry guarantees a purchase.

P05

KYC information

Explain when verification is required, why information is collected, how it is handled and how the buyer can proceed securely. Never request sensitive identity documents through an unprotected generic form.

P06–P07

FAQ and Contact

Provide real, maintained answers and working contact channels. Route enquiries to the correct Surge team and preserve the resulting contact history.

P08

Viewing request

Collect preferred dates or slots, create a request reference and show whether it is pending, confirmed or declined. Never display a confirmed appointment before it has actually been confirmed.

P09

Offer process and acknowledgement

Explain eligibility and submission requirements. If online offers are enabled, use a proper form with clear terms, acknowledgement and authoritative server-side validation. Otherwise, direct buyers to the authorised offer channel.

P10

Privacy, terms and disclaimers

Provide accessible policy pages, applicable terms, consent records where required and accurate explanations of the intermediary's role and the status of each listing.

### Public status behaviour

The public interface should not mirror every internal status.

- `Draft`, `Under Review`, `Rejected` and `Changes Required`: not publicly discoverable.
- `Published`: publicly discoverable and available for enquiries, subject to configured restrictions.
- `Under Offer`: display the configured availability message; do not automatically assume the asset is unavailable unless that is the sale policy.
- `Suspended` or `On Hold`: remove from active search results and prevent new prohibited actions.
- `Sold` or `Withdrawn`: remove from active listings; an appropriate unavailable page may remain accessible if the business requires it.

Direct URL access must follow the same rules as search results. Hiding a card is not enough.

## 5. Workflow state transitions and edge cases

The following transitions should be implemented explicitly. An action not listed as valid should be denied by default.

| Entity      | Current state           | Action                         | Expected next state             |
| ----------- | ----------------------- | ------------------------------ | ------------------------------- |
| Asset       | Draft                   | Submit with valid requirements | Submitted                       |
| Asset       | Submitted               | Begin review                   | Under Review                    |
| Asset       | Under Review            | Request corrections            | Changes Required                |
| Asset       | Changes Required        | Resubmit                       | Submitted                       |
| Asset       | Under Review            | Approve                        | Approved                        |
| Asset       | Approved                | Publish after revalidation     | Published                       |
| Asset       | Published               | Place authorised legal hold    | Suspended / On Hold             |
| Asset       | Published               | Withdraw with authority        | Withdrawn                       |
| Lead        | New                     | Assign officer                 | Assigned                        |
| Lead        | Assigned                | Record contact                 | Contacted                       |
| Viewing     | Requested               | Confirm valid slot             | Confirmed                       |
| Viewing     | Confirmed               | Record attendance              | Completed                       |
| Offer       | Submitted               | Bank requests revision         | Counteroffer / Revision Pending |
| Offer       | Submitted               | Bank accepts                   | Accepted                        |
| Offer       | Submitted               | Bank rejects                   | Rejected                        |
| Offer       | Submitted               | Buyer withdraws                | Withdrawn                       |
| Invoice     | Issued                  | Verify successful settlement   | Paid                            |
| Transaction | Eligible for completion | Complete required checks       | Completed                       |

Important: the labels above are a suggested model. Your implementation can use separate status fields for the asset's lifecycle, legal state, publication state and transaction state. That is often safer than forcing all concepts into one giant status field.

### Edge cases that require explicit decisions

1. Legal hold during an accepted offer: freeze prohibited transaction steps, preserve the offer history and notify authorised parties.
2. Title document rejected after publication: invalidate the affected verification, suspend the listing if the document is mandatory and create a review task.
3. Bank changes price while offers exist: preserve previous offer terms; decide whether the buyer must reaffirm the offer.
4. Two officers accept different offers: use a concurrency check so only a valid decision is committed.
5. Payment callback arrives twice: process it idempotently and never double-count the payment.
6. Notification delivery fails: retain the business action and retry delivery without repeating the underlying action.
7. A user loses permission mid-session: recheck permissions on every sensitive server request.
8. An asset is withdrawn with scheduled viewings: notify affected parties and update appointments according to policy.
9. A valuation expires after approval: reassess whether the listing can remain active under the configured valuation rules.
10. A fee schedule changes mid-transaction: use the applicable agreed fee version; never silently recalculate an existing invoice.

## 6. Database design required to support the workflows

The following is a recommended logical schema. It is not a claim about tables already implemented in your `app.js`.

| Table / entity          | Important fields                                                    | Purpose                           |
| ----------------------- | ------------------------------------------------------------------- | --------------------------------- |
| `organisations`         | `id`, `name`, `type`, `status`                                      | Banks and platform organisations  |
| `users`                 | `id`, `organisation_id`, `email`, `status`                          | User identities                   |
| `roles` / `permissions` | `role_id`, `permission_key`, `scope`                                | Access control                    |
| `assets`                | `id`, `reference`, `organisation_id`, `category`, `status`, `price` | Authoritative asset record        |
| `asset_locations`       | `asset_id`, address fields, coordinates if needed                   | Asset location                    |
| `asset_legal_records`   | `asset_id`, enforcement basis, case reference, legal status         | Legal and enforcement information |
| `documents`             | `id`, `asset_id`, type, storage key, version, status                | Document metadata                 |
| `document_reviews`      | `document_id`, reviewer, decision, reason, timestamp                | Verification history              |
| `valuations`            | `asset_id`, amount, currency, date, report reference                | Valuation history                 |
| `listings`              | `asset_id`, publication status, published date                      | Public availability               |
| `leads`                 | `id`, `asset_id`, buyer contact reference, status, assigned user    | Buyer enquiries                   |
| `viewings`              | `id`, `lead_id`, `asset_id`, slot, status                           | Viewing workflow                  |
| `kyc_cases`             | `id`, buyer reference, status, review metadata                      | Restricted buyer verification     |
| `offers`                | `id`, `asset_id`, buyer reference, amount, currency, status, expiry | Offers                            |
| `offer_events`          | `offer_id`, event, actor, timestamp, terms version                  | Offer decision history            |
| `fee_rules`             | `id`, payer, calculation method, rate, effective dates              | Versioned fees                    |
| `invoices`              | `id`, transaction reference, amount, currency, status               | Billing                           |
| `payments`              | `id`, invoice reference, provider reference, amount, status         | Payment reconciliation            |
| `transactions`          | `id`, asset, accepted offer, completion status                      | Sale completion                   |
| `audit_events`          | actor, action, entity, timestamp, change details                    | Traceability                      |
| `notifications`         | recipient, event reference, delivery status                         | Real user notifications           |

### Data integrity rules

- Use immutable IDs and unique constraints for asset references, invoice numbers and external payment references.
- Store money as exact decimal values or integer minor units, with an explicit currency. Never use floating-point arithmetic for financial calculations.
- Store timestamps consistently and display them in the configured local timezone.
- Keep document contents in private storage and store their metadata in the database.
- Use foreign keys and transactions to prevent orphaned offers, documents, invoices and payments.
- Use an event or transactional-outbox pattern if a committed state change must reliably trigger a notification.
- Restrict access to KYC and legal records independently of ordinary asset permissions.
- Never treat a user-supplied `organisation_id`, `role`, `payment_status` or `verified` flag as authoritative without server-side checks.

For the current prototype, you can use a simpler schema initially. The important thing is to avoid storing a different asset status inside each interface.

## 7. Expanded testing matrix

Use these scenarios to go beyond clicking every button. They test whether the system remains correct when users make mistakes, act concurrently or try to bypass intended workflows.

## Additional high-value tests

Security and controlsData integrityUX and resilience

Q001 — Publication gate

Attempt to publish with one mandatory document missing

Expected: Publication denied; missing document identified.

Q002 — Publication gate

Verify all documents, then add a legal hold before publishing

Expected: Fresh validation blocks publication.

Q003 — Tenant isolation

Bank A requests Bank B's asset using its ID

Expected: No restricted data is disclosed.

Q004 — Payment integrity

Submit a forged browser request setting an invoice to paid

Expected: Payment remains unconfirmed.

Q005 — Offer concurrency

Two authorised users accept competing offers simultaneously

Expected: Only a permitted, consistent decision is committed.

Q006 — Audit integrity

Attempt to edit or delete a previous audit event

Expected: Unauthorised alteration is denied.

Q007 — KYC privacy

Attempt to retrieve another buyer's identity files

Expected: Access is denied and the attempt is recorded as appropriate.

Q008 — Server validation

Call a prohibited transition directly through the API

Expected: Server rejects the transition.

0 of 24 additional tests marked complete

Copy test cases

### Performance and reliability tests

For a more serious test run, also check:

- 100, 1,000 and 10,000 asset records to identify slow queries and broken pagination.
- Simultaneous users creating assets and submitting offers.
- Large result sets, long text fields and multiple document versions.
- Repeated requests after timeouts.
- Database outages, storage failures and expired authentication sessions.
- Search results immediately after publication, withdrawal and suspension.
- Dashboard totals against independently calculated database totals.
- Backup restoration and recovery of asset, document and transaction relationships.

The numbers above are proposed test volumes, not performance guarantees. Define response-time and throughput targets based on the expected production workload, then measure them under realistic conditions.

## 8. Page-by-page refinement backlog

This is the order I would use to decide what to fix first in your existing HTML and `app.js`.

P0

Critical — must work before end-to-end testing

- Shared asset records across all three applications.
- Asset creation, editing, saving and resubmission.
- Legal holds and document verification gates.
- Approval and publication rules.
- Public visibility and direct URL access control.
- Offer decisions and payment verification.
- Tenant isolation, role enforcement and audit records.

P1

High — required for a credible operational workflow

- Leads, assignments and contact history.
- Viewing schedules and conflict detection.
- KYC review and document restrictions.
- Counteroffers, offer expiry and transaction closure.
- Fee calculation, invoices and reconciliation.
- Real notifications, reports and exports.

&#x20;P2&#x20;

Polish — improve usability and maintainability

- Menu navigation and keyboard shortcuts.
- Document tabs and breadcrumb behaviour.
- Search filters, sorting and pagination.
- Responsive layouts and accessibility.
- Loading, empty, error and confirmation states.
- Print formatting and report presentation.

## 9. How to run a complete acceptance test

Use the same test asset throughout the run, rather than creating unrelated records for every screen.

1. Create: create a property asset in the Bank Portal. Save it, refresh, reopen it and verify its reference and fields.
2. Submit: attach the required documents and enforcement evidence. Submit the asset and confirm that it appears in Surge Admin's review queue.
3. Challenge the controls: attempt publication with missing documents and with a legal hold. Both attempts must fail.
4. Correct and approve: resolve the outstanding issues, complete verification, approve the listing and publish it.
5. Verify the public experience: find the asset through search, open its details and submit a buyer enquiry. Check that private information remains hidden.
6. Process the lead: assign an officer, record contact, schedule a viewing and verify that the appropriate bank and admin views reflect the changes.
7. Process an offer: submit an offer, record the authorised bank decision and test rejection, counteroffer and withdrawal paths separately.
8. Complete the transaction: generate the applicable invoice, test a failed payment, reconcile a verified payment and complete the sale.
9. Verify closure: confirm that the listing is no longer active, financial records are consistent, notifications correspond to real events and the audit trail contains the complete sequence.
10. Repeat with an attacker mindset: use the wrong account, stale browser tabs, invalid IDs and direct requests to test whether the backend enforces every restriction.

## 10. What I would require before calling the platform complete

- All three interfaces use the same authoritative records.
- Every visible button performs its stated action or is clearly disabled with a reason.
- Every form has appropriate validation and error handling.
- Every workflow has a defined set of permitted transitions.
- Legal holds and other blocking conditions are enforced server-side.
- Public pages never expose internal or confidential records.
- Financial statuses cannot be changed through unauthorised browser actions.
- All important changes are auditable.
- No fabricated notifications, KPI values or transaction history are presented as real activity.
- The end-to-end test passes, including the exception paths.
- The system recovers safely from duplicate requests, concurrent edits and service failures.

One important limitation: the HTML in your message loads `app.js`, but that JavaScript implementation and the backend were not included in the supplied code. I can define the expected workflows and test criteria from this shell, but I cannot honestly certify which existing pages already work or identify the exact broken functions without examining the implementation.

The most useful next step is to provide your current `app.js` and, if available, the backend/API code. I can then turn this specification into a concrete gap-by-gap implementation plan that identifies the actual broken pages, missing actions, disconnected records, invalid transitions and precise tests needed for each fix.
That makes sense. For Surge Solutions, I would use Cloudflare D1 as the authoritative database for all structured data, and Cloudflare R2 as object storage for files and documents. All three interfaces — Bank Portal, Surge Admin and Public Marketplace — should communicate with the same backend.
Recommended Cloudflare architecture
Three Surge interfaces
Bank Portal · Surge Admin · Public Marketplace

Cloudflare Workers API
Authentication · Permissions · Validation · Workflow rules · Audit events

Cloudflare D1
Assets, users, organisations, legal records, document metadata, offers, KYC status, invoices, payments and audit events.


Cloudflare R2
Property photos, title documents, valuations, signed agreements, KYC files and other uploaded objects.



Optional supporting services: Cloudflare Queues for reliable background work, Turnstile for abuse prevention, and email/SMS providers for notifications.

1. Where every type of data belongs
Data	Storage	Important rule
Asset details and prices	D1	One authoritative record
Legal and enforcement records	D1	Restrict by role and organisation
Document metadata and review status	D1	Track versions and decisions
Actual PDFs, images and scans	R2	Private by default
User and role records	D1	Enforce permissions in the Worker
KYC status and review history	D1	Restrict sensitive records
KYC identity documents	R2	Never expose through public asset URLs
Offers and counteroffers	D1	Preserve decision history
Invoices and payment records	D1	Verify payments server-side
Audit history	D1	Append-only application behaviour
Notification records	D1	Track queued, sent and failed delivery
Public listing information	D1	Return only explicitly permitted fields
R2 stores the actual files; D1 stores their metadata and references. Do not put file contents or large Base64-encoded images into D1.
2. How the three interfaces must stay synchronised
For example, when a bank updates a property's price:
1. The Bank Portal sends the update to the Worker API.
2. The Worker authenticates the user and checks that they can edit that asset.
3. D1 saves the new price and records the change.
4. Surge Admin reads the updated price from D1.
5. The Marketplace reads the updated public price from D1, subject to publication rules.
No interface should have its own separate asset database, and browser-local storage must not be treated as the source of truth.
3. Cloudflare-specific issues to account for
- D1 transactions: related changes, such as an approval and its audit event, should be committed atomically where possible.
- Concurrency: use conditional updates or version numbers to prevent simultaneous reviewers from overwriting each other's decisions.
- R2 access: serve private files through authenticated Worker endpoints or short-lived signed URLs. Never expose unrestricted private-bucket access.
- File uploads: enforce file size and type limits, validate uploads, and consider malware scanning before documents can be approved.
- D1 limits: design pagination, indexes and queries around your expected workload. Avoid loading entire tables into the browser.
- Background work: use a queue for notifications and other retryable tasks rather than making a successful asset update depend on email delivery.
- Payments: use provider-confirmed server-side events, idempotency and reconciliation; never trust a browser's claim that payment succeeded.
4. What I would change in your implementation plan
The next implementation pass should establish the shared data layer before polishing individual pages.
1. Database migrations: create the D1 schema, indexes, foreign keys and seed only explicitly identified development fixtures.
2. Worker API: centralise authentication, organisation scoping, validation, status transitions and audit logging.
3. R2 integration: implement private uploads, file metadata, versioning, authorised downloads and deletion/retention rules.
4. Bank Portal: wire asset creation, editing, document uploads and submission to the API.
5. Surge Admin: wire review queues, legal holds, verification, approvals and publication to the same API.
6. Marketplace: query only published listings and implement enquiry, viewing and offer workflows.
7. Integration tests: verify that changes made in one interface immediately produce the correct results in the other two, including permissions and failed operations.
One distinction matters: D1 and R2 provide the storage layer, but they do not automatically make the platform secure or keep workflow rules consistent. Those guarantees must be implemented in the Worker API.
For Surge Solutions, the Worker should be the central business logic and security layer between the Bank Portal, Surge Admin, Public Marketplace, Cloudflare D1 and Cloudflare R2. You don't need to rewrite your 3,000+ lines of frontend JavaScript to plan this properly. We can define the Worker contract first, then connect your existing frontend to it progressively.

# Surge Solutions — Cloudflare Worker specification

## 1. Core architecture

Existing frontend

Bank Portal · Surge Admin · Public Marketplace

## Surge API Worker

Routing · Authentication · Authorisation · Validation · Workflow engine · Audit logging

D1

Structured data and business records

R2

Documents, images and uploaded files

## 2. Worker responsibilities

The Worker should provide the following modules. These are provisions for the backend to implement, not a claim that the existing frontend already supports them.

| Module                | Worker responsibilities                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| Authentication        | Login/session validation, logout, expiry, account status and password-reset workflow  |
| Authorisation         | Role-based permissions, organisation isolation and record-level access                |
| Asset management      | Create, read, update, archive and retrieve assets                                     |
| Legal and enforcement | Store case details, track clearance and enforce legal holds                           |
| Documents             | Issue upload authorisations, validate metadata, version files and manage access       |
| Valuation             | Record valuation amounts, dates, evidence and expiry                                  |
| Listing workflow      | Submit, review, request changes, approve, publish, suspend and withdraw               |
| Marketplace           | Return only public-safe, published asset information                                  |
| Leads and enquiries   | Create enquiries, prevent abuse, assign staff and track follow-ups                    |
| KYC                   | Manage verification cases and restrict sensitive records                              |
| Viewings              | Request, schedule, confirm, cancel and complete appointments                          |
| Offers                | Submit, negotiate, accept, reject, withdraw and expire offers                         |
| Invoicing             | Generate invoice records, apply fee rules and track outstanding balances              |
| Payments              | Verify provider callbacks, reconcile payment status and prevent duplicate processing  |
| Sale completion       | Validate prerequisites, record completion and remove sold assets from active listings |
| Notifications         | Queue messages, track delivery outcomes and retry failures                            |
| Reporting             | Return filtered, permission-checked totals and exports                                |
| Audit                 | Record sensitive actions, actor, target, timestamp and outcome                        |
| Administration        | Manage organisations, users, roles, platform settings and permitted configuration     |

## 3. Suggested API contract

Use a versioned API such as `/api/v1`. The paths below are a proposed contract; the Worker should expose the operations the frontend actually needs.

### Authentication and current user

POST

`/api/v1/auth/login`

Authenticate and establish a secure session.

GET

`/api/v1/auth/me`

Return the current user's identity, organisation and permitted capabilities.

POST

`/api/v1/auth/logout`

Invalidate the current session.

### Assets and listings

GET

`/api/v1/assets` — Search and filter assets accessible to the caller.

POST

`/api/v1/assets` — Create a draft asset.

PATCH

`/api/v1/assets/:id` — Update permitted fields with conflict detection.

POST

`/api/v1/assets/:id/submit` — Validate and submit for review.

POST

`/api/v1/assets/:id/approve` — Approve only if the reviewer has permission and requirements pass.

POST

`/api/v1/assets/:id/publish` — Revalidate all publication gates before making an asset public.

POST

`/api/v1/assets/:id/hold` and `/api/v1/assets/:id/withdraw` — Apply authorised restrictions or withdraw a listing.

### Documents and private storage

POST

`/api/v1/assets/:id/documents/upload-url` — Authorise a limited upload to R2.

GET

`/api/v1/documents/:id/download` — Authorise access before serving a file or issuing a short-lived URL.

POST

`/api/v1/documents/:id/review` — Record approval or rejection, reviewer and reason.

### Sales workflow

POST

`/api/v1/enquiries` — Submit a public enquiry.

POST

`/api/v1/viewings` — Request a viewing.

POST

`/api/v1/offers` — Submit an offer after checking eligibility.

POST

`/api/v1/offers/:id/decision` — Apply an authorised offer decision.

GET

`/api/v1/invoices/:id` — Return an invoice only to authorised users.

POST

`/api/v1/webhooks/payments/:provider` — Verify payment-provider signatures and process events idempotently.

These routes are illustrative. Before implementation, align their names and payloads with the frontend's existing calls rather than forcing unnecessary changes across the entire JavaScript file.

## 4. D1 and R2 provisions

D1 should contain:

- Organisations, users, roles and permissions.
- Assets, locations, legal records, valuations and listing states.
- Document metadata, review decisions and R2 object keys.
- Enquiries, KYC case status, viewings, offers and offer history.
- Fee rules, invoices, payment records and sale completion.
- Notifications, audit events, idempotency records and workflow history.

R2 should contain:

- Property photographs and listing media.
- Title deeds, court or enforcement documents, valuation reports and supporting evidence.
- Private KYC files and signed transaction documents.
- Generated reports or other files that do not belong in relational tables.

Use private buckets or private objects by default. Public listing images should be exposed through a deliberate, controlled public-media path; private documents must never be accessible merely because someone knows an object key.

## 5. Business rules the Worker must enforce

These are the most important backend requirements for strenuous testing.

1. No publication without approval. Check required documents, legal clearance, valuation validity, sale terms and authorised approval at publication time.
2. Legal holds override publication. A hold must block new publication and prevent further sale progression where policy requires it.
3. Organisation boundaries apply everywhere. A bank must not read or modify another bank's restricted assets by changing an ID in the request.
4. The browser is untrusted. Ignore client-supplied role, approval, payment and privileged status claims.
5. Every transition is validated. A caller cannot jump directly from draft to published or from submitted offer to accepted without satisfying the permitted workflow.
6. Concurrent decisions are safe. Two reviewers cannot both accept conflicting offers when only one may proceed.
7. Retries do not duplicate actions. Payment callbacks, repeated submissions and notification retries need idempotency where appropriate.
8. Sensitive changes are auditable. Record who acted, what changed, when it happened and whether the action succeeded.
9. Public responses are explicitly allowlisted. Never return internal notes, legal files, KYC information, bank-only fields or internal workflow details.
10. Errors do not expose secrets. Return useful validation messages while keeping stack traces, credentials and private implementation details out of responses.

## 6. Operational and security provisions

- Validate HTTP method, route parameters, request size, content type and input schema.
- Use secure session cookies or another deliberate authentication strategy, with CSRF protection when cookie-based authentication is used.
- Apply rate limits and abuse controls to login, enquiries, public search and uploads.
- Use prepared SQL statements and appropriate D1 indexes.
- Set explicit CORS rules for the real Surge domains.
- Keep secrets in Worker secrets/environment bindings, not in frontend JavaScript.
- Validate R2 upload completion, allowed file types, size and ownership before accepting a document into the workflow.
- Keep audit events and payment history protected from ordinary users and avoid exposing sensitive values in logs.
- Return consistent error responses and request IDs to make failures diagnosable.
- Add tests for D1/R2 failures, expired sessions, duplicate requests, stale edits, timeouts and retries.

## 7. Standard response format

The frontend should receive a predictable response from the Worker. For example:

```
{
  "success": true,
  "data": {
    "id": "asset_123",
    "status": "under_review"
  },
  "error": null,
  "requestId": "req_example"
}
```

For a validation failure:

```
{
  "success": false,
  "data": null,
  "error": {
    "code": "PUBLICATION_REQUIREMENTS_NOT_MET",
    "message": "The asset cannot be published yet.",
    "details": [
      {
        "field": "valuation",
        "reason": "A current approved valuation is required."
      }
    ]
  },
  "requestId": "req_example"
}
```

Use appropriate HTTP status codes as well; the JSON `success` field must not replace HTTP semantics.

## 8. Implementation acceptance criteria

### Worker readiness checklist

0 of 10

Shared data

A change made in one interface is reflected in the others through D1.

Authentication and permissions

Unauthenticated and unauthorised requests are rejected server-side.

Publication gates

Missing documents, expired valuations or active legal holds block publication.

Private storage

Unauthorised users cannot download KYC or legal documents from R2.

Offer integrity

Offer decisions and concurrent acceptance are validated consistently.

Payment integrity

Forged callbacks and duplicate payment events cannot mark an invoice paid incorrectly.

Auditability

Sensitive actions create protected, traceable audit events.

Failure handling

Network, database, storage and notification failures never produce false success.

No mock business data

Production dashboards, notifications, reports and counts are based on actual records.

Frontend integration

Every enabled action calls a real API operation or is explicitly disabled with a reason.

Reset checklist

The key implementation decision: build the Worker as a modular API, with separate handlers for each business area but shared authentication, permissions, validation, audit and database utilities. This lets you implement and test the backend incrementally without rewriting the entire frontend first.
For Surge Solutions, I would use a multi-tenant, multi-branch architecture where each bank is an organisation, each bank has its own branches, and users are assigned to the bank and branch or branches they are permitted to access.

The critical design decision is that a branch is an organisational unit, not a separate tenant. This lets a bank manage its branches centrally without exposing its assets, documents, offers or financial records to other banks.

## 1. Recommended structure

## Surge Solutions

Platform-level administration

Bank A

Tenant A

Head Office

Accra Branch

Kumasi Branch

Bank B

Tenant B

Head Office

Tema Branch

Takoradi Branch

Every bank has its own users, branches, assets and restricted records. Surge Admin can access multiple banks only according to its assigned permissions.

## 2. The four levels of access

I recommend four levels rather than assigning permissions based on job title alone.

| Level           | Example role             | Access                                         |
| --------------- | ------------------------ | ---------------------------------------------- |
| Platform        | Surge Super Admin        | All banks, branches and platform configuration |
| Bank-wide       | Bank Administrator       | All authorised branches and bank-level reports |
| Branch          | Branch Manager           | Assets and staff within assigned branches      |
| Record-specific | Asset Officer / Reviewer | Only assigned records and permitted actions    |

You should also distinguish between who can see a record and who can perform an action on it. For example, a branch manager may view all assets in their branch but only an authorised bank-wide reviewer can approve a listing.

A bank-wide user should not automatically have platform-wide access, and a branch manager should not automatically be able to create bank administrators.

## 3. How I would model this in D1

Keep one shared D1 database. Add explicit tenant and branch ownership to the relevant records.

### Core tables

`organisations`

`id`, `name`, `type`, `status`, `created_at`

One record for each bank and for Surge itself where appropriate.

`branches`

`id`, `organisation_id`, `name`, `code`, `address`, `status`

Each branch belongs to exactly one organisation.

`users`

`id`, `email`, `name`, `status`

Global identity record; do not duplicate a user merely because they access multiple branches.

`user_memberships`

`user_id`, `organisation_id`, `role_id`, `status`

Determines which organisation the user belongs to and their bank-level role.

`user_branch_assignments`

`user_id`, `organisation_id`, `branch_id`, `role_id` (optional)

Restricts branch-level access and supports staff who work across multiple branches.

`assets`

`id`, `organisation_id`, `branch_id`, `created_by`, `status`, `version`

Every bank-owned asset has a clear tenant owner and, where applicable, a responsible branch.

I would also put `organisation_id` on other bank-owned records such as legal cases, document metadata, enquiries, viewings, offers and invoices. Some records may inherit their ownership from an asset, but the Worker must verify that relationship instead of trusting a client-supplied ID.

Use foreign keys and indexes, including composite constraints where practical, to ensure that an asset cannot reference a branch belonging to a different bank.

### A useful distinction

- `organisation_id` answers: Which bank owns or controls this record?
- `branch_id` answers: Which branch is responsible for it?
- `created_by` answers: Who created it?
- `assigned_to` answers: Who is currently handling it?

These fields serve different purposes and should not be interchangeable.

## 4. How the Worker should enforce access

Never let the frontend decide which bank a user belongs to simply by sending an `organisation_id`.

When a request arrives, the Worker should:

1. Validate the user's session.
2. Load their active membership and permitted branch assignments.
3. Check the requested action against their role and permissions.
4. Apply organisation and branch restrictions directly to the D1 query.
5. Validate that referenced records belong to the same permitted organisation.
6. Record sensitive actions in the audit log.

For example, a branch-scoped asset query should follow this general pattern:

```
SELECT a.*
FROM assets AS a
JOIN user_branch_assignments AS uba
  ON uba.branch_id = a.branch_id
 AND uba.organisation_id = a.organisation_id
WHERE uba.user_id = ?
  AND uba.organisation_id = ?
  AND a.organisation_id = ?;
```

This is illustrative, not a complete authorisation implementation. The Worker must derive the user identity and permitted organisation from the authenticated session, not blindly accept those values from the browser. Bank-wide permissions need a separate, explicitly checked access path.

## 5. How the interfaces should behave

Bank Portal

- Bank-wide users can switch between authorised branches.
- Branch users see only their assigned branches.
- Asset forms select a branch from the user's permitted branches.
- Reports show branch-level and bank-wide totals according to permissions.

Surge Admin

- Search across banks and branches when authorised.
- Filter queues by bank, branch, asset status and assigned reviewer.
- Show the owning bank and responsible branch on internal asset pages.
- Support authorised reassignment without changing asset ownership accidentally.

Public Marketplace

- Visitors see approved, published public information from all participating banks.
- The bank or branch is displayed only where disclosure is intended.
- Internal branch assignments, staff details, legal notes and private documents remain hidden.

## 6. Important edge cases to design for

| Scenario                                       | Required behaviour                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A user transfers branches                      | Revoke the old assignment and grant the new one; preserve historical audit records.          |
| A branch is deactivated                        | Block new assignments and submissions there; preserve existing assets and history.           |
| An asset moves between branches                | Require authorisation, validate both branches belong to the same bank and log the transfer.  |
| A user works across three branches             | Give explicit assignments to all three; do not create duplicate user accounts.               |
| A bank administrator leaves                    | Revoke membership and sessions without deleting historical records.                          |
| A bank attempts to access another bank's asset | Deny access even if the caller knows the asset ID.                                           |
| A bank-wide report is requested                | Aggregate only records belonging to that bank unless the user has platform-level permission. |
| Surge suspends an asset                        | Apply the platform-level restriction regardless of the bank's branch permissions.            |
| A branch is renamed                            | Preserve its stable ID so existing assets and audit history remain linked correctly.         |

## 7. One additional design decision: shared or separate review authority?

I recommend that banks manage their own branches, create assets and submit listings, while Surge retains central authority over platform publication, compliance gates and legal holds. Banks may see and manage their own business records, but they cannot bypass Surge's mandatory approval rules.

The bank should also be able to decide whether a branch manager can create users, reassign assets or view bank-wide financial reports. Those permissions should be configurable, within limits imposed by Surge.

My recommendation: use one D1 database, one `organisations` table, one `branches` table, memberships plus branch assignments, and mandatory tenant scoping in every relevant Worker handler. This is simpler to operate than creating a separate database per bank and is a strong starting point for a platform serving many banks and branches.
These are the additional design decisions I'd prioritise before implementing the Worker.
1. The most important architectural recommendations

1. Build a proper workflow engine
Critical
Avoid scattered checks such as if (status === "approved") throughout different routes. Centralise permitted transitions and their prerequisites.
For example, publishing a property should invoke one publication service that checks legal holds, mandatory documents, valuation validity, approval and sale terms. Every route that can publish or republish must use that same service.




2. Separate current status from historical events
Critical
Store the current state on the relevant record, but also preserve a history of transitions. An asset should tell you its current state, who changed it, when, why and what its previous state was.
This becomes essential when a bank disputes an approval, an offer is challenged or an asset is suspended after publication.




3. Add optimistic concurrency control
Critical
Add a version integer to mutable records. An update should only succeed if the version still matches what the user loaded.
This prevents a branch manager from accidentally overwriting changes made by a bank administrator in another browser session.




4. Make tenant isolation a shared security primitive
Critical
Create common Worker helpers for authentication, permissions and organisation-scoped access. Every private query and file operation must go through the same rules.
Do not rely on hiding buttons or filtering tables in the frontend to protect one bank from another.



2. Design the asset lifecycle more carefully
A single status column will become difficult to manage as the platform grows. An asset can be approved but unpublished, published but legally held, or sold while historical documents remain accessible to authorised staff.
I would separate its state into distinct dimensions:
State dimension	Example values
Review	Draft, submitted, under review, changes required, approved, rejected
Publication	Unpublished, published, suspended, withdrawn
Legal	Pending clearance, cleared, held, disputed
Transaction	No active offer, offers received, offer accepted, completion pending, completed
Record	Active, archived
These dimensions must still be coordinated by business rules. For example, legal = held should prevent publication and block transaction steps as defined by the applicable policy.
Also: do not allow staff to change these fields arbitrarily through a generic asset-update endpoint. Use dedicated actions for approval, publication, legal holds and completion.
3. Add a reliable background job mechanism
Some actions shouldn't depend on a single HTTP request finishing successfully.
Examples include:
- Sending emails or SMS notifications.
- Processing uploaded documents for validation.
- Generating reports and exports.
- Retrying failed notifications.
- Processing payment-provider events.
- Expiring offers or overdue tasks.
For this, I would consider Cloudflare Queues. Record the underlying business change in D1, then arrange for the follow-up task to be processed and retried independently. Use idempotency keys so retries don't create duplicate invoices, notifications or payment records.
For workflows that require a business change and an event to be recorded together, use a transactional outbox pattern: commit the business change and an outbox record together, then dispatch pending events asynchronously. This is more reliable than updating D1 and hoping a separate queue publish always succeeds.
4. Treat documents as first-class records
For a bank-repossessed property, the documents can matter as much as the listing itself.
I recommend a document register with:
- Document type and owning asset.
- Version number and upload timestamp.
- Uploading user and organisation.
- Review status, reviewer and reason.
- Expiry date where relevant.
- R2 object key and integrity checksum.
- Access classification: public, bank-private or Surge-restricted.
Never overwrite an approved title document silently. Upload a new version and require the appropriate review again.
Keep R2 objects private by default. Validate file type and size, use generated object keys rather than user-provided paths, and consider malware scanning before a file can be used as verified evidence. A database row saying verified should only be set after the required checks actually pass.
5. Add a proper financial ledger
This is especially important if Surge collects deposits, charges fees, issues invoices or handles proceeds.
Do not treat a field such as payment_status = "paid" as the entire financial record. Keep separate records for invoices, payment attempts, provider transactions, refunds, fees and reconciliation.
I would ensure that:
- Amounts use integer minor units or carefully validated decimal handling, with explicit currency.
- Every payment has a unique provider reference.
- Webhook signatures are verified.
- Duplicate callbacks cannot process the same payment twice.
- Failed and reversed payments are represented explicitly.
- Invoice totals and fee rules are snapshotted at issuance.
- Financial adjustments are recorded as new events rather than silently rewriting history.
For transactions involving significant sums, define the reconciliation and dispute process before going live. A payment-provider success response alone does not necessarily prove that the entire sale has completed.
6. Improve the multi-bank model further
Beyond organisations and branches, I would add a few explicit concepts.
Memberships and invitations
Users should be invited to a bank or branch, accept the invitation, and have their access revoked without deleting historical records. Support users who are authorised across several branches without duplicate accounts.



Approval separation
Consider a maker-checker policy: the person who submits a high-risk listing or changes critical financial details should not be the sole person who approves that same action.



Explicit asset transfers
If an asset moves between branches, record the old branch, new branch, authorising user, reason and time. Never change ownership implicitly just because someone edits a branch dropdown.



Versioned bank configuration
Store bank-specific preferences such as approval thresholds, permitted roles, notification recipients and operational settings. Critical platform security rules must remain non-overridable by bank configuration.



7. Make the public marketplace deliberately separate
The public marketplace should not receive the same asset objects that the bank portal receives and then hide sensitive fields with JavaScript.
Instead, create a dedicated public response model that only returns approved, published information:
- Public asset reference.
- Approved description, photographs and location details.
- Public asking price and sale conditions.
- Permitted viewing information.
- Public contact or enquiry mechanism.
Never include internal legal notes, KYC details, bank-only comments, document object keys or internal review history.
I would also use stable public references that are distinct from internal database IDs. This reduces accidental information leakage and makes public URLs easier to maintain.
8. Use D1 and R2 with operational discipline
A few Cloudflare-specific choices will save you pain later.
Area	Recommendation
D1 migrations	Version every schema change and apply migrations through a controlled deployment process.
Indexes	Index common filters such as organisation, branch, status, creation date and public listing state.
Pagination	Use bounded pagination; consider cursor-based pagination for large result sets.
Search	Start with D1 indexes and SQLite full-text search where appropriate. Add a dedicated search service only if measured needs justify it.
R2	Separate public media from private documents, or enforce equally strong separation through access controls.
Caching	Cache only deliberately public data. Avoid caching authenticated bank responses or sensitive files in shared caches.
Backups	Define backup, restore and recovery-point requirements and test restoration.
Environments	Keep development, staging and production databases, buckets and secrets separate.
Monitoring	Track error rates, latency, failed jobs, failed uploads and payment reconciliation discrepancies.
D1 is a good starting point for this platform, but load-test the actual queries and workflows before making assumptions about scale.
9. Build a serious audit and security model
For a platform handling repossessed assets, I'd want to answer questions such as:
- Who changed the asking price, and what was it before?
- Who approved publication?
- Was a required document verified at the time of approval?
- Who placed or removed a legal hold?
- Who viewed or downloaded a sensitive document?
- Who accepted an offer, and what competing offers existed at the time?
- Was an invoice marked paid through a verified provider event or an internal adjustment?
The audit log should be protected from ordinary modification, access-controlled, and designed to avoid storing unnecessary sensitive data. For stronger tamper evidence, consider periodically exporting or anchoring audit digests outside the primary application database.
Also plan for account recovery, staff departures, compromised credentials, session revocation, rate limiting and incident response.
10. Test workflows, not just pages
I would make the following end-to-end scenarios release blockers.
Release-blocking tests
0/10 checked

[ ] Tenant isolation
Bank A cannot read or modify Bank B assets, offers, documents or invoices by changing request IDs.


[ ] Legal hold
A legal hold added after approval blocks publication or further transaction steps as policy requires.


[ ] Concurrent approvals
Two reviewers cannot accept conflicting offers when only one is permitted to proceed.


[ ] Document replacement
Replacing a verified document invalidates the old verification when required and records the new version.


[ ] Payment retries
Repeated provider callbacks produce one effective payment and consistent invoice totals.


[ ] Branch transfer
A transfer preserves ownership, history and permissions and rejects branches belonging to another bank.


[ ] Session revocation
A terminated staff member cannot continue using an old session.


[ ] Recovery
A staging restore from backup recovers linked records and file references correctly.


[ ] Public privacy
Public API responses and direct file URLs expose no internal or confidential records.


[ ] Failure resilience
A failed notification or queue consumer does not silently lose a committed business action.



My suggested implementation order
1. Foundation: tenant model, branches, memberships, authentication, permissions and D1 migrations.
2. Asset lifecycle: asset CRUD, document register, legal checks, approvals, publication and audit history.
3. Cross-interface integration: connect the existing frontend to shared Worker endpoints and eliminate mock data.
4. Sales workflow: enquiries, viewings, offers, invoicing, payment verification and sale completion.
5. Reliability: queues, retries, concurrency handling, monitoring, backups and recovery.
6. Release hardening: tenant-isolation tests, security testing, performance testing and operational procedures.
One final recommendation: do not build every module at once. Complete the asset lifecycle across all three interfaces first, test it thoroughly with two simulated banks and several branches, then extend the same architecture to offers and financial workflows. That will reveal structural problems before they become expensive to fix.
Surge Solutions, I would now look beyond the database, Worker and branch permissions. The biggest opportunities are in how the platform manages risk, proves that decisions were legitimate, prevents operational mistakes, and handles the entire asset-disposition process from intake to final transfer.
Here are additional recommendations that build on the architecture we've already discussed, without requiring you to rewrite your 3,000+ lines of frontend JavaScript.
1. Introduce an asset case-management system
Treat every repossessed or distressed asset as a managed case, not merely a listing.
Each asset should have a unified case workspace containing:
- Asset overview and ownership records.
- Bank and branch responsible for the case.
- Legal enforcement and clearance information.
- Required documents and outstanding evidence.
- Valuation and pricing history.
- Assigned staff and approval responsibilities.
- Enquiries, viewings, offers and negotiations.
- Tasks, deadlines, decisions and audit history.
- Final sale or withdrawal outcome.
This gives bank officers and Surge administrators one place to understand an asset's entire history.
Worker provision: create a case-service module that assembles the authorised parts of the case from D1. Do not create a separate copy of every underlying record just to display a unified workspace.
2. Build a configurable document and compliance checklist
Example: asset readiness
Illustrative

Ownership / title evidence

Verified

Enforcement authority

Pending review

Current valuation

Verified

Required sale approvals

Missing

Public listing description

Complete


Publication must be blocked until every mandatory requirement for that asset type and applicable process has passed.

Different assets may require different evidence. A repossessed vehicle, residential property and commercial building should not necessarily share an identical checklist.
I would therefore store versioned checklist templates by asset type, bank policy and applicable workflow. Each case should preserve the specific requirements that applied to it, including any authorised exceptions.
Important: a document being uploaded is not the same as being verified. A checklist item should record who reviewed it, the outcome, the date and the evidence used.
3. Add a task engine with deadlines and escalation
Do not rely on staff remembering to check dashboards.
The Worker should support tasks such as:
- Review a newly submitted listing.
- Request missing documents from a bank.
- Complete a legal review.
- Arrange a valuation.
- Respond to an enquiry.
- Confirm a viewing.
- Review an offer before its expiry.
- Reconcile a payment.
- Complete the sale and archive the case.
Each task can have an owner, due date, priority, status and escalation rule. Cloudflare Queues and scheduled Workers can support reminders and overdue checks.
For example, if a valuation is nearing expiry, the system can notify the responsible branch and flag the asset for review. It should not silently renew the valuation or mark it valid.
4. Give every asset a complete evidence trail
A particularly valuable feature would be an Asset Evidence Pack that can be generated whenever a bank, auditor or authorised reviewer needs to examine a case.
It could contain:
- Asset details and ownership references.
- Document inventory and version history.
- Valuation records and price changes.
- Legal clearance and hold history.
- Submission and approval decisions.
- Enquiries, viewings and offer decisions.
- Invoices, verified payment references and reconciliation.
- Final completion records and outstanding exceptions.
Each pack should show the period covered, generation timestamp and any missing evidence. Keep a record of which files and versions were included so the same historical case can be reconstructed later. Document versioning and auditable disposition workflows are established records-management practices. 

Microsoft Learn
+1



Worker provision: add an evidence-export service that reads authorised records from D1, retrieves permitted files from R2, and generates a downloadable package. Large exports should run as background jobs.
5. Add a formal dispute and exception-management module
Not every case will follow the happy path. A document may be challenged, a buyer may dispute a deposit, two parties may claim authority to sell an asset, or a bank may contest a valuation.
Instead of burying these issues in internal notes, create a proper exception workflow.
Exception record
Exception reference

Unique ID


Category

Legal · Valuation · Document · Payment · Buyer


Severity

Low · Medium · High · Critical


Responsible party

Assigned team or user


Evidence

Linked documents and relevant events


Resolution

Decision, rationale and supporting evidence



Critical exceptions should automatically trigger the appropriate restrictions. A disputed title, for example, could block publication or progression to sale pending authorised review.
Do not let a user resolve an exception simply by changing its status to “Closed.” Require a documented resolution and any required independent approval.
6. Introduce a pricing and fee rules engine
Banks may have different commission agreements, reserve prices, buyer fees or approval thresholds. These rules should be configurable without changing Worker source code every time a commercial arrangement changes.
The rules engine should support:
- Bank-specific and asset-type-specific fee schedules.
- Minimum acceptable prices and authorised discount thresholds.
- Effective dates and version history.
- Approval requirements for price reductions.
- Buyer-facing fees and clear fee disclosures.
- Invoice calculation with a snapshot of the rules used.
For example, when an invoice is issued, save the applicable fee-rule version and calculated amounts. If the bank changes its commission agreement the next day, an existing invoice should not silently change.
For price reductions beyond a configured threshold, require a second approval and record the original price, new price, reason and authoriser.
7. Create an internal risk and anomaly dashboard
Surge Admin should highlight unusual activity rather than simply displaying counts of assets and offers.
Examples worth flagging:
- Repeated failed login attempts against a bank account.
- Sudden changes to many asset prices.
- A user downloading an unusually large number of private documents.
- Multiple accounts submitting suspiciously similar enquiries.
- Repeated attempts to access another organisation's records.
- Offers submitted and accepted unusually quickly.
- Payments that remain unreconciled beyond the expected period.
- Assets approaching valuation expiry or missing mandatory evidence.
These should be risk indicators, not automatic accusations. Let authorised staff investigate and record the outcome. Avoid storing unnecessary personal information or using opaque risk scores as the sole basis for rejecting a buyer.
8. Make search and filtering a first-class feature
Once several banks have hundreds or thousands of assets, ordinary dropdowns will not be sufficient.
I would provide a universal internal search covering authorised asset references, bank, branch, location, asset type, status, responsible staff and transaction reference.
Useful filters include:
- Submitted but not reviewed.
- Missing or expired documents.
- Legal hold or unresolved dispute.
- Published but without recent enquiries.
- Offers awaiting decisions.
- Viewings awaiting confirmation.
- Unpaid or unreconciled invoices.
- Completed sales awaiting final documentation.
Use D1 indexes for common filters and bounded pagination. If full-text search becomes important, evaluate SQLite FTS support before adding a separate search platform.
9. Add an import centre for banks
Banks may already have spreadsheets containing hundreds of repossessed properties or vehicles. Requiring staff to create every asset manually could slow adoption considerably.
Build a controlled CSV import workflow:
1. Download a versioned template.
2. Upload the completed file.
3. Validate each row and identify missing fields, invalid branches and duplicate references.
4. Show a preview with valid, invalid and potentially duplicate records.
5. Allow corrections before committing.
6. Import valid records using an idempotent job, with an import report and audit history.
I would not automatically publish imported assets. They should enter draft or an appropriate review state and pass the normal workflow.
Also support a dry run, rollback strategy where practical, and duplicate detection based on bank reference numbers and other carefully selected identifiers.
10. Make APIs and integrations predictable
Treat the Worker API as a product, even if the only current clients are your own three interfaces.
I recommend:
- A documented API contract, preferably OpenAPI.
- Consistent error codes and validation responses.
- Versioned routes and explicit deprecation rules.
- Idempotency keys for sensitive retryable operations.
- Request IDs for tracing failures across logs.
- Pagination and documented filtering.
- Rate limits for public endpoints.
- Separate webhook authentication and verification.
- Integration tests that run against a staging environment.
If you later integrate valuation providers, payment gateways, email services or identity verification providers, each integration should have its own adapter module rather than placing provider-specific logic inside asset handlers.
11. Plan retention, legal holds and secure deletion
Do not automatically delete records simply because an asset has been sold, withdrawn or archived.
Different data categories may have different retention requirements. A legal hold may require certain documents and events to be preserved even when normal retention would otherwise allow deletion.
Define a retention policy for:
- KYC documents.
- Legal and title documents.
- Financial records.
- Offer and viewing history.
- Audit events.
- Uploaded temporary files.
- User accounts and session records.
Deletion should be an authorised, traceable process that checks retention rules and legal holds. Where deletion is permitted, account for both D1 records and the corresponding R2 objects, including orphaned files and retention requirements.
The appropriate periods and obligations should be confirmed against the legal and regulatory requirements applicable to Surge's operations in Ghana, rather than hardcoded from a generic template.
12. Make operational health visible
Add a technical health page for authorised Surge administrators. It should not expose secrets or raw sensitive data.
Track:
- Worker request failures and latency.
- D1 query failures and slow operations.
- R2 upload and download errors.
- Queue backlog and repeated job failures.
- Notification delivery failures.
- Payment events awaiting reconciliation.
- Failed imports and exports.
- Scheduled jobs that have not run successfully.
A system can appear functional while notifications are silently failing or payments remain unreconciled. Operational monitoring helps detect these problems before users report them.

13. Additional features worth considering later









Portfolio analytics
Compare time to sale, enquiry-to-viewing conversion, offer acceptance, price reductions and realised versus asking prices by bank, branch and asset category.












Field inspection support
Let authorised staff record inspection findings, condition reports, photographs and follow-up tasks. Keep evidence linked to the asset and preserve prior inspection versions.












Auction or structured bidding support
If your business model permits competitive bidding, define opening and closing times, reserve prices, bid rules, extensions, withdrawal policies and immutable bid history before building the interface.












Personal work queues
Give each employee a focused inbox of assigned tasks, overdue actions, approvals and unresolved exceptions instead of requiring everyone to navigate the same global dashboard.



These are optional enhancements, not prerequisites for launching the core platform.
14. My priority order for Surge Solutions
Here is how I would rank the next improvements.
Priority	Build
P0 — Before launch	Tenant isolation, workflow enforcement, document verification, legal holds, audit history, secure R2 access and payment integrity
P1 — Operational readiness	Task queues, escalation, exception management, evidence exports, monitoring, backups and recovery tests
P2 — Bank adoption	Bulk imports, configurable approval policies, branch analytics, saved filters and bank-specific fee schedules
P3 — Advanced capabilities	Auction support, external valuation integrations, risk analytics and assisted document extraction
My strongest recommendation is to build a case-management and evidence layer around the existing asset lifecycle. That is what can distinguish Surge from a generic property listing website: every important decision is traceable, every asset has a clear owner and responsible team, and the platform can demonstrate why a listing was allowed to progress or why it was blocked.
One final safeguard: do not let new features bypass the same central Worker rules. Whether an action comes from the Bank Portal, Surge Admin, a scheduled job or an external integration, it must pass the appropriate authorisation and workflow checks.

29. Glossary
Tenant: a bank (or Surge) as an isolated data owner. Listing: the public publication state of an asset. Grant: a buyer's authorization to see an asset's restricted data. Injunction block: hard rule preventing publication while an injunction is active. Reserve: minimum price the bank wants; restricted. Signed URL: short-lived, single-purpose link to a private file.