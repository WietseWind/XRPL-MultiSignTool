# XRPL MultiSignTool

A vue-webpack project to:

1. Compose a XRPL transaction (JSON)
2. Distribute the raw (dummy) signed transaction for Multi Signing
3. MultiSign (OFFLINE), until the quorum is met
4. Combine the signatures and submit the transaction

There's also a helper tool to setup Multi Signing.


## Project setup
Start by installing the dependencies:


```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and zips for distribution / local use

```
./build.sh
```

The built output will live in `/dist` and a distribution zip will be stored in `/dist.zip`.
