# Vercel Deployment Guide

## Overview
This guide explains how to deploy the Pension Management System using Vercel for both frontend and backend services.

## Prerequisites
- Vercel account
- GitHub account (for continuous deployment)
- Node.js 16+ installed locally
- Vercel CLI (optional, for local testing)

## Frontend Deployment

1. **Prepare Your Application**
   - Ensure all frontend environment variables are set in your Vercel project settings
   - Update API endpoints to use relative paths or environment variables

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Select the repository and configure the following settings:
     - Framework Preset: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

3. **Environment Variables**
   Set the following in Vercel project settings:
   ```
   REACT_APP_API_URL=/api
   NODE_ENV=production
   ```

## Development Workflow

1. **Local Development**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Start development server
   vercel dev
   ```

2. **Preview Deployments**
   - Every push to a non-main branch creates a preview deployment
   - Access preview URLs in Vercel dashboard or GitHub PR

3. **Production Deployment**
   - Merges to main branch trigger automatic deployment
   - Manual deployment: `vercel --prod`

## Environment Configuration

1. **Development Environment**
   Create a `.env.development` file:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

2. **Production Environment**
   Configure in Vercel dashboard:
   - Environment Variables section
   - Add all necessary variables
   - They will be automatically included in the build

## Monitoring and Logs

1. **Vercel Dashboard**
   - Deployment status
   - Build logs
   - Runtime logs
   - Performance metrics

2. **Analytics**
   - Enable Vercel Analytics in project settings
   - Monitor page views, performance, and user metrics

## Troubleshooting

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify environment variables
   - Ensure all dependencies are listed in package.json

2. **Runtime Issues**
   - Check Function Logs in Vercel dashboard
   - Verify API routes are correctly configured
   - Check browser console for frontend errors

3. **Common Issues**
   - CORS errors: Update API configuration
   - 404 errors: Check vercel.json routing
   - Build failures: Verify Node.js version

## Best Practices

1. **Performance**
   - Enable automatic minification
   - Use code splitting
   - Optimize images and assets

2. **Security**
   - Use environment variables for sensitive data
   - Enable HTTPS only
   - Set up proper CORS policies

3. **Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Enable performance monitoring
   - Configure alerts for critical issues

## Rollback Process

1. **Instant Rollback**
   - Use Vercel dashboard
   - Select previous successful deployment
   - Click "Promote to Production"

2. **Manual Rollback**
   ```bash
   # List deployments
   vercel ls

   # Rollback to specific deployment
   vercel rollback [deployment-id]
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Create React App on Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)
