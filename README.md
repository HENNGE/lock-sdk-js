# @HENNGE/lock-sdk-js

A standardized, lightweight utility to interact with HENNGE Lock.

## 🚀 Usage

Neither build provides polyfills for platform APIs such as `fetch`, `Promise`, or `AbortController`. Consumers must provide them when targeting environments where those APIs are unavailable.

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

> The package-manager build is ESM-only and targets modern JavaScript. Consumers
> that support older environments must configure their bundler or transpiler to
> downlevel this package to the required ECMAScript target, such as ES5.

### Script Tag

Load the browser bundle from a CDN. The package API is available under
`HENNGE.Lock`. This bundle is transpiled to ES5:

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@hennge/lock-sdk-js@1/dist/index.global.js"></script>

<!-- Or unpkg -->
<!-- <script src="https://unpkg.com/@hennge/lock-sdk-js@1/dist/index.global.js"></script> -->

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
