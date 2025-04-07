#!/bin/bash

set -eu

rm .github/dependabot.yml
rm .github/mergify.yml
rm -rf .git

pnpm install

git init
git commit -m "init"
