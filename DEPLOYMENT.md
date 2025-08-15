# GitHub Pages Deployment Guide

This guide explains how to deploy your Lunch with Gareth app to GitHub Pages for free hosting.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/mattcrooks/zap-receipt-split`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Push Your Changes

The deployment workflow is already configured in `.github/workflows/deploy.yml`. Simply push your changes to the main branch:

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Once successful, your app will be available at: `https://mattcrooks.github.io/zap-receipt-split/`

## Workflow Details

The GitHub Actions workflow:

- ✅ **Triggers**: Automatically on push to `main` branch or manual dispatch
- ✅ **Build Environment**: Ubuntu latest with Node.js 18
- ✅ **Dependencies**: Uses npm cache for faster builds
- ✅ **Build Process**: Runs `npm run build` with proper base path configuration
- ✅ **Deployment**: Uses official GitHub Pages actions for secure deployment

### Build Configuration

The workflow sets `VITE_BASE_PATH=/zap-receipt-split/` during build to ensure:
- ✅ All assets load correctly from the subdirectory
- ✅ Routing works properly in the GitHub Pages environment
- ✅ Service Worker registration uses correct paths

## Local Testing

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages base path
VITE_BASE_PATH=/zap-receipt-split/ npm run build

# Preview the built app
npm run preview
```

The preview server will simulate the GitHub Pages environment.

## Custom Domain (Optional)

If you have a custom domain:

1. Create a `CNAME` file in the `public/` directory with your domain name
2. Configure your domain's DNS to point to GitHub Pages
3. Update the workflow if needed to use your custom domain

## Deployment Status

Check deployment status:
- ✅ **Build Status**: Available in GitHub Actions tab
- ✅ **Live URL**: `https://mattcrooks.github.io/zap-receipt-split/`
- ✅ **Deploy Time**: Typically 2-3 minutes from push to live
- ✅ **Automatic Updates**: Every push to main triggers new deployment

## Troubleshooting

### Common Issues

**Build Fails:**
- Check the Actions tab for detailed error logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally

**App Doesn't Load:**
- Check browser console for 404 errors on assets
- Verify base path configuration in `vite.config.ts`
- Clear browser cache and try again

**Service Worker Issues:**
- PWA features may need cache clearing after updates
- Check Application tab in browser dev tools

### Support Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Configuration](https://vitejs.dev/config/build-options.html)

## Security Considerations

The deployment:
- ✅ Uses read-only repository access
- ✅ Employs official GitHub Actions
- ✅ Includes proper permissions scoping
- ✅ No secrets or sensitive data exposed
- ✅ All cryptographic operations happen client-side

Your Nostr keys and user data remain completely private and never leave the user's device.

---

**Ready to deploy!** Push to main branch and watch your app go live at GitHub Pages! 🚀
