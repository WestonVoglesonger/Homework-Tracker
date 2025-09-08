# Habit-Forming Improvements Plan for DueNorth

## Goal
Make the dashboard create ethical, lightweight daily habits via small changes, not big rewrites. Keep existing Overdue and Upcoming cards; improve the rest.

## Guiding Principles (Evidence-Based)

### Fogg Behavior Model (B=MAP)
- Reduce friction and time-to-action
- Prompt at the right moment

### Hooked Loop
- Trigger → Action → Variable Reward → Investment
- Keep loops short and meaningful

### Self-Determination Theory
- Support autonomy, competence, relatedness
- Avoid coercion

### Implementation Intentions
- "If it's morning, then I'll plan today's work" improves follow-through

## Minimum Viable Habit Loop for DueNorth

### Trigger
- One daily in-app prompt on first open
- Optional morning digest (email/push)

### Action
- 1-tap "Plan today" (check-in) + quick mark "planned/done" for top tasks

### Variable Reward
- Small celebratory feedback + streak count + progress trend arrow

### Investment
- Let users add a personal task and set digest timing/preferences

## Dashboard: Small, High-Impact Stat-Card Changes

### Keep As-Is
- **Overdue assignments**: Unchanged
- **Upcoming assignments**: Unchanged (consider label "Due next 7 days" in copy only)

### Replace Weak Cards With

#### Today Check-In (Streak) Card
**Shows:**
- "Planned today?" button (1 tap)
- Current streak
- Last reset date

**First open popover (once/day):**
- "Nice! Day X of your planning streak."

**Acceptance Criteria:**
- Streak increments only after meaningful action (check-in OR mark planned/done), not mere login

#### Today at a Glance Card
**Shows:**
- Count of items due today
- Top 3 prioritized tasks (with "planned/done" toggles)

**Acceptance Criteria:**
- Toggles update without leaving dashboard
- Canvas sync status shown if mismatched

#### This Week Progress Card
**Shows:**
- "On-time this week" % with ▲/▼ vs last week
- Small sparkline

**Acceptance Criteria:**
- No dense charts; single number + trend only

## Optional Features (Phase 2, If Needed)

### Workload Estimate Today
- Light heuristic (e.g., sum of small tasks flagged)

### First-Open-of-Day Congrats Pop-Up
**Triggers:**
- Once per local day on first meaningful action
- Shows streak and "Add one personal task?" CTA

**Features:**
- Tiny confetti or subtle animation
- <2s auto-dismiss
- Accessible via bell icon afterward

**Edge Cases:**
- Grace period for time zone changes
- Prevent multiple fires

## Quick Actions and Micro-Interactions

### Inline Toggles on Assignments
- "Plan" and "Done" toggles in dashboard

### Long-Press or Kebab Menu
- "Snooze to tomorrow" (moves to next day's glance)

### Small, Randomized Positive Microcopy
- Varied, non-addictive feedback on toggle actions

## Daily Digest (Opt-In, Ethical)

### Content
- One morning message (default off or soft-prompt on week 1)
- Due today, due tomorrow, streak message
- Single CTA: "Open to plan 2 mins"

### Preferences
- Delivery time, email vs push
- Quiet hours, frequency (daily/weekday/off)

### Guardrails
- Never more than 1/day
- Escalations only for urgent due-today items and only if opted-in

## Streak Design (Healthy by Default)

### Counting Rules
- Counts "days with check-in or completed/planned task"

### Defaults
- One monthly "rest day" that doesn't break the streak
- No paywall, no pressure copy

### User Control
- Ability to hide streak UI entirely in Settings (autonomy)

## Copy Guidelines (Concise, Supportive)

- **Today Check-In Card**: "Plan today (2 min)"
- **Pop-up**: "Nice—Day {n} of your planning streak."
- **Digest Subject**: "Today at a glance (2-min plan)"
- **Progress Card**: "On-time this week: 72% ▲4%"

## Analytics and Success Metrics

### Core Metrics
- DAU/WAU
- Time-to-first-meaningful-action
- Daily check-in rate
- 7-day repeat check-ins
- Weekly on-time rate

### Secondary Metrics
- Dashboard quick-action use
- Digest opt-in rate
- Notification opens

### Guardrails
- Notification opt-outs
- Hidden-streak rate
- Qualitative feedback

## A/B Experiments (Lightweight)

- **Streak Framing**: "Login streak" vs "Planning streak" → Choose planning (less perverse incentive)
- **Pop-up Presence**: Pop-up vs inline card-only
- **Digest Timing**: 7:30am vs user-chosen
- **Progress Card Metric**: On-time % vs "days cleared" count
- **Animation**: Micro-confetti vs none (watch for annoyance)

## Privacy, Ethics, and Safety Guardrails

### Full User Control
- Toggle streak visibility
- Digest preferences
- Quiet hours
- All notifications

### Transparent Rules
- How streaks work
- What counts toward streaks
- How rest days work

### Minimize Attention Capture
- No infinite feeds
- No variable schedule notifications

### Accessibility
- High contrast
- Motion-reduced mode disables animations

## Implementation Checklist (No Code)

### Data Model
- Daily check-in table or event tracking
- Computed planning_streak field
- Timezone-aware day boundary handling

### API Endpoints
- Record check-in
- Mark planned/done
- Read streak/stats
- Idempotent operations

### UI Components
- 3 new dashboard cards
- First-open pop-up
- Assignment row quick actions
- Settings for notifications/streak visibility

### Notifications
- Single daily digest job (per user preferences)
- Urgent due-today rule behind opt-in

### Instrumentation
- Event taxonomy (check_in, toggle_planned, toggle_done, digest_open)
- Analytics dashboards for metrics

## Rollout Plan

### Week 1
- Instrument events
- Add Today Check-In card
- First-open pop-up
- Simple streak functionality

### Week 2
- Today at a Glance + quick actions
- Progress card (shallow rollup)

### Week 3
- Digest + Settings (quiet hours, opt-in)
- Run A/B experiments

### Week 4
- Polish and copy refinement
- Tune thresholds
- Publish findings

## Small, Later Additions (If Needed)

- "Implementation intention" micro-prompt: "When will you start your first task today?" with hour selector
- One-click "Plan tomorrow" nudge after 7pm if user opened
- Personal task templates (2-3 quick presets)

## Key Principles Summary

- Kept Overdue and Upcoming cards as requested
- Added streak card, daily congrats pop-up, quick actions, and weekly progress card
- Each feature is low-scope and aligned to ethical habit principles
- One daily digest (opt-in, quiet by default) creates predictable trigger without spam
