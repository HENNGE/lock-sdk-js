# @HENNGE/lock-sdk-js

A standardized, lightweight utility to interact with HENNGE Lock.

## 🚀 Installation

Because this package is hosted on **GitHub Packages** and not the public npm registry, you need to configure your environment before installing.

1. Configure `.npmrc`

    Create a .npmrc file in the root of your project:

    ```
    @HENNGE:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
    ```

2. Authenticate

    - **Locally**: Generate a **Classic Personal Access Token (PAT)** with `read:packages` scope  or use the Github CLI (if you have it) to make it available in your shell: 

        ```
        // generated Classic PAT from Github UI
        export NODE_AUTH_TOKEN=your_token_here
        // using Github CLI
        export NODE_AUTH_TOKEN=$(gh auth token)
        // Use direnv or shell's startup/profile to make this variable available as needed without typing manually every time
        ```

    - **CI/CD**: Add `NODE_AUTH_TOKEN` to your repository secrets.

3. Install

    ```
    pnpm add @HENNGE/lock-sdk-js
    // OR
    pnpm install
    ```

## 🛠️ Usage

```ts
import { auth } from "@HENNGE/lock-sdk-js";

const [status, response] = await auth(url);
```

## 🏗️ Contributing

This repository uses **Changesets** to manage versioning and releases.

### Contribution Flow

1. Create a branch and make your changes.
2. Run the following command before committing:

    ```
    pnpm changeset
    ```

3. Follow the prompts to select the impact (patch, minor, major) and provide a description.
4. Commit the generated `.md` file in the `.changeset` folder.

### Release Process

Once your PR is merged to main, a "Version Packages" PR will be automatically opened.

Merging that PR will trigger the publication to GitHub Packages and generate a new entry in the [Releases](https://github.com/HENNGE/lock-sdk-js/releases) tab.

## 🐞 Troubleshooting Package Installation

### Error: 401 Unauthorized

Ensure your `NODE_AUTH_TOKEN` is valid and has `read:packages` permissions for the `HENNGE` organization.

### Error: 404 Not Found

Double-check that your `.npmrc` correctly maps the `@HENNGE` scope to `https://npm.pkg.github.com`.
