# Repository contribution workflow

- Make repository changes on a feature branch; do not commit directly to `main`.
- Add or update regression tests when behavior changes, and run the relevant tests and repository checks before opening a pull request.
- Keep user and developer documentation current when behavior, setup, or workflows change.
- Push a reviewable branch and open a pull request for the user to approve and merge. Do not merge pull requests unless the user explicitly asks.
- For releases, use Semantic Versioning and synchronize the version in `package.json`, `package-lock.json`, `src/version.js`, `src/constants.js`, and the README release heading/status.
- Create an annotated Git tag named `vMAJOR.MINOR.PATCH` only for a release commit after its pull request is merged and required CI checks pass. Do not tag ordinary feature merges or move an existing release tag.
