# Pulse

Pulse is a strategic labour intelligence initiative. Surveys are the primary
data collection mechanism, but the durable value is the research data,
insights, benchmarks, and published intelligence produced from it.

This repository is a multi-project monorepo. Product applications, the API,
research tooling, analytics, publishing, documentation, and deployment code
are kept together so that survey instruments and their interpretation remain
traceable over time.

## Repository map

- `apps/pulse-respondent` — respondent-facing survey experience (Vue 3 + Vuetify)
- `apps/pulse-console` — internal research and administration application
- `apps/pulse-insights` — public dashboards, reports, and insights
- `apps/pulse-docs` — future documentation/help application
- `apps/pulse-api` — ASP.NET Core API and domain services
- `infrastructure` — Terraform, Docker, and environment configuration
- `docs` — the current VitePress documentation site for the initiative

The first implementation should favour explicit research workflows, versioned
instruments, data stewardship, reproducible analysis, and publishable outputs.
It should not introduce a generic survey-builder abstraction without a concrete
research need.

## Local development

The current documentation site can be checked with:

```sh
pnpm install
pnpm dev
pnpm build
```

Each application and package will document its own development commands as it
becomes executable.

## Licence

Unless otherwise stated, the written material and original infographics are
licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
See [LICENSE.md](../LICENSE.md) for the attribution requirements and exclusions.
