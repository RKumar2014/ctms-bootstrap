# Suvoda Clinical Trial Management System - Complete Documentation

## Executive Summary

This document provides a comprehensive analysis of the Suvoda clinical trial management system (CTMS), specifically the APC-APN-306 study instance. The system manages the complete lifecycle of clinical trial operations including subject enrollment, drug dispensing, inventory management, accountability tracking, and reporting.

**System Access:**
- URL: https://prod001.suvoda.com/suvoda
- Test Credentials: philtvsc / TrialSite1!
- Study: APC-APN-306, Site 1384 - TriValley Sleep Center

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Navigation \u0026 Main Tabs](#navigation--main-tabs)
3. [Subjects Module](#subjects-module)
4. [Drug Management Module](#drug-management-module)
5. [Reports System](#reports-system)
6. [Changes (Data Correction)](#changes-data-correction)
7. [Admin Module](#admin-module)
8. [Key Technical Features](#key-technical-features)
9. [Implementation Recommendations](#implementation-recommendations)

---

## System Architecture

### **User Role: Site User**
The explored account has "Site User" permissions for Site 1384, which allows:
- View and manage subjects at the assigned site
- Perform drug dispensing and accountability
- Access unblinded reports
- Submit data corrections via the Changes module
- View email notifications

### **Technology Stack Observed**
- **Frontend Framework**: Kendo UI (Telerik) for data grids
- **Grid Features**: Advanced filtering, sorting, grouping, pagination, horizontal scrolling
- **Compliance**: 21 CFR Part 11 electronic signatures for destruction events
- **Export Formats**: Excel (.xlsx), PDF
- **Authentication**: Session-based with multi-application support

---

## Navigation \u0026 Main Tabs

### **Primary Navigation Structure**

| Tab | Purpose |
|-----|---------|
| **My Studies** | Portal to access multiple clinical trial applications |
| **Subjects** | Subject enrollment, visit management, status tracking |
| **Drug** | Inventory management, dispensing, accountability, destruction |
| **Reports** | 8 pre-built reports + ad-hoc report builder |
| **Changes** | Data correction workflow (self-support system) |
| **Admin** | E-mail notifications, user settings (role-dependent) |

### **User Profile Menu**
Accessible via username dropdown (top-right):
- Update Profile
- Change Suvoda Password
- Help
- Logout
- Language Selector (supports multiple locales)

---

## Subjects Module

### **Overview**
Centralized management of clinical trial participants from screening through study completion or early termination.

### **Sub-Tabs**

#### 1. **Active Tab**
- Shows currently active subjects enrolled in the trial
- Empty in the test instance (no active subjects)

#### 2. **All Tab**
- Displays complete list of all subjects (active, completed, terminated)
- **Grid Columns:**
  - **Select** (button) - Opens subject detail page
  - **Subject Number** - Format: `[Site]-[Sequence]` (e.g., `1384-003`)
  - **Date Of Birth** - Format: `MMM-YYYY` (e.g., `May-1950`)
  - **Sex** - Male/Female
  - **Status** - Options include: `Early Terminated`, `Active`, `Completed`
  - **Next Visit Name** - Upcoming scheduled visit
  - **Next Visit Date** - Date of next visit

#### **Grid Functionality**
- **Filtering**: Column-level filters with operators (Is equal to, Contains, Starts with, Ends with) and AND/OR logic
- **Grouping**: Drag-and-drop column headers to group area
- **Sorting**: Click column headers to sort ascending/descending
- **Pagination**: Standard page navigation controls

### **Subject Detail Page**

#### **Header Information**
- Subject Number \u0026 Status displayed prominently (e.g., `1384-003 | Early Terminated`)

#### **Subject Information Section**
Fields displayed:
- **Subject Number** (read-only)
- **Date of Birth** - `MMM-YYYY` format
- **Sex** - Male/Female
- **Initial Informed Consent Date** - Includes date and time (e.g., `10-Oct-2024 02:29 PM`)
- **Early Termination Date** - Displayed only for terminated subjects

#### **Visit Schedule Section**
Tabbed interface showing the **Visit Schedule** tab:

**Grid Columns:**
- **Visit Name** - Examples: `Rollover`, `Enrollment (Visit 1)`, `Visit 2`, `Early Termination`
- **Expected Date (Range)** - Planned visit window
- **Actual Date** - Date the visit actually occurred
- **Drugs Assigned** - Comma-separated list of drug kit numbers (e.g., `800588, 800589, 800590`)

### **Subject Actions**

#### **Rollover Button**
- Initiates the screening or subject rollover workflow
- Performs eligibility checks before allowing subject entry
- **Test Result**: Displayed message "Screening is not open for this study" (study-specific configuration)

#### **Note on Randomization**
- No explicit "Add Subject" or "Randomize" buttons were visible in the current configuration
- These actions appear to be triggered through visit workflows (e.g., during Enrollment Visit)

---

## Drug Management Module

### **Overview**
Comprehensive drug supply chain management from depot shipments to site-level dispensing, accountability, and destruction.

### **Module Structure**
The Drug tab contains 6 major functional areas (button-based navigation):

---

### **1. Update Site Inventory**

**Purpose**: Manually change the status of drug units due to damage, loss, or quality issues.

**Form Fields:**
- **Site** (dropdown) - Select site (e.g., "1384 - TriValley Sleep Center")
- **Update the entire Site inventory to** (dropdown) - New status options:
  - Damaged
  - Missing
  - Quarantined

**Data Grid Columns:**
- Drug Unit ID
- Finished Lot
- Expiration Date
- New Drug Unit Status

**Workflow**: Select status → system bulk-updates all units at the site

---

### **2. Register Drug Shipment**

**Purpose**: Receive and acknowledge incoming drug shipments to the clinical site.

**Data Grid Columns:**
- Shipment ID
- Destination
- Order Date
- Drug Units (quantity or list)
- Actions (buttons for receipt confirmation)

**Note**: Full workflow not accessible without pending shipments in the system.

---

### **3. Subject Accountability**

**Purpose**: Track drug dispensing and reconciliation at the subject/visit level to ensure accurate dose accounting.

**Filter Fields:**
- **Site** (dropdown)
- **Subject** (dropdown)
- **Visit** (dropdown)

**Status Legends** (visual indicators):
- **Error** (red): Quantities entered do not match expected values
- **Warning** (yellow): Accountability is overdue
- **Information** (blue): Monitor has added a comment or review note

**Data Grid Columns:**
- **Submit** (action button in header)
- **Drug Unit ID**
- **Unit Description**
- **Subject Number**
- **Visit Name**
- **Current Status**
- **Assigned Status**
- **Quantity Dosed**
- **Quantity Remaining**
- **Quantity Missing**
- **Reconciliation Date**
- **Comment** (free text for audit trail)

**Workflow**:
1. Select site, subject, and visit
2. Enter quantities (dosed, remaining, missing)
3. Add reconciliation date and comment
4. Submit for approval

---

### **4. Site Inventory Accountability**

**Purpose**: Overall reconciliation of the site's complete drug supply (not subject-specific).

**Filter Fields:**
- **Site** (dropdown)

**Data Grid Columns:**
- **Submit** (button)
- **Drug Unit ID**
- **Unit Description**
- **Current Status**
- **Assigned Status**
- **Quantity Remaining**
- **Quantity Missing**
- **Reconciliation Date**
- **Comment**

**Similar to Subject Accountability** but operates at the site level for unassigned inventory.

---

### **5. On Site Destruction**

**Purpose**: Formal 21 CFR Part 11 compliant destruction of drug units at the clinical site.

**Form Fields:**
- **Site** (dropdown)
- **Signature Process** (dropdown) - Options: "Separate" (likely relates to dual-signature requirements)
- **Destruction Date** (date picker)
- **Serialized Drugs** (expandable section) - Multi-select interface for choosing specific drug unit IDs

**Electronic Signature Section:**
- **Site Signature** (checkbox) - Acknowledgment of responsibility
- **Username** (text input)
- **Password** (password input)
- **Process Destruction** (button) - Finalizes the destruction record

**Compliance Features**:
- Requires explicit electronic signature
- Captures date, time, and user identity
- Creates permanent audit trail

---

### **6. Shipment For Destruction**

**Purpose**: Return drug units to a central Destruction Destination Facility (DDF).

**Form Fields:**
- **Site** (dropdown)
- **DDF** (Destruction Destination Facility - dropdown)
- **Signature Process** (dropdown)
- **Tracking Number** (text input) - Courier tracking for shipment
- **Courier** (text input) - Shipping company name

**Serialized Drugs Section:**
- Multi-select interface to choose units for return shipment

**Electronic Signature:**
- **Site Signature** (checkbox)
- **Username** (text input)
- **Password** (password input)
- **Process Shipment** (button) - Generates shipment record

**Workflow**:
1. Select units for destruction
2. Enter courier and tracking details
3. Provide electronic signature
4. System generates shipment manifest

---

## Reports System

### **Overview**
8 pre-built reports organized into 4 categories, plus an ad-hoc report builder. All reports support:
- Column-level filtering
- Excel export
- Real-time data refresh
- Horizontal scrolling for wide datasets

---

### **Report Categories**

#### **1. Study Reports**

##### **Site Monthly Summary**

**Purpose**: High-level overview of site activation and subject enrollment month-over-month.

**Complete Field List:**
- Site
- Site Name
- PI Last Name
- Status
- Country
- Resupply Type
- Activated (date)
- Deactivated (date)
- Reactivated (date)
- 1st Rollover (date)
- 1st Enrollment (date)
- Subject Status (category)
- Total (count)
- **Dynamic Monthly Columns**: Dec-2025, Nov-2025, Oct-2025, etc. (shows subject counts per month)

**Export Options**: Excel

---

#### **2. Subject Reports**

##### **Subject Visit Summary**

**Purpose**: Detailed unblinded log of all subject visits with treatment assignments and drug unit details.

**Complete Field List:**
- Subject Number
- Date of Birth
- Sex
- Initial Informed Consent Date
- Status
- Country
- Site ID
- PI Last Name
- Visit (Visit Name)
- Visit Date
- Expected Visit Date
- Treatment (treatment code)
- Drugs Assigned (drug unit IDs)
- Drug Code
- Drug Description *(unblinded)*
- Finished Lot
- Expiration Date
- Quantity Dispensed
- Visit Dose

**Export Options**: Excel, PDF

---

##### **Subject Summary**

**Purpose**: Comprehensive snapshot of each subject's demographics and study milestones.

**Complete Field List:**
- Subject Number
- Site Number
- Date of Birth
- Sex
- Country
- Status
- Treatment (code)
- Tx. Description *(unblinded treatment description)*
- Initial Informed Consent Date
- Date Rollover Failed
- Date Enrolled
- Date Early Terminated
- Subject Dose
- Rollover Date

**Export Options**: Excel

---

##### **Subject Data Changes**

**Purpose**: Complete audit trail of all modifications to subject-related data.

**Complete Field List:**
- Site
- PI Last Name
- Subject #
- Visit Name
- Data Type (category of change)
- Data Point Changed (specific field name)
- Pre-Value (original value)
- Post-Value (new value)
- Reason (for change - required field)
- Initiator (username who requested change)
- Approver (username who approved change)
- Date (UTC) (timestamp of change)

**Export Options**: Excel

**Use Case**: Regulatory compliance, audit trail documentation, change request tracking

---

#### **3. Drug Reports**

##### **Drug Accountability**

**Purpose**: Most detailed report - tracks the complete lifecycle of every drug unit from depot to destruction.

**Complete Field List** (24 fields):
- Drug Unit ID
- Drug Code
- Drug Description *(unblinded)*
- Country
- Shipment Source ID
- Shipment ID
- Shipment Ordered Date
- Shipment Receipt Date
- Site ID
- PI Last Name
- Finished Lot
- Expiration Date
- Subject Number (if assigned)
- Assigned Date
- Visit Name
- Reconciled Status
- Quantity Dosed
- Quantity Remaining
- Quantity Missing
- Site Reconciliation Date
- Site Comment
- Monitor Reconciliation Date
- Monitor Comment
- Quantity Destroyed
- Destruction Date

**Filter Features**:
- Global "Finished Lot" filter at top
- Column-level filters for all fields

**Export Options**: Excel

**Critical for**: Regulatory inspections, sponsor audits, DEA requirements (if applicable)

---

##### **Drug Shipment Summary**

**Purpose**: Monitor logistics and delivery status of all drug shipments.

**Complete Field List:**
- Shipment Number
- Shipment Type (e.g., Site Shipment, Return Shipment)
- Order Date
- Received Date
- Status (Ordered, In-Transit, Received, etc.)
- Source Depot
- Destination Country
- Destination (site ID and name)
- Drug Code
- Drug Description
- Finished Lot
- Drug Unit Number(s) (list of IDs in shipment)
- Courier (shipping company)
- Tracking Number
- Dispatch Date
- Delivery Date

**Grid Features**:
- Grouping by Shipment Number (collapsible rows)
- Shows individual drug units within each shipment

**Export Options**: Excel

---

##### **Inventory Levels**

**Purpose**: Real-time stock levels across sites, depots, or countries.

**Filter Options:**
- **Report Type** (radio buttons): Site / Depot / Country
- **Group By Finished Lot and Expiration Date** (checkbox)
- **Countries** (multi-select dropdown)
- **Sites** (multi-select dropdown)

**Base Field List:**
- Site Number
- Site Name
- PI Last Name
- Drug Code
- Drug Description
- Drug Status (Available, Assigned, Dispensed, Damaged, etc.)
- Quantity

**Additional Fields (when "Group By Finished Lot" is enabled):**
- Finished Lot
- Expiration Date

**Export Options**: Excel

**Use Case**: Resupply planning, expiration management, emergency drug needs

---

##### **Site Drug Unit Summary**

**Purpose**: Granular view of individual drug units at the site level.

**Complete Field List:**
- Drug Unit ID
- Drug Description
- Finished Lot
- Expiration Date
- Drug Status
- Country
- Site ID
- PI Last Name
- Subject Number (if assigned)
- Assigned Date
- Visit Name
- Shipment ID

**Filter Options**:
- Multi-select Countries
- Multi-select Sites
- Column-level filters

**Export Options**: Excel

---

#### **4. Ad-hoc Reports**

##### **Report Builder**

**Purpose**: Create custom reports by selecting specific fields from base datasets.

**Base Datasets:**
1. **Drug Accountability** - Start with drug units and add linked subject/site data
2. **Subjects** - Start with subjects and add linked visit/drug data

**Customization Features:**
- **Field Selection**: Pick from categories:
  - Subject Visit Data (Is Rescreen, Enrollment Date, etc.)
  - Site Data (Site Number, Country, etc.)
  - Drug Data (Drug Code, Lot Number, etc.)
- **Column Aliasing**: Rename columns for clarity
- **Custom Sorting**: Multi-column sort with priority settings
- **Custom Filters**: Define filter values for each column
- **Save \u0026 Share**: Reports can be saved with custom names and shared with other study users

##### **Saved and Shared Reports**

**Purpose**: Access and re-run previously created ad-hoc reports.

**Features**:
- List of all saved reports (personal and shared)
- Click to run with saved parameters
- Edit/delete permissions based on creator

---

## Changes (Data Correction)

### **Module Name in UI**: Self Support

**Purpose**: Allow site users to request corrections to previously entered data (subject demographics, visit dates) with full audit trail.

### **Subject Listing**

**Grid Columns:**
- Subject Number
- Date Of Birth
- Gender *(note: labeled "Gender" here vs. "Sex" in Subjects tab)*
- Status
- Last Visit Name
- **Update** (button) - Opens change request form

### **Update Forms**

#### **1. Demographic Data Tab**

**Editable Fields:**
- **Date of Birth** (date picker)
- **Sex** (dropdown: Male/Female)
- **Reason** (text area) - **REQUIRED** for audit trail

#### **2. Visit Data Tab**

**Displays**: List of "Performed Visits" (e.g., Rollover, Enrollment, Visit 2, Early Termination)

**Click on a visit to edit:**
- **Visit Date** (date picker)
- **Initial Informed Consent Date** (date + time picker)
- **Reason** (text area) - **REQUIRED**

### **Workflow**
1. User selects a subject and clicks "Update"
2. Chooses Demographic or Visit Data tab
3. Modifies the necessary field(s)
4. Provides a mandatory "Reason" for the change
5. Submits the change request
6. *(Approval workflow not visible in Site User role - likely requires monitor/admin approval)*

### **Audit Trail**
All changes are logged in the **Subject Data Changes** report with:
- Pre-value, Post-value
- Initiator, Approver
- Timestamp (UTC)
- Reason

---

## Admin Module

### **Overview**
For the **Site User** role, Admin access is limited to notification management. Higher privilege roles (Study Manager, System Admin) would see additional options like:
- User management
- Site activation/deactivation
- Study configuration
- Drug supply setup

### **Notifications Section**

#### **E-mail Notifications**

**Purpose**: Centralized log of all system-generated notification emails.

**Filter Fields:**
- **Site** (dropdown)
- **Depot** (dropdown)
- **Start Date** (date picker)
- **End Date** (date picker)

**Grid Columns:**
- **Select** (checkbox) - For bulk actions
- **Notification Type** (e.g., Subject Enrolled, Drug Shipment Received, Accountability Overdue)
- **Title** (email subject line)
- **Generated On** (date/time)
- **Subject Number** (if applicable)
- **Site** (site ID)
- **Depot** (if applicable)
- **Country**
- **Status** (Sent, Pending, Failed)

**Use Cases**:
- Verify that important notifications were sent
- Troubleshoot missing emails
- Audit communication history

---

## My Studies Tab

### **Overview**
The **My Studies** tab redirects to a **"My Applications"** portal page.

**Purpose**: For users with access to multiple clinical trials/applications, this serves as a central hub.

**Display**:
- List of study/application identifiers
- Clickable links to enter each study's dashboard

**Example**:
- `APC-APN-306` (Apnimed study)

**Functionality**: Click on a study name to load that study's Subjects/Drug/Reports/etc. tabs.

---

## Key Technical Features

### **1. Serialized Drug Management**
- Every drug unit has a unique Drug Unit ID
- Tracked from manufacturing lot through destruction
- Supports both bottle-level and unit-dose tracking

### **2. Kendo UI Data Grids**
**Standard Features Across All Grids:**
- Column-level filtering with complex operators (Equals, Contains, Starts With, etc.)
- Multi-condition filters with AND/OR logic
- Drag-and-drop grouping
- Ascending/Descending sorting
- Pagination (configurable page size)
- Horizontal scrolling for wide datasets
- Responsive column resizing

### **3. Electronic Signatures (21 CFR Part 11)**
**Used for:**
- On-site drug destruction
- Shipments for destruction

**Components:**
- Username/Password entry
- Explicit acknowledgment checkbox
- Timestamp capture
- Permanent audit trail

### **4. Export Capabilities**
**Excel Export:**
- Available on all reports
- Exports currently visible filtered/sorted data
- Maintains column structure

**PDF Export:**
- Available on select reports (e.g., Subject Visit Summary)
- Formatted for printing/archival

### **5. Audit Trail \u0026 Compliance**
**Change Tracking:**
- All data corrections logged via Changes module
- Pre-value and Post-value capture
- Mandatory "Reason" field
- Initiator and Approver tracking
- UTC timestamps

**Report Available:** Subject Data Changes

### **6. Role-Based Access Control (RBAC)**
**Observed Roles:**
- **Site User** (tested account):
  - Subject management at assigned site
  - Drug dispensing and accountability
  - Access to unblinded reports
  - Limited admin (notifications only)

**Expected Additional Roles** (not directly observed):
- Study Manager: Study-wide configuration
- Monitor: Review and approve data changes
- Depot Manager: Manage depot inventory
- System Administrator: User management, system settings

### **7. Unblinding Management**
- System maintains both blinded and unblinded report versions
- URL paths include "Unblinded" suffix (e.g., `/Reports/SubjectVisitSummaryUnblinded`)
- Site Users have unblinded access in this configuration
- Drug descriptions and treatment codes visible in reports

### **8. Visit-Driven Workflows**
- Subject progression tied to visit schedule
- Drug dispensing occurs during visits
- Visit dates trigger compliance windows
- Expected vs. Actual date tracking

### **9. Multilingual Support**
- Language selector in user profile menu
- Observed: English (United States)
- Likely supports other locales for global trials

---

## Implementation Recommendations

### **Core Modules to Build First**

#### **Phase 1: Foundation**
1. **User Management \u0026 Authentication**
   - Multi-role system (Site User, Monitor, Admin)
   - Session management
   - Password policies

2. **Site Management**
   - Site creation and activation
   - Site-user assignment
   - Multi-site support

3. **Study Configuration**
   - Visit schedule definition
   - Drug configuration (codes, descriptions)
   - Treatment arm setup (for randomization)

#### **Phase 2: Core Clinical Operations**
4. **Subject Management Module**
   - Subject enrollment (Rollover workflow)
   - Visit schedule tracking
   - Status management (Active, Early Terminated, Completed)
   - Informed consent date capture

5. **Drug Management Module**
   - Drug unit creation (serialized IDs)
   - Inventory status tracking (Available, Assigned, Dispensed, etc.)
   - Visit-based dispensing workflow
   - Drug assignment to subjects

#### **Phase 3: Supply Chain \u0026 Accountability**
6. **Shipment Management**
   - Create shipments from depot to site
   - Receipt confirmation
   - Tracking number integration

7. **Accountability Module**
   - Subject-level accountability (quantities dosed/remaining/missing)
   - Site-level inventory reconciliation
   - Overdue warnings
   - Monitor comments

8. **Destruction Workflows**
   - On-site destruction with e-signatures
   - Return shipments to DDF
   - 21 CFR Part 11 compliance features

#### **Phase 4: Reporting \u0026 Analytics**
9. **Pre-Built Reports**
   - Implement the 8 core reports
   - Excel/PDF export functionality
   - Advanced grid features (Kendo UI or equivalent)

10. **Ad-hoc Report Builder**
    - Field selection interface
    - Save/share functionality
    - Custom filtering and sorting

#### **Phase 5: Audit \u0026 Compliance**
11. **Changes Module (Self Support)**
    - Data correction workflow
    - Approval process
    - Audit trail capture

12. **E-mail Notifications**
    - Event-driven triggers
    - Notification log
    - Configurable recipients

---

### **Technology Stack Recommendations**

#### **Frontend**
- **React** or **Angular** for SPA
- **AG-Grid** or **Kendo React Grid** for data tables
- **React Hook Form** or **Formik** for complex forms
- **Axios** for API calls
- **React-PDF** or **jsPDF** for PDF generation

#### **Backend**
- **Node.js (Express)** or **ASP.NET Core** or **Spring Boot**
- **RESTful API** design
- **PostgreSQL** or **SQL Server** for relational data
- **Redis** for session management
- **JWT** for authentication

#### **Compliance \u0026 Security**
- **21 CFR Part 11** module for e-signatures:
  - Username/password authentication
  - Timestamp capture (UTC)
  - Audit trail with pre/post values
  - Non-repudiation
- **HTTPS** everywhere
- **Role-Based Access Control (RBAC)**
- **Audit logging** for all CRUD operations

#### **Reporting**
- **Export Libraries**:
  - **ExcelJS** or **XLSX** for Excel export
  - **PDFKit** or **Puppeteer** for PDF generation
- **Ad-hoc Report Builder**:
  - Dynamic SQL query generation (with parameterization to prevent SQL injection)
  - Column aliasing and custom sort order storage (JSON config)

---

### **Database Schema Considerations**

#### **Key Entities**
1. **User** (user_id, username, role, site_id, email)
2. **Site** (site_id, site_number, site_name, pi_last_name, country, status)
3. **Subject** (subject_id, subject_number, site_id, dob, sex, status, consent_date, enrollment_date, termination_date)
4. **Visit** (visit_id, visit_name, expected_date_range_start, expected_date_range_end, sequence)
5. **SubjectVisit** (subject_visit_id, subject_id, visit_id, actual_date, status)
6. **DrugUnit** (drug_unit_id, drug_code, drug_description, finished_lot, expiration_date, status, current_site_id, subject_id, assigned_date)
7. **Shipment** (shipment_id, shipment_type, source, destination, order_date, received_date, courier, tracking_number)
8. **ShipmentDrugUnit** (shipment_id, drug_unit_id)
9. **SubjectAccountability** (accountability_id, subject_id, visit_id, drug_unit_id, quantity_dosed, quantity_remaining, quantity_missing, reconciliation_date, comment)
10. **DataChange** (change_id, subject_id, data_type, field_name, pre_value, post_value, reason, initiator_user_id, approver_user_id, change_date_utc)
11. **Notification** (notification_id, type, title, generated_on, subject_id, site_id, status)
12. **ElectronicSignature** (signature_id, user_id, action_type, action_id, timestamp_utc)

#### **Audit Table Pattern**
For every primary table (Subject, DrugUnit, etc.), create an audit table:
- `subject_audit`, `drug_unit_audit`, etc.
- Columns: `audit_id`, `record_id`, `action` (INSERT/UPDATE/DELETE), `changed_by_user_id`, `changed_at_utc`, `old_values_json`, `new_values_json`

---

### **Critical Features to Prioritize**

1. **Audit Trail**: Every change must be logged with who/when/why
2. **Grid Filtering**: Users rely heavily on filtering large datasets
3. **Excel Export**: Most frequently used feature in reporting
4. **Visit Schedule**: The backbone of subject progression
5. **Drug Serialization**: Unique ID for every drug unit
6. **Accountability Logic**: Automatically calculate discrepancies (Expected vs. Actual)
7. **E-Signatures**: Required for destruction events (regulatory)
8. **Multi-Site Support**: Must handle 100+ sites in a global trial

---

### **UI/UX Patterns to Replicate**

1. **Dashboard-style landing pages** with large buttons for module selection
2. **Tabbed interfaces** within modules (e.g., Active/All in Subjects, Demographic/Visit in Changes)
3. **Breadcrumb navigation** for drilling down into details
4. **Inline editing** in grids where appropriate
5. **Modal dialogs** for forms (e.g., Update Site Inventory)
6. **Color-coded status indicators** (Error/Warning/Info in Subject Accountability)
7. **Collapsible sections** (e.g., Serialized Drugs in Destruction workflows)
8. **Responsive grids** with horizontal scrolling for wide datasets

---

## Appendix: Screenshots Reference

The following screenshots were captured during exploration (available in the artifacts directory):

1. `subjects_page_main_1766800710639.png` - Subjects "All" tab with subject list
2. `changes_subject_listing_1766813812923.png` - Changes module subject listing
3. `my_applications_page_1766813792982.png` - My Studies/Applications portal

Additional screenshots are available in the click feedback folder for various UI interactions.

---

## Appendix: Complete Field Reference

### **Subject Module - All Fields**
| Field Name | Type | Format | Notes |
|------------|------|--------|-------|
| Subject Number | String | `[Site]-[Seq]` | e.g., 1384-003 |
| Date of Birth | Date | MMM-YYYY | Partial date for privacy |
| Sex | Dropdown | Male/Female | |
| Status | Dropdown | Active, Early Terminated, Completed | |
| Initial Informed Consent Date | DateTime | DD-MMM-YYYY HH:MM AM/PM | |
| Early Termination Date | Date | DD-MMM-YYYY | Conditional |
| Next Visit Name | String | | From visit schedule |
| Next Visit Date | Date | DD-MMM-YYYY | |
| Visit Name (in schedule) | String | | e.g., Enrollment (Visit 1) |
| Expected Date Range | String | | e.g., "10-Oct-2024 to 15-Oct-2024" |
| Actual Date | Date | DD-MMM-YYYY | |
| Drugs Assigned | String (CSV) | | e.g., "800588, 800589" |

### **Drug Module - All Fields**
| Field Name | Context | Type | Notes |
|------------|---------|------|-------|
| Drug Unit ID | All drug modules | String | Unique identifier |
| Drug Code | All | String | Treatment code |
| Drug Description | All | String | Unblinded name |
| Finished Lot | All | String | Manufacturing batch |
| Expiration Date | All | Date | |
| Drug Status | All | Dropdown | Available, Assigned, Dispensed, Damaged, Missing, Quarantined, Destroyed |
| Quantity Dosed | Accountability | Integer | |
| Quantity Remaining | Accountability | Integer | |
| Quantity Missing | Accountability | Integer | |
| Reconciliation Date | Accountability | Date | |
| Site Comment | Accountability | Text | |
| Monitor Comment | Accountability | Text | |
| Shipment ID | Shipment/Accountability | String | |
| Courier | Shipment For Destruction | String | |
| Tracking Number | Shipment For Destruction | String | |
| Destruction Date | Destruction | Date | |

### **Reports - Complete Column Lists**

See detailed field lists in the [Reports System](#reports-system) section above.

---

## Document Version
- **Version**: 1.0
- **Date**: December 26, 2025
- **Explored By**: Antigravity AI
- **System Version**: Suvoda PROD001 instance
