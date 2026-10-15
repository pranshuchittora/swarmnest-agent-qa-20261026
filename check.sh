#!/bin/bash
u="$1"
c=$(curl -s -o /dev/null -L -m 20 -w '%{http_code}' -A 'Mozilla/5.0 (compatible; SwarmnestBot/1.0; +https://swarmnest.ai)' "$u")
echo "$c $u"
