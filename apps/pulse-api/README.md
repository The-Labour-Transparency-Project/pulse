# Pulse API

The ASP.NET Core backend for survey delivery, response capture, research
workflows, data access, benchmark products, and publishing APIs.

Domain logic belongs here when it protects research quality or data ownership:
instrument versions, eligibility, response lifecycle, consent, provenance,
aggregation rules, and publication status. Keep transport concerns separate
from those domain rules as the service grows.
