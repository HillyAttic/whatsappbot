# Multi-Phone Document Retrieval Fix

## Problem

The Instyle client has two phone numbers:
- `918595262661`
- `919318381275`

Documents were uploaded and associated with `phones[0]` (first phone number), but when a user messages from their second phone number, the system couldn't retrieve their documents.

## Root Cause

### Before the Fix:

1. **Document Upload**: Documents stored with `phone: phones[0]` only
2. **Document Retrieval**: Queried by incoming phone number
3. **Issue**: If user messages from `919318381275` but documents stored with `918595262661`, query returns no results

### The Flow:

```
User messages from: 919318381275
↓
System queries: documents.where('phone', '==', '919318381275')
↓
Documents stored with: phone: '918595262661'
↓
Result: No documents found ❌
```

## Solution Implemented

Updated document retrieval functions to:
1. First lookup the user by incoming phone number
2. Get all phone numbers associated with that user
3. Query documents for ALL phone numbers
4. Combine and deduplicate results

### Files Changed:

1. **`lib/document-service.ts`**
   - `getDocuments()` - Now queries all user phone numbers
   - `getFilteredDocuments()` - Now queries all user phone numbers

2. **`app/api/admin/clients/[id]/documents/route.ts`**
   - GET endpoint - Now retrieves documents for all client phone numbers

## How It Works Now

```
User messages from: 919318381275
↓
findUser('919318381275') → User with phones: ['918595262661', '919318381275']
↓
Query documents for BOTH phone numbers in parallel
↓
Combine results and deduplicate by document ID
↓
Result: All documents found ✅
```

## Testing the Fix

### Manual Testing Steps:

1. **Verify Instyle client data**:
   - Open admin panel
   - Find Instyle client
   - Confirm phones array contains both: `918595262661` and `919318381275`

2. **Test document retrieval in admin panel**:
   - Click on Instyle client
   - View documents tab
   - Should see all uploaded documents regardless of which phone they were uploaded with

3. **Test via WhatsApp**:
   - Send message from `918595262661` → Should retrieve documents
   - Send message from `919318381275` → Should retrieve documents
   - Both should return the same document list

### Expected Behavior:

- ✅ Documents uploaded with any phone number are accessible from all phone numbers
- ✅ No duplicate documents in results
- ✅ Documents sorted by upload date (newest first)
- ✅ Works for clients with 1-5 phone numbers

## Performance Considerations

- **Multiple Queries**: System now makes N queries (where N = number of phone numbers)
- **Optimization**: Queries run in parallel using `Promise.all()`
- **Caching**: User lookup is cached (5-minute TTL) to reduce database hits
- **Typical Case**: Most clients have 1-2 phone numbers, so 1-2 parallel queries

## Migration Notes

**No data migration required!** 

- Existing documents remain unchanged
- Old documents stored with single phone number still work
- New multi-phone retrieval logic is backward compatible
- Works with both old format (`phone` field) and new format (`phones` array)

## Verification Checklist

- [x] Updated `getDocuments()` to query all user phone numbers
- [x] Updated `getFilteredDocuments()` to query all user phone numbers  
- [x] Updated admin API GET endpoint to query all client phone numbers
- [x] Deduplication logic prevents duplicate documents
- [x] Results sorted by upload date
- [x] Backward compatible with single phone number clients
- [ ] Manual testing with Instyle client (user to verify)
- [ ] WhatsApp bot testing from both phone numbers (user to verify)

## Related Changes

This fix complements the recent phone validation changes:
- Phone numbers now accept "91XXXXXXXXXX" format (without "+")
- Auto-formatting strips "+" and adds "91" prefix
- All phone normalization uses `normalizePhone()` which strips non-numeric characters
