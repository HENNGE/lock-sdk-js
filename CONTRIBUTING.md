# Contributing

This repository uses **Changesets** to manage versioning and releases.

## Contribution Flow

1. Create a branch and make your changes.
2. Run the following command before committing:

	```sh
	pnpm changeset
	```

3. Follow the prompts to select the impact (patch, minor, major) and provide a description.
4. Commit the generated `.md` file in the `.changeset` folder.

## Release Process

Once your PR is merged to main, a `Version Packages` PR will be automatically opened.

Merging that PR will trigger publication and generate a new entry in the
[Releases](https://github.com/HENNGE/lock-sdk-js/releases) tab.
