# @HENNGE/lock-sdk-js

A standardized, lightweight utility to interact with HENNGE Lock.

## 🚀 Usage

### Package Manager

Install the package using your package manager of choice:

```sh
pnpm add @hennge/lock-sdk-js
```

Import it in your JavaScript or TypeScript application:

```ts
import { auth } from "@hennge/lock-sdk-js";

const [ok, response] = await auth(url);
```

### Script Tag

Load the browser bundle from a CDN. The package API is available under
`HENNGE.Lock`:

```html
<script src="https://cdn.jsdelivr.net/npm/@hennge/lock-sdk-js@1/dist/index.global.js"></script>
<script>
    async function authenticate(url) {
        const [ok, response] = await HENNGE.Lock.auth(url);
        return { ok, response };
    }
</script>
```

Pin the URL to an exact package version when reproducible builds are required.

## 🏗️ Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and release guidelines.
