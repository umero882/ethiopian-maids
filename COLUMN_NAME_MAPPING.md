# Database Column Name Mapping Issue

## Problem Identified

Your database has DIFFERENT column names than what the code expects!

## Column Mismatches

### What Code Expects → What Database Has

| Code Uses          | Database Has       | Status |
|--------------------|-------------------|--------|
| `family_size`      | `household_size`  | ❌ MISMATCH |
| `children_count`   | `number_of_children` | ❌ MISMATCH |
| `salary_budget_min` | ✅ EXISTS | ✅ OK |
| `salary_budget_max` | ✅ EXISTS | ✅ OK |
| `required_skills`  | ✅ EXISTS | ✅ OK |
| `profile_completed` | ✅ EXISTS | ✅ OK |

## The Issue

When the form tries to save `family_size`, the database doesn't have that column - it has `household_size` instead!

Same with `children_count` → database has `number_of_children`.

## Solution

Update the code to map to the actual database column names:
- `family_size` → `household_size`
- `children_count` → `number_of_children`

This way we use the columns that already exist instead of creating new ones.
