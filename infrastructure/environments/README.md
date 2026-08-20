# Environments

Environment-specific configuration and deployment notes. Values here should
be non-secret inputs and references to managed secret stores. Promotion should
move the same reviewed application and infrastructure versions through `local`,
`dev`, `staging`, and `production` with explicit data-access controls.
