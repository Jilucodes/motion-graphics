# Upstream

This folder is an unmodified copy of the Hypit skill, vendored as a project skill so cloud sessions on
this repository can use `/hypit`.

- Source: https://github.com/hypit-ai/hypit, folder `skills/hypit/`
- Commit: `0d36de9a9d17562fca0e478969b80eb1c16a7693` (2026-10-18)
- License: `LICENSE` in this folder (Apache-2.0 with Hypit's additional conditions), copied from the upstream root

The skill is guidance only. Making videos also needs the Hypit executable (`npm install --global @hypit/hypit`,
Node 22.15+) and a generation service: HypiHub or your own API keys, billed by that service.

To update, replace this folder's contents with a newer upstream `skills/hypit/`, keep `LICENSE`, and
change the commit above.
