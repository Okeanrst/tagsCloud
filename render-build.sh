#!/usr/bin/env bash
# exit on error
set -o errexit

export VITE_RENDER_GIT_COMMIT=$RENDER_GIT_COMMIT

yarn build
