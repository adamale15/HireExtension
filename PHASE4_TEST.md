# Phase 4 Testing Guide - AI Job Matching

## What's Implemented

Phase 4 adds AI-powered job analysis and matching:
- ✅ Gemini AI analyzes each job against your resume(s)
- ✅ Calculates match score (0-100%)
- ✅ Automatic categorization (Safe Apply / Moderate / Don't Apply)
- ✅ Resume recommendation (if multiple resumes)
- ✅ Match insights and skill analysis
- ✅ Visual category indicators on job cards

## How to Test

### 1. Prerequisites

Make sure you have:
- ✅ At least one resume uploaded (go to Resumes tab)
- ✅ Jobs scraped from Jobright (go to Jobs tab, wait for scraping)
- ✅ Gemini API key configured in `.env.local`

### 2. Analyze Jobs

1. Open the extension side panel
2. Go to the **Jobs** tab
3. You should see your scraped jobs
4. Click the **"Analyze with AI"** button
5. Wait while AI analyzes each job (progress bar will show)
   - This takes ~2-3 seconds per job
   - For 10 jobs, expect ~20-30 seconds total

### 3. View Results

After analysis completes, you'll see:

**Category Stats (top of page):**
- 🟢 Safe Apply count
- 🟡 Moderate count
- 🔴 Don't Apply count
- ⚪ Unanalyzed count

**Job Cards with AI Insights:**
- Color-coded borders (green/yellow/red)
- Match percentage badge
- Category label (SAFE APPLY / MODERATE / DON'T APPLY)
- Top matching skills shown
- AI insight preview
- "Resume recommended" tag

### 4. Test Features

**Click on a job card:**
- Opens the direct company application link (not Jobright)
- "Apply Now" button if direct link available

**View match details:**
- Match score (e.g., "85% Match")
- Category badge with color
- Matching skills list
- AI-generated insight
- Experience level match

**Filter by work model:**
- All / Remote / Onsite / Hybrid filters still work

**Search:**
- Search by title, company, or location

## Expected Results

### Safe Apply (80-100%)
- Green border and badge
- Strong skill overlap
- Experience level matches
- Location/work model preferences met
- Positive AI insights

### Moderate Apply (60-79%)
- Yellow border and badge
- Good skill match with some gaps
- Close experience level
- Some concerns but worth applying
- Mixed AI insights

### Don't Apply (<60%)
- Red border and badge
- Poor skill match
- Experience mismatch
- Significant gaps
- Negative AI insights (not qualified, too junior/senior, etc.)

## Console Output

Look for these logs in the extension console:

```
🤖 Analyzing match for "Software Engineer" with resume "My Resume"
  ✓ Match score: 85% (safe)
🤖 Analyzing match for "Senior Developer" with resume "My Resume"
  ✓ Match score: 45% (dont-apply)
...
✅ Finished analyzing 10 jobs
```

## Troubleshooting

### "Gemini API not initialized"
- Check that `VITE_GEMINI_API_KEY` is in `.env.local`
- Restart the WXT dev server

### "Please upload at least one resume first"
- Go to Resumes tab
- Upload a PDF resume
- Return to Jobs tab and click "Analyze with AI"

### Analysis takes too long
- Expected: ~2-3 seconds per job
- For 50 jobs, could take 2-3 minutes
- Progress bar shows current progress
- Be patient, AI is doing deep analysis!

### Analysis fails halfway
- Check Gemini API quota/rate limits
- Check browser console for specific errors
- Try analyzing fewer jobs at a time

## What's Next

Phase 5 will add:
- Category filter tabs (show only Safe/Moderate/Don't Apply jobs)
- Detailed match modal with full insights
- Resume selector per job
- Sorting by match score

Phase 6 will add:
- Resume tailoring with AI
- Side-by-side comparison
- Downloadable tailored resume
