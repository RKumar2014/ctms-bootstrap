# 21 CFR Part 11 Compliance Improvements
## Priority Fixes for Audit Trail

---

## 🔴 PRIORITY 1: Reason for Change Field (CRITICAL)

### Current Status:
- ✅ Database field exists: `audit_log.changes_json.reason_for_change`
- ❌ NOT captured in UI during returns/updates
- ❌ NOT required (currently optional)

### Required Changes:

#### 1. SubjectAccountabilityPage.tsx - Return Modal
**Location**: Lines 1460-1472

**Change Label:**
```typescript
// FROM:
<label>Comments</label>
<textarea placeholder="Optional comments..." />

// TO:
<label className="block text-sm font-medium text-gray-700 mb-2">
    Reason for Change <span className="text-red-500">*</span>
    <span className="text-xs text-gray-500 ml-2">(Required by 21 CFR Part 11)</span>
</label>
<textarea 
    value={returnComments}
    onChange={(e) => setReturnComments(e.target.value)}
    required
    rows={3}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Example: Patient returned medication at scheduled Visit 2, compliant with protocol"
/>
```

**Add Validation** (Line ~583):
```typescript
const handleReturn = () => {
    if (!selectedRecord) return;
    
    // NEW: Validate reason for change is provided
    if (!returnComments || returnComments.trim().length < 10) {
        setErrorMessage('Reason for change is required (minimum 10 characters) for 21 CFR Part 11 compliance');
        return;
    }
    
    // ... rest of validation
}
```

#### 2. Backend - Record Return API
**File**: `backend/src/routes/accountability.routes.ts`

**Add to Audit Log:**
```typescript
// When recording return, add reason to audit log
await logAudit({
    user_id: req.user.userId,
    username: req.user.username,
    action: 'RETURN',
    table_name: 'accountability',
    record_id: id,
    old_values: { qty_returned: 0 },
    new_values: { qty_returned, return_date },
    reason_for_change: req.body.comments, // ← ADD THIS
    ip_address: req.ip
});
```

#### 3. Edit Dates Modal (Fix Missing Dates)
**Location**: SubjectAccountabilityPage.tsx, Edit Modal

**Add Reason Field:**
```typescript
// Add state
const [editReason, setEdit Reason] = useState('');

// In edit modal form (after date fields):
<div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Reason for Change <span className="text-red-500">*</span>
    </label>
    <textarea 
        value={editReason}
        onChange={(e) => setEditReason(e.target.value)}
        required
        rows={2}
        placeholder="Example: Correcting data entry error - dates were not captured during initial dispense"
    />
</div>

// In handleEditSubmit validation:
if (!editReason || editReason.trim().length < 10) {
    setErrorMessage('Reason for change is required');
    return;
}
```

---

## 🟡 PRIORITY 2: Action Type Clarity

### Current Actions:
- ❌ RETURN (ambiguous - INSERT or UPDATE?)
- ❌ DISPENSE (ambiguous)

### Recommended Changes:

#### Backend Audit Service
**File**: `backend/src/services/auditService.ts`

**Expand Action Types:**
```typescript
export type AuditAction = 
    | 'CREATE'        // New record
    | 'UPDATE'        // Modify existing
    | 'DELETE'        // Remove record
    | 'DISPENSE'      // Drug dispensed (INSERT to accountability)
    | 'RETURN'        // Drug returned (UPDATE to accountability)
    | ' EDIT_DATES'    // Fixing missing dates (UPDATE)
    | 'LOGIN'
    | 'LOGOUT'
    | 'DESTROY'
    | 'VIEW';
```

**Better Logging:**
```typescript
// When dispensing:
await logAudit({
    action: 'DISPENSE',  // Keep as is
    table_name: 'accountability',
    new_values: { ...dispensedData },
    reason_for_change: `Medication dispensed to ${subjectNumber} at ${visitName}`
});

// When recording return:
await logAudit({
    action: 'RETURN',  // Keep as is
    table_name: 'accountability',
    old_values: { qty_returned: 0, return_date: null },
    new_values: { qty_returned, return_date, compliance_percentage },
    reason_for_change: userProvidedReason  // FROM UI
});

// When updating dates:
await logAudit({
    action: 'UPDATE',  // or 'EDIT_DATES'
    table_name: 'accountability',
    old_values: { date_of_first_dose: null, date_of_last_dose: null },
    new_values: { date_of_first_dose, date_of_last_dose },
    reason_for_change: userProvidedReason
});
```

---

## 🟡 PRIORITY 3: Timezone Display

### Current:
- ❌ Shows: `12/31/2025, 11:12:40 PM` (no timezone)

### Recommended:
```typescript
// In ChangesPage.tsx formatTimestamp function:
const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',  // ← ADD THIS
        hour12: true
    };
    return date.toLocaleString('en-US', options);
};

// Output: 12/31/2025, 11:12:40 PM PST
```

---

## 🟢 PRIORITY 4: Electronic Signature (Optional Enhancement)

### Recommended for Critical Actions:

#### 1. Add Password Confirmation Modal
```typescript
// For critical changes (destroy, terminate subject, etc.)
const ConfirmWithPassword = ({ action, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    
    const handleConfirm = async () => {
        // Verify current user's password
        const response = await api.post('/auth/verify-password', { password });
        if (response.data.valid) {
            onConfirm();
        } else {
            alert('Invalid password');
        }
    };
    
    return (
        <Modal>
            <h3>Confirm {action}</h3>
            <p>Enter your password to confirm this action:</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleConfirm}>Confirm</button>
            <button onClick={onCancel}>Cancel</button>
        </Modal>
    );
};
```

#### 2. Log Signature in Audit
```typescript
await logAudit({
    ...
    changes_json: {
        ...changes,
        electronic_signature: {
            signed_by: req.user.username,
            signed_at: new Date().toISOString(),
            password_verified: true
        }
    }
});
```

---

## 🟢 PRIORITY 5: IP Address Logging

### Backend Middleware
**File**: `backend/src/middleware/auth.middleware.ts`

```typescript
export const authenticateToken = (req, res, next) => {
    // ... existing auth code
    
    // Add IP to request object
    req.user.ip_address = req.ip || req.connection.remoteAddress;
    next();
};
```

### Use in Audit Logs
```typescript
await logAudit({
    ...
    ip_address: req.user.ip_address,  // ← Already implemented!
    user_agent: req.headers['user-agent']
});
```

---

## 🟢 PRIORITY 6: Record Context in Summary

### ChangesPage.tsx - Enhanced Display

```typescript
// In audit log expandable details:
{expandedRows.has(log.audit_id) && (
    <tr>
        <td colSpan={6} className="px-4 py-4 bg-gray-50">
            {/* Record Context */}
            <div className="mb-3 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-gray-700 mb-1">Record Context:</h4>
                <div className="text-sm text-gray-600">
                    {log.table_name === 'accountability' && (
                        <>
                            <div>Drug Unit: {log.changes_json?.new_values?.drug_unit_id || log.record_id}</div>
                            <div>Subject: {log.changes_json?.subject_number || 'N/A'}</div>
                            <div>Visit: {log.changes_json?.visit_name || 'N/A'}</div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Existing old/new values */}
            ...
        </td>
    </tr>
)}
```

---

## Implementation Priority Order:

1. **🔴 IMMEDIATE (Today)**: Add "Reason for Change" field to return modal & make required
2. **🔴 IMMEDIATE**: Add reason to edit dates modal
3. **🟡 THIS WEEK**: Add timezone to timestamp display
4. **🟡 THIS WEEK**: Improve action type labels/descriptions
5. **🟢 NEXT SPRINT**: Add electronic signature for critical actions
6. **🟢 NEXT SPRINT**: Enhanced record context display

---

## Testing Checklist:

- [ ] Return modal shows "Reason for Change *" label
- [ ] Return is blocked if reason is empty or < 10 characters
- [ ] Reason appears in audit trail details
- [ ] Edit dates modal has reason field
- [ ] Timestamps show timezone (e.g., "PST")
- [ ] Audit export CSV includes reason field

---

## Database Schema Status:

✅ **Already In Place:**
- `audit_log.changes_json` can store `reason_for_change`
- `audit_log.ip_address` column exists
- `audit_log.user_agent` column exists

❌ **No Schema Changes Needed!**
All fields already exist, just need to populate them from UI.

---

**Total Estimated Time**: 2-3 hours for Priority 1-3 fixes
