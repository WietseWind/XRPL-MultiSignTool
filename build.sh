#!/usr/bin/env bash

npm run build
zip -r -X dist.zip dist/
open dist/index.html
