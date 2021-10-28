#!/bin/bash
set -euo pipefail

PRECONDITIONS=true
POSTCONDITIONS=true
DEBUG=true

cd fuzion-lsp-server
make -s debug
