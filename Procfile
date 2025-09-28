web: npm start
release: bash -lc 'if [ "$RELEASE_CHECKS" = "true" ]; then npx --yes tsx scripts/production-readiness-check.ts && npx --yes tsx scripts/verify-oauth-security.ts && npx --yes tsx scripts/deployment-validation.ts; else echo "Skipping release checks (set RELEASE_CHECKS=true to enable)"; fi'
