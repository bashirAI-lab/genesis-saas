# Genesis SaaS Platform 🚀

A high-performance, aggressively modular **Multi-tenant SaaS** engine. Designed with the clean architecture principle, enabling infinitely scalable vertical domains without altering the shared core. Built for world-class developer experience, true data isolation, and modern web aesthetics.

---

## 🌟 Capabilities at a Glance

- **Multi-Tenancy Strategy**: **Database-per-tenant**. Guarantees absolute data privacy, simplified backup strategies, and eliminates noisy neighbor data risks.
- **Dynamic Plugin Architecture**: Add vertical extensions (e.g., E-commerce, Medical, Analytics) without touching the core platform engine.
- **Role-Based Access Control (RBAC)**: Aggressively cached granular permissions ensuring users only see what they are authorized for.
- **Automated Provisioning**: Asynchronously provisions dedicated PostgreSQL databases and seeds roles silently upon Tenant onboarding.
- **Observable Security**: Every mutating action is silently captured through `AuditLogs`. Rate-limited endpoints guarantee resilience against API abuse.
- **High-End Frontend Architecture**: Leveraging Next.js App Router for server-rendered RTL (Arabic) aesthetics, dark mode, and dynamic sidebar rendering from backend manifests.

---

## 🧱 Architecture Design

```mermaid
graph TD
    %% Core Infrastructure
    User([End User / Frontend Client])
    Gateway[Next.js App Shell \n (Dashboard UI)]
    API[NestJS Core Engine \n (API Gateway)]
    MainDB[(Main PostgreSQL \n SaaS Registry)]
    Redis[(Redis Cache \n Connection Pool & Auth)]
    
    %% Tenant Databases
    T1_DB[(Tenant 1 DB \n Health Clinic)]
    T2_DB[(Tenant 2 DB \n Logistics)]
    Tn_DB[(Tenant N DB \n ...)]
    
    %% Networking
    User -.->|x-tenant-id| Gateway
    Gateway -->|JWT + headers| API
    
    subgraph SaaS Platform
    API -->|Validates Plan| Redis
    API -->|Resolves Tenant| MainDB
    end
    
    subgraph Isolated Tenant Data Layer
    API ==Dynamic Runtime Connection==> T1_DB
    API ==Dynamic Runtime Connection==> T2_DB
    API ==Dynamic Runtime Connection==> Tn_DB
    end
```

### Why Database-Per-Tenant?
1. **Compliance**: Ideal for medical (HIPAA) or enterprise applications needing strict data masking.
2. **Backups**: Easily export and hand an enterprise client their isolated raw database dump if they choose to migrate.
3. **Resilience**: A rogue query or missing index in `Tenant A` cannot exhaust resources directly locking rows for `Tenant B`. 

---

## 🏁 Quick Start (Dockerized)

Ensure you have Docker and Docker Compose installed.

1. **Clone & Boot Up**
   ```bash
   git clone <repo-url>
   cd <project-folder>
   
   # Spin up the entire infrastructure detached: Postgres, Redis, NestJS, Next.js
   docker-compose up -d --build
   ```

2. **Wait for Health Checks**
   The API will wait for PostgreSQL and Redis to become healthy before executing `main.ts`.

3. **Provision the Platform Databases**
   We need to initialize the main schema and seed our demo tenants (it handles automated migrations).
   ```bash
   cd backend
   npm install
   npm run db:seed
   ```

4. **Access the Interfaces**
   * **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   * **API Swagger Docs**: [http://localhost:3001/docs](http://localhost:3001/docs)

---

## 👨‍💻 Developer Guide

### Adding a New Module

Adding features to the application limits friction due to a sophisticated plugin architecture. Let's create an `Analytics` module:

1. Create a folder `backend/src/modules/analytics`.
2. Define `analytics.manifest.ts` implementing `ModuleManifest`. Specify the endpoints, roles, and necessary subscription tier (e.g., `gold`).
3. Build your services inheriting from `BaseService`. Do not manually create static TypeORM connections; base classes resolve connection swapping via context.
4. Import your module inside `app.module.ts`. The platform automatically registers its sidebar links to the Next.js frontend!

### Billing Integration

The platform provides a mocked webhook receiver tracking Stripe events (`/api/v1/billing/webhooks/stripe`). Webhooks automatically update expiration markers, suspend connections, and alter Active Module delivery.

---

> Built with precision. Architecture governed by domain-driven design, utilizing NestJS decorators, Redis connection map eviction patterns, and robust lifecycle hooks.
