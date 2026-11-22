# Faction Bikeworks website revamp and Admin Panel: acceptance specification

**Product:** Faction Bikeworks website
**Parent:** none (no work item; personal project)
**Date:** 2026-11-22
**Status:** Approved 2026-11-22

Design doc: [`docs/plans/2026-11-22-website-revamp-admin-design.md`](plans/2026-11-22-website-revamp-admin-design.md)

Story labels (e.g. `RV-01`) are provisional and aren't tracker IDs. The Gherkin describes expected behaviour. It isn't a set of passing tests yet.

## Stories at a glance

- **RV-01 Public site:** visitors see the same content as today in a redesigned, interactive site.
- **RV-02 Admin accounts:** admins sign in, manage each other's accounts, and change their own password.
- **RV-03 Content editing:** admins change any visible text, number, link or setting and see it live.
- **RV-04 Media:** admins upload, reorder, caption and remove images and logos.
- **RV-05 Audit log:** admins see who changed what and when, and can restore an earlier version.
- **RV-06 Portable hosting:** the site runs on MySQL or PostgreSQL, on plain Node or Docker.

## Shared definitions and boundaries

- **Admin:** a person with an active account in the Admin Panel. All admins have the same access.
- **Section:** one editable block of the site (for example "Home: Services" or "FAQ").
- **Live:** saved changes show to visitors on their next page load, with no publish step.

### Out of scope for all stories
New content sections, online booking, payments, live Google reviews, storing contact messages, roles/permissions, two-factor login, password reset by email, drafts or scheduled publishing.

## RV-01: Public site

**User Story:** As a rider, I want a fast, good-looking site with the shop's services, hours, location and photos, so that I can decide to come in and contact the shop easily.

### Acceptance criteria
**RV01-AC1: Content parity.** Home, About, Media, FAQ and Contact show every piece of content the current pages show, seeded word for word. The one exception is opening hours, which use one standard wording everywhere ("Mon–Fri · 11:00–19:30", "Sat · 11:00–16:00", "Sun · Closed").
**RV01-AC2: Old links keep working.** `index.html`, `about.html`, `gallery.html`, `faq.html`, `contact.html` permanently redirect to their new pages.
**RV01-AC3: WhatsApp message.** The quick-message form checks name and message, then opens WhatsApp to the configured number with the message pre-filled.
**RV01-AC4: Theme.** The site follows the device's light/dark setting and shows the matching logo.
**RV01-AC5: Reduced motion.** With reduced motion turned on, there are no slideshow zooms, parallax, smooth scrolling or count-up animations, and content shows immediately.
**RV01-AC6: Search engines.** Each page is served with its own title, description, share image and canonical link from the Admin Panel. A sitemap and robots file are generated.
**RV01-AC7: Open now.** A badge shows "Open now" or "Closed" based on the configured hours in Kuala Lumpur time.
**RV01-AC8: No paid Google APIs.** No page loads the Google Maps JavaScript API. The map is the free embed.

### Gherkin specifications
```gherkin
@RV01
Feature: Public site

  Background:
    Given the site has been seeded with the current content

  @RV01_AC1
  Scenario Outline: Every current page shows its content
    When a visitor opens "<page>"
    Then they see the heading "<heading>"
    Examples:
      | page     | heading                            |
      | /        | Ride Hard. We’ll keep you rolling. |
      | /about   | About Faction Bikeworks            |
      | /media   | Media Gallery                      |
      | /faq     | FAQ                                |
      | /contact | Contact & Hours                    |

  @RV01_AC2
  Scenario: Old address redirects
    When a visitor requests "/gallery.html"
    Then they are permanently redirected to "/media"

  @RV01_AC3
  Scenario: Message missing a name
    Given a visitor is on the contact page
    When they send a message without a name
    Then they see "Please enter your name."
    And WhatsApp is not opened

  @RV01_AC3
  Scenario: Valid message opens WhatsApp
    Given the WhatsApp number is "601133321767"
    When a visitor sends name "Aiman" and message "Fork service?"
    Then WhatsApp opens for "601133321767" with text containing "Name: Aiman" and "Message: Fork service?"
    And they see "Opening WhatsApp…"

  @RV01_AC5
  Scenario: Reduced motion
    Given the visitor's device asks for reduced motion
    When they open the home page
    Then the stats show their final values without counting
    And the hero image does not zoom

  @RV01_AC7
  Scenario Outline: Open now badge
    Given the hours are Mon–Fri 11:00–19:30 and Sat 11:00–16:00
    When it is <time> in Kuala Lumpur
    Then the badge reads "<badge>"
    Examples:
      | time                | badge    |
      | Monday 12:00        | Open now |
      | Saturday 16:30      | Closed   |
      | Sunday 12:00        | Closed   |

  @RV01_AC8
  Scenario: No paid map script
    When any public page loads
    Then no request is made to "maps.googleapis.com/maps/api/js"
```

## RV-02: Admin accounts

**User Story:** As a shop admin, I want my own login and the ability to add or remove other admins, so that only our team can change the site.

### Acceptance criteria
**RV02-AC1: Sign in.** An admin signs in with email and password and stays signed in for up to 7 days of use.
**RV02-AC2: Wrong details.** A wrong email or password shows "Email or password is incorrect." without saying which one was wrong.
**RV02-AC3: Lockout.** After 5 failed attempts in 15 minutes, further attempts for that email from that address are refused for 15 minutes.
**RV02-AC4: Manage admins.** Any admin can add an admin, disable or delete one, and set a new password for one.
**RV02-AC5: Safety.** An admin can't disable or delete themselves, and the last active admin can't be removed.
**RV02-AC6: Own password.** An admin changes their own password by entering the current one first.
**RV02-AC7: Protected panel.** Anyone not signed in who opens `/admin` is sent to the sign-in page, and the admin API returns 401.
**RV02-AC8: First admin.** On a fresh install the first admin is created from the command line or bootstrap settings.

### Gherkin specifications
```gherkin
@RV02
Feature: Admin accounts

  Background:
    Given an active admin "owner@faction.my" exists

  @RV02_AC2
  Scenario: Wrong password
    When someone signs in as "owner@faction.my" with the wrong password
    Then they see "Email or password is incorrect."

  @RV02_AC3
  Scenario: Too many attempts
    Given 5 failed sign-ins for "owner@faction.my" in the last 15 minutes
    When they try again with the correct password
    Then the sign-in is refused with "Too many attempts. Try again in 15 minutes."

  @RV02_AC5
  Scenario: Last admin cannot be removed
    Given "owner@faction.my" is the only active admin
    When they try to delete their own account
    Then the action is refused

  @RV02_AC7
  Scenario: Signed-out visitor
    When a signed-out visitor opens "/admin/faq"
    Then they are taken to the sign-in page
```

## RV-03: Content editing

**User Story:** As a shop admin, I want to edit any text, number, link or setting on the site from my phone, so that the site stays accurate without a developer.

### Acceptance criteria
**RV03-AC1: Everything editable.** Every visible element on the public site belongs to an editable section: header nav labels, hero, services, stats, steps, map, about, gallery, FAQ, contact, footer, social links, WhatsApp number, opened year, accent colour, logos, favicon, and per-page SEO text.
**RV03-AC2: Lists.** Services, stats, steps, FAQs, hours, footer links and social links can be added, removed and reordered.
**RV03-AC3: Live.** After saving, the next public page load shows the change.
**RV03-AC4: Validation.** Invalid input (empty required field, bad URL, bad map link, bad phone number) is rejected with the field highlighted and the error explained.
**RV03-AC5: Conflict.** If someone else saved the same section after I opened it, my save is refused with "Someone else changed this, reload to see their version." and my edits stay on screen.
**RV03-AC6: Unsaved changes.** Leaving an editor with unsaved changes asks for confirmation.
**RV03-AC7: Preview.** Each editor shows a preview of the section before saving.

### Gherkin specifications
```gherkin
@RV03
Feature: Content editing

  Background:
    Given admin "owner@faction.my" is signed in

  @RV03_AC3
  Scenario: Change opening hours
    When they change Saturday hours to "10:00–16:00" and save
    Then the About, Contact and FAQ hours visitors see show Saturday "10:00–16:00"

  @RV03_AC2
  Scenario: Reorder FAQ
    Given the FAQ "Do you service e-MTBs?" is fourth
    When they drag it to first and save
    Then visitors see it first on the FAQ page

  @RV03_AC4
  Scenario: Reject a non-Google map link
    When they set the map link to "https://example.com/map" and save
    Then the save is refused with "Paste the embed link from Google Maps → Share → Embed a map."

  @RV03_AC5
  Scenario: Two admins edit the same section
    Given "staff@faction.my" opened Home: Stats at the same time
    And "owner@faction.my" saved Home: Stats first
    When "staff@faction.my" saves Home: Stats
    Then they see "Someone else changed this, reload to see their version."
    And their edits are still on screen
```

*(Note: hours are stored once, per weekday. About, Contact and the FAQ answer all show the same data, and the FAQ answer uses an `{hours}` placeholder.)*

## RV-04: Media

**User Story:** As a shop admin, I want to upload and arrange photos and logos, so that the site shows our latest work.

### Acceptance criteria
**RV04-AC1: Upload.** JPG, PNG or WebP images up to 15 MB upload. Logos also accept SVG. Other files are refused with a clear message.
**RV04-AC2: Optimised.** Uploaded photos are resized for fast loading, and location data is removed.
**RV04-AC3: Arrange.** Hero slides and gallery photos can be added from the library, reordered by dragging, and removed.
**RV04-AC4: Alt text.** Each image has editable alt text, used as the gallery caption and for screen readers.
**RV04-AC5: In-use protection.** An image used anywhere on the site can't be deleted, and the admin is shown where it's used. Deleting an unused image hides it from the library. Restoring an older section version that used it brings it back.

### Gherkin specifications
```gherkin
@RV04
Feature: Media

  Background:
    Given admin "owner@faction.my" is signed in

  @RV04_AC1
  Scenario: Refuse a PDF
    When they upload "price-list.pdf"
    Then they see "Only JPG, PNG or WebP images up to 15 MB."

  @RV04_AC5
  Scenario: Image in use
    Given "hero1" is a hero slide
    When they delete "hero1" from the library
    Then the delete is refused and "Home: Hero" is listed as using it
```

## RV-05: Audit log

**User Story:** As a shop admin, I want to see who changed what and when, and undo a bad change, so that mistakes are easy to trace and fix.

### Acceptance criteria
**RV05-AC1: Recorded.** Every content save, media upload/edit/delete, admin account change, password change, sign-in, failed sign-in, sign-out and restore is recorded with the admin, time, action, what was affected and the address it came from.
**RV05-AC2: Before and after.** Content and account changes show the before and after values side by side, with changed fields highlighted. Passwords are never shown or stored in the log.
**RV05-AC3: Filter.** The log can be filtered by admin, section, action and date range, newest first, paged.
**RV05-AC4: Restore.** Any content entry can restore that section to its earlier or later version. The restore is itself logged.
**RV05-AC5: Permanent.** Log entries can't be edited or deleted from the panel, and they stay when an admin account is deleted (the admin's email is kept on the entry).

### Gherkin specifications
```gherkin
@RV05
Feature: Audit log

  Background:
    Given admins "owner@faction.my" and "staff@faction.my" exist

  @RV05_AC1 @RV05_AC2
  Scenario: Content change is recorded
    When "staff@faction.my" changes the stat "Bikes Serviced" from "1,800+" to "2,000+"
    Then the audit log's newest entry shows "staff@faction.my" updated "Home: Stats"
    And its diff shows "1,800+" before and "2,000+" after

  @RV05_AC2
  Scenario: Password never logged
    When "owner@faction.my" sets a new password for "staff@faction.my"
    Then the entry reads "Password reset for staff@faction.my"
    And no password or hash appears in the entry

  @RV05_AC4
  Scenario: Restore a section
    Given the entry above exists
    When "owner@faction.my" restores its earlier version
    Then visitors see "1,800+" again
    And a new entry records that "owner@faction.my" restored "Home: Stats"

  @RV05_AC5
  Scenario: Deleted admin's history remains
    When "staff@faction.my" is deleted
    Then their past entries still show "staff@faction.my"
```

## RV-06: Portable hosting

**User Story:** As whoever hosts the site, I want to run it on MySQL or PostgreSQL with plain Node or Docker, so that it fits the setup I already have.

### Acceptance criteria
**RV06-AC1: Either database.** Setting `DB_CLIENT` to `mysql` or `pg` with a `DATABASE_URL` is enough to run it. Migrations and seed run on both.
**RV06-AC2: Same behaviour.** The full automated test suite passes on MySQL 8 and PostgreSQL 16.
**RV06-AC3: One process.** One Node process serves the site, the Admin Panel, the API and uploaded images.
**RV06-AC4: Docs.** The README covers plain Node and Docker deploys for both databases, the settings, keeping uploads between deploys, backups, and creating the first admin.
**RV06-AC5: Health.** `/healthz` reports whether the app and database are up.

### Gherkin specifications
```gherkin
@RV06
Feature: Portable hosting

  @RV06_AC1
  Scenario Outline: Fresh install
    Given an empty <database> database
    When the host runs the migrations and seed with DB_CLIENT "<client>"
    Then the public site shows the seeded content
    Examples:
      | database      | client |
      | MySQL 8       | mysql  |
      | PostgreSQL 16 | pg     |

  @RV06_AC5
  Scenario: Database down
    Given the database is unreachable
    When "/healthz" is requested
    Then it answers 503
```

## Shared technical completion checks
- TypeScript strict and lint clean in `web`, `server` and `shared`.
- Server tests (Vitest + Supertest) run against real MySQL and PostgreSQL containers, and both must pass.
- Playwright end-to-end tests cover one happy path per story.
- Lighthouse mobile on Home: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- Keyboard-only use works on the public site and the Admin Panel. Focus is visible and the lightbox traps focus.
- No secrets in the repo. `.env.example` documents every setting.

## Project note: safe test environments
Local development and tests use the Docker compose files (`compose.mysql.yaml`, `compose.pg.yaml`). Never point tests at the production database. Tests truncate tables.
