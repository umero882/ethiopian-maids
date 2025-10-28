# Agency Jobs Feature - Business Logic Clarification

## Current Confusion

There's ambiguity about what "Agency Jobs" means:

### Option A: Agency Posts Job Openings (Current Implementation)
- Agencies post job requirements (similar to sponsors)
- These are job openings that agencies want to fill
- Maids can apply to these jobs
- **Problem**: This duplicates sponsor functionality

### Option B: Agency Showcases Available Maids (Recommended)
- Agencies feature their available maids
- Sponsors can browse agency's available maids
- Focus is on maid availability, not job openings
- **Benefit**: Makes agencies a maid management platform

## Recommended Business Model

### Clear User Role Separation:

#### **Sponsors (Employers)**
- Post job openings with requirements
- Browse available maids
- Send booking requests to maids/agencies
- Manage their job postings in `/dashboard/sponsor/jobs`

#### **Agencies (Intermediaries)**
- Manage maid profiles
- Showcase available maids
- Match maids to sponsor job postings
- Handle placement and documentation
- Dashboard sections:
  - `/dashboard/agency/maids` - Manage all maids
  - `/dashboard/agency/available` - Showcase available maids (NEW)
  - `/dashboard/agency/placements` - Track maid placements

#### **Maids (Workers)**
- Create their own profiles
- Can work directly OR through agencies
- Apply to sponsor job postings
- Manage availability status

## Proposed Solution

### Rename "Agency Jobs" Feature

**FROM**: "Agency Jobs" (confusing - sounds like agencies post jobs)
**TO**: "Available Maids Showcase" or "Featured Maids"

### New Feature Structure:

```
/dashboard/agency/available
```

This page allows agencies to:
1. **Feature Available Maids**: Highlight maids who are ready for immediate placement
2. **Update Availability Status**: Mark maids as available/busy/placed
3. **Set Featured Status**: Boost certain maid profiles
4. **Add Promotional Tags**: "Newly arrived", "Experienced", "Urgent placement"
5. **Track Views**: See how many sponsors viewed each maid

### Existing Features Keep Their Purpose:

#### `/dashboard/agency/maids`
- Full list of all maids managed by agency
- Add/edit/manage maid profiles
- Bulk upload functionality
- Document management

#### `/dashboard/sponsor/jobs`
- Sponsors post their job requirements
- Agencies can view these and recommend maids
- Maids can apply directly

## Database Schema Recommendation

### Current: `agency_jobs` table
**Problem**: Name suggests agencies post jobs (confusing)

### Recommended Approach #1: Repurpose `agency_jobs`
Rename conceptually to **"Featured Maid Promotions"**:
- Keep table structure but change UI/UX
- Focus on promoting specific maids
- Treat each "job" as a "maid availability announcement"

### Recommended Approach #2: New Table `agency_featured_maids`
```sql
CREATE TABLE agency_featured_maids (
    id UUID PRIMARY KEY,
    agency_id UUID REFERENCES profiles(id),
    maid_id UUID REFERENCES maid_profiles(id),

    -- Promotion Details
    title VARCHAR(255), -- e.g., "Experienced Childcare Specialist"
    description TEXT,
    highlights TEXT[], -- e.g., ["5+ years exp", "English speaking"]

    -- Availability
    available_from DATE,
    placement_type VARCHAR(50), -- live-in, live-out, both
    preferred_location VARCHAR(255),

    -- Pricing
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    currency VARCHAR(3),

    -- Promotion
    is_featured BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    priority VARCHAR(20),

    -- Tracking
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) -- active, placed, expired
);
```

## Implementation Plan

### Phase 1: Clarify Current "Jobs" Feature (Quick Fix)
1. Rename UI labels from "Jobs" to "Maid Showcase" or "Available Maids"
2. Update form to focus on maid attributes rather than job requirements
3. Change "Post New Job" to "Add Available Maid"
4. Update job list to show maid-centric information

### Phase 2: Proper Implementation (Recommended)
1. Create new `agency_featured_maids` table
2. Build "Available Maids Showcase" page
3. Migrate existing agency_jobs data (if any)
4. Update navigation and routing

## Quick Fix for Current Page

Since we just built the jobs page, here's how to quickly pivot it:

### Rename Labels:
- "Jobs Management" → "Available Maids Management"
- "Post New Job" → "Add Available Maid"
- "Job Title" → "Maid Specialization"
- "Job Description" → "Maid Description & Skills"
- "Requirements" → "Key Highlights"
- "Benefits" → "Placement Benefits"

### Refocus the Form:
Instead of thinking "what job do I need to fill", think:
- "What maid is available"
- "What are their skills"
- "What's their salary expectation"
- "When are they available"

### Example Entry:
**Before (Job-focused)**:
```
Title: Full-time Housekeeper Needed
Description: Looking for a housekeeper...
Requirements: 2+ years experience
```

**After (Maid-focused)**:
```
Title: Experienced Housekeeper - Immediate Placement
Description: Amhalem is a skilled housekeeper with 5 years experience...
Highlights: English speaking, Childcare certified, Available now
```

## Decision Required

**Choose One**:

### Option 1: Keep Current Implementation
- Accept that agencies can post "job openings" (like mini sponsors)
- Clarify that these are jobs agencies want to fill with external maids
- Keep current database structure

### Option 2: Pivot to Maid Showcase (Recommended)
- Rename everything to focus on available maids
- Use existing agency_jobs table but change the mental model
- Update UI to be maid-centric

### Option 3: Build New Feature from Scratch
- Keep current jobs page as-is
- Build separate "Featured Maids" page
- Use new database table
- Provides both functionalities

## My Recommendation

**Go with Option 2: Pivot to Maid Showcase**

**Why**:
1. Clearer business model (agencies manage maids, not jobs)
2. Differentiates from sponsor job postings
3. Reuses existing work (just rename/refocus)
4. Makes more sense for agency value proposition
5. Sponsors already have job posting functionality

**Next Steps**:
1. Rename UI elements throughout the jobs page
2. Update form labels and placeholders
3. Change documentation
4. Update navigation menu item
5. Refocus the mental model in code comments

**Result**: Agencies become maid aggregators/showcases rather than job posters.
