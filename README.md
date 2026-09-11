# @HENNGE/lock-sdk-js

A standardized, lightweight utility to interact with HENNGE Lock.

## 🚀 Usage

1. Install

    ```
    pnpm add @hennge/lock-sdk-js
    // OR
    pnpm install
    ```

2. Use in your JS application

```ts
import { auth } from "@hennge/lock-sdk-js";

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
