# ActionPlanner v0.1.0 — Deployment Checklist

**Before deploying to production, verify all items:**

## Code Quality
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run test` passes (all tests green)
- [ ] TypeScript: `npx tsc --noEmit` (zero errors)

## Build
- [ ] `npm run build` succeeds without warnings
- [ ] Bundle size reasonable (check `.next/static`)
- [ ] No unused dependencies (audit with `npm audit`)

## Functionality
- [ ] Dashboard loads correctly
- [ ] Student selection dropdown works
- [ ] Goal wizards display all 3 goals (enrollment, personal, professional)
- [ ] PEAR framework form fields work
- [ ] Save/reset functionality works
- [ ] Final review page displays correctly
- [ ] Download PDF export works

## Version & Documentation
- [ ] Version bumped in `package.json`
- [ ] Version tagged in git: `git tag -a v0.1.X-stable`
- [ ] CHANGELOG.md updated with changes
- [ ] README.md reflects current state

## Deployment
- [ ] Backup current production
- [ ] Deploy to staging first
- [ ] Verify staging works (re-run functionality checks)
- [ ] Deploy to production
- [ ] Monitor error logs for 10 minutes
- [ ] Notify team of deployment

---
**Deployed by:** [Name]  
**Date:** [YYYY-MM-DD]  
**Commit SHA:** [hash]  
