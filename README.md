# formatter

```sh
npm i -D @orlv/formatter
```

1. Copy `.prettierrc`
2. Add file `.eslintrc`:

TS project with Vue:

```javascript
import { typescript } from '@orlv/formatter/vue'
export default typescript
```

JS project with Vue:

```javascript
import config from '@orlv/formatter/vue'
export default config
```

JS / TS project without Vue:

```javascript
import config from '@orlv/formatter/base'
export default config
```

The root import `@orlv/formatter` keeps the existing Vue configuration.
