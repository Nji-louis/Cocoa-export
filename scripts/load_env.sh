#!/usr/bin/env bash

load_env_file() {
  local env_file="${1:-.env}"
  local env_path
  env_path=$(cd "$(dirname "$env_file")" 2>/dev/null && pwd)/"$(basename "$env_file")"

  if [ ! -f "$env_path" ]; then
    return 1
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac

    if [[ "$line" =~ ^[[:space:]]*([^#=]+?)[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"
      key="${key#"${key%%[![:space:]]*}"}"
      key="${key%"${key##*[![:space:]]}"}"
      val="${val%';'}"
      val="${val#"${val%%[![:space:]]*}"}"
      val="${val%"${val##*[![:space:]]}"}"
      if [[ "$val" == \"*\" && "$val" == *\" ]]; then
        val="${val:1:${#val}-2}"
      elif [[ "$val" == \'*\' && "$val" == *\' ]]; then
        val="${val:1:${#val}-2}"
      fi
      if [ -z "${!key:-}" ]; then
        export "$key=$val"
      fi
    fi
  done < "$env_path"
}
