#!/usr/bin/env bash
# Find keys present in messages.json but missing in a translation file.

set -euo pipefail

SOURCE_DEFAULT="src/lib/i18n/messages.json"

usage() {
  echo "Usage: $0 [--missing-only] <translation.json> [source_messages.json]"
  echo "Compares <translation.json> against messages.json and prints missing keys."
  exit 1
}

# Check if jq is installed
command -v jq >/dev/null 2>&1 || {
  echo "Error: jq is required but not installed." >&2
  echo "Please install jq:" >&2
  echo "  macOS: brew install jq" >&2
  echo "  Ubuntu/Debian: sudo apt-get install jq" >&2
  echo "  CentOS/RHEL: sudo yum install jq" >&2
  exit 127
}

# Parse arguments (handle --missing-only flag for Makefile compatibility)
TRANSLATION=""
SOURCE="$SOURCE_DEFAULT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --missing-only|-m)
      # Flag is accepted but ignored (this script only does missing keys)
      shift
      ;;
    --help|-h)
      usage
      ;;
    -*)
      echo "Error: Unknown option: $1" >&2
      usage
      ;;
    *)
      if [[ -z "$TRANSLATION" ]]; then
        TRANSLATION="$1"
      elif [[ "$SOURCE" == "$SOURCE_DEFAULT" ]]; then
        SOURCE="$1"
      else
        echo "Error: Too many arguments" >&2
        usage
      fi
      shift
      ;;
  esac
done

# Validate arguments
[[ -z "$TRANSLATION" ]] && {
  echo "Error: Translation file is required" >&2
  usage
}

# Validate files exist
[[ -f "$SOURCE" ]] || {
  echo "Error: Source file not found: $SOURCE" >&2
  exit 1
}

[[ -f "$TRANSLATION" ]] || {
  echo "Error: Translation file not found: $TRANSLATION" >&2
  exit 1
}

# Extract all keys from a JSON file (dot-joined paths to scalar values)
keys() {
  jq -r 'paths(scalars) | join(".")' "$1" | sort -u
}

# Find missing keys: in SOURCE but not in TRANSLATION
missing=$(comm -23 <(keys "$SOURCE") <(keys "$TRANSLATION"))

if [[ -z "$missing" ]]; then
  echo "No missing keys found."
  exit 0
fi

echo "Missing keys in $(basename "$TRANSLATION"):"
echo "$missing" | sed 's/^/  - /'
echo
echo "Total missing keys: $(echo "$missing" | wc -l | tr -d ' ')"
exit 1
