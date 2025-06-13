# Heroku Review Apps Setup

This document explains how to set up Heroku Review Apps for the MWAP Server project.

## What are Review Apps?

Heroku Review Apps create temporary app instances for each GitHub pull request, making it easier to test changes before merging. Each review app gets its own URL and environment, isolated from staging and production.

## Setup Options

There are two ways to set up environment variables for Review Apps:

### Option 1: Using app.json (Recommended)

The `app.json` file in the root of the repository defines the configuration for Review Apps. We've updated it to include all necessary environment variables with default values where appropriate.

For sensitive values (marked as `"required": true`), you'll need to set them manually in the Heroku Dashboard or using the Heroku CLI after the Review App is created.

### Option 2: Using a Heroku Pipeline

A Heroku Pipeline allows you to automatically copy config vars from the staging app to Review Apps.

To set up a pipeline and configure Review Apps:

1. Run the provided setup script:

```bash
export HEROKU_API_KEY=your-api-key
./scripts/setup-review-apps.sh
```

This script will:
- Create a pipeline named "mwap-server-pipeline" if it doesn't exist
- Add the staging app to the pipeline
- Enable Review Apps for the pipeline
- Configure Review Apps to copy config vars from staging

## Manual Setup in Heroku Dashboard

If you prefer to set up Review Apps manually:

1. Go to the [Heroku Dashboard](https://dashboard.heroku.com/)
2. Create a new pipeline or use an existing one
3. Add your staging app to the pipeline
4. Enable Review Apps for the pipeline
5. Configure Review Apps to copy config vars from staging

## Customizing Review App Behavior

You can customize Review App behavior by modifying:

1. The `app.json` file - for app configuration, buildpacks, and default environment variables
2. The `environments.review` section in `app.json` - for Review App specific settings
3. Pipeline settings in the Heroku Dashboard - for automatic creation, PR requirements, etc.

## Troubleshooting

If your Review App fails to deploy:

1. Check the build logs in the Heroku Dashboard
2. Verify that all required environment variables are set
3. Ensure the app.json file is valid JSON
4. Check that the Heroku pipeline is correctly configured

## References

- [Heroku Review Apps Documentation](https://devcenter.heroku.com/articles/github-integration-review-apps)
- [app.json Schema](https://devcenter.heroku.com/articles/app-json-schema)