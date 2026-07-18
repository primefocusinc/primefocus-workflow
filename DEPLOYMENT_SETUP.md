# Google Cloud Run Deployment Setup Guide

This guide will help you set up the GitHub Actions workflow for deploying your Spring Boot + React application to Google Cloud Run.

## Prerequisites

1. Google Cloud Project with the following APIs enabled:
   - Cloud Run API
   - Artifact Registry API
   - Cloud Build API (optional, if using Cloud Build)

2. Google Cloud SDK installed locally for setup steps

## Google Cloud Setup Steps

### 1. Create Artifact Registry Repository

```bash
# Replace with your project details
gcloud artifacts repositories create YOUR_ARTIFACT_REGISTRY \
  --repository-format=docker \
  --location=YOUR_REGION \
  --description="Docker repository for Spring Boot application"
```

Example:
```bash
gcloud artifacts repositories create primefocus-workflow \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Spring Boot application"
```

### 2. Configure IAM Permissions

Grant the Cloud Run Service Account the necessary permissions:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant Cloud Run Service Account permissions to pull from Artifact Registry
gcloud artifacts repositories add-iam-policy-binding YOUR_ARTIFACT_REGISTRY \
  --location=YOUR_REGION \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

### 3. Set up Workload Identity Federation (Recommended)

This is the most secure method for GitHub Actions to authenticate with Google Cloud.

#### 3a. Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create github-pool \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --display-name="GitHub Pool"
```

#### 3b. Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create github-provider \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

#### 3c. Create Service Account for Deployments

```bash
gcloud iam service-accounts create github-deploy-sa \
  --display-name="GitHub Deployment Service Account" \
  --project=YOUR_PROJECT_ID
```

#### 3d. Grant Permissions to Service Account

```bash
# Grant permissions to deploy to Cloud Run
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.developer"

# Grant permissions to push to Artifact Registry
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

#### 3e. Configure Workload Identity Federation

```bash
# Get the pool and provider IDs
POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --format="value(name)")

PROVIDER_ID=$(gcloud iam workload-identity-pools providers describe github-provider \
  --project=YOUR_PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --format="value(name)")

# Configure the service account with the pool
gcloud iam service-accounts add-iam-policy-binding github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --project=YOUR_PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `my-project-12345` |
| `GCP_REGION` | Google Cloud region | `us-central1` |
| `GCP_SERVICE_NAME` | Cloud Run service name | `primefocus-workflow` |
| `GCP_ARTIFACT_REGISTRY` | Artifact Registry repository name | `primefocus-workflow` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full Workload Identity Provider resource name | `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Service account email | `github-deploy-sa@my-project-12345.iam.gserviceaccount.com` |

### Getting the Workload Identity Provider Name

```bash
echo "projects/$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

## Alternative: Service Account Key (Less Secure)

If you prefer not to use Workload Identity Federation, you can use a service account key:

1. Create a service account key:
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deploy-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

2. Add the key content as a GitHub secret named `GCP_SA_KEY`

3. Modify the workflow to use the key instead of Workload Identity Federation:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

## React Frontend Setup

The Dockerfile expects the React frontend to be located at:
```
Prime_Vision_Focus_GiveCamp/PVF_React_Frontend/
```

Make sure this directory structure exists before running the workflow, or modify the Dockerfile to match your actual frontend location.

## Usage

1. Go to the Actions tab in your GitHub repository
2. Select "Build and Deploy to Google Cloud Run" workflow
3. Click "Run workflow"
4. Select the environment (dev/staging/prod)
5. Optionally specify a custom image tag (defaults to git SHA)
6. Click "Run workflow"

## Troubleshooting

### Permission Denied Errors
- Verify the service account has the correct IAM roles
- Check that the Workload Identity Federation is properly configured
- Ensure the GitHub repository matches the one configured in the principalSet

### Build Failures
- Ensure the React frontend directory exists and contains package.json
- Check that all dependencies are properly defined in package.json
- Verify the Gradle build works locally: `./gradlew bootJar`

### Deployment Failures
- Verify Cloud Run API is enabled
- Check that the service name doesn't already exist (or update existing service)
- Ensure the region is correct and supported by Cloud Run
