# FigTyp CMS System Documentation

## Overview

The FigTyp CMS (Content Management System) allows administrators to manage all website content through a centralized backend system. This includes timeline events, company information, hero sections, features, and more.

## Architecture

### Backend

- **Model**: `backend/models/CMSContent.js` - Defines the CMS content schema

- **Routes**: `backend/routes/cms.js` - API endpoints for CRUD operations, including docs-compatible `PATCH` updates
- **Integration**: Registered in `backend/index.js` at `/api/cms`
- **Supported Types**: `timeline`, `company_info`, `hero`, `features`, `founder`, `notice`, `contest_template`

### Frontend

- **Admin Panel**: `src/components/CMSAdmin.tsx` - Complete CMS management interface
- **Hook**: `src/utils/useCMSContent.ts` - React hook for fetching CMS content
- **Components**: AboutCompany, and others use dynamic CMS content

## Database Schema

```typescript
{
  contentType: string,        // 'timeline', 'company_info', 'hero', 'features', 'founder', 'notice', 'contest_template'
  key: string,                // Unique identifier (required, unique)
  title?: string,
  shortDescription?: string,  // Short preview text
  fullDescription?: string,   // Full detailed content
  date?: string,              // Date/time info
  color?: string,             // 'purple' | 'cyan' | 'emerald' | 'teal'
  data?: object,              // Flexible JSON for custom data
  order?: number,             // Sort order (default: 0)
  isActive?: boolean,         // Publishing status (default: true)
  createdBy?: ObjectId,       // Reference to User who created it
  updatedBy?: ObjectId,       // Reference to User who last updated it
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

- **GET** `/api/cms/type/:contentType` - Fetch all active content of a specific type
- **GET** `/api/cms/key/:key` - Fetch specific content by unique key

### Admin Endpoints (Requires SUPER_ADMIN Role)

- **GET** `/api/cms` - List all CMS content (admin only)
- **POST** `/api/cms` - Create new CMS content
- **PUT** `/api/cms/:id` - Update existing CMS content
- **PATCH** `/api/cms/:id` - Partial update existing CMS content (docs-compatible)
- **DELETE** `/api/cms/:id` - Delete CMS content

## Usage in Components

### Option 1: Using the Hook (Recommended)

```typescript
import { useCMSContent } from '@/utils/useCMSContent';

export default function MyComponent() {
  const { content, loading, error } = useCMSContent('timeline');
  
  return (
    <div>
      {loading ? <p>Loading...</p> : (
        content.map(item => (
          <div key={item._id}>
            <h3>{item.title}</h3>
            <p>{item.fullDescription}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Option 2: Fetching by Key

```typescript
import { getCMSContentByKey } from '@/utils/useCMSContent';

const heroContent = await getCMSContentByKey('hero_main');
```

### Option 3: Direct API Call

```typescript
const response = await fetch('/api/cms/type/timeline');
const timelineItems = await response.json();
```

## Admin Panel Features

### Access

- Navigate to `/admin/cms` (when added to routing)
- Only accessible to users with `SUPER_ADMIN` role
- Authentication via JWT token

### Features

1. **Content Type Filtering** - Switch between different content types
2. **Create** - Add new content items with full form validation
3. **Edit** - Modify existing content with pre-filled form
4. **Delete** - Remove content (with confirmation)
5. **Bulk Actions** - Manage multiple items
6. **Status Management** - Activate/deactivate content
7. **Sorting** - Reorder content by order field

### Form Fields

- **Content Type**: Select the content category
- **Key**: Unique identifier (immutable after creation)
- **Title**: Display name
- **Short Description**: Preview text
- **Full Description**: Detailed content
- **Date**: Date/time reference
- **Color**: Visual theme (purple, cyan, emerald, teal)
- **Order**: Sort priority
- **Active**: Publishing toggle

## Setup Instructions

### 1. Seed Initial Content

```bash
cd backend
node scripts/seedCMS.js
```

This will populate the database with default timeline, company, and hero content.

### 2. Add CMS Admin Route (in App.tsx)

```typescript
import CMSAdmin from '@/components/CMSAdmin';

// The admin dashboard already embeds the CMS editor under the Super Admin tab:
{isSuperAdmin && <CMSAdmin userToken={token} />}
```

### 3. Update Component Props

```typescript
// Before: Hardcoded content
const timelineItems = [...]

// After: CMS-driven content
const { content: timelineItems } = useCMSContent('timeline');
```

## Examples

### Creating Timeline Content via API

```bash
curl -X POST http://localhost:5000/api/cms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "contentType": "timeline",
    "key": "timeline_item_5",
    "title": "New Milestone",
    "shortDescription": "Short description",
    "fullDescription": "Full description",
    "date": "2026",
    "color": "purple",
    "order": 5,
    "isActive": true
  }'
```

### Updating Content

```bash
curl -X PUT http://localhost:5000/api/cms/CONTENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Updated Title",
    "isActive": true
  }'
```

## Best Practices

1. **Use Unique Keys**: Always use descriptive, unique keys for content retrieval
2. **Categorize Content**: Organize content by contentType for easy filtering
3. **Order Matters**: Use the order field to control display sequence
4. **Soft Deletes**: Use `isActive: false` instead of deletion to preserve history
5. **Content Versioning**: The `updatedAt` timestamp tracks changes
6. **Admin Access**: Always verify SUPER_ADMIN role before allowing modifications

## Migration Guide (Hardcoded to CMS)

### Before

```typescript
const timelineItems = [
  { title: 'Event 1', description: '...' },
  ...
];
```

### After

```typescript
const { content: timelineItems } = useCMSContent('timeline');
```

## Common Tasks

### Add New Content Type

1. Update `CMSContent.js` schema if needed
2. Extend contentType enum in schema
3. Add to admin panel dropdown
4. Create corresponding content in CMS

### Change Display Order

Update the `order` field:

```typescript

// API
PATCH /api/cms/:id { "order": 2 }
```

### Publish/Unpublish Content

Toggle `isActive`:

```typescript
// API
PATCH /api/cms/:id { "isActive": false }
```

### Backup Content

```bash
# Export collection
mongoexport --uri="mongodb://..." --collection=cmscontents --out=backup.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|

| Content not loading | Check `isActive: true` status |
| API 403 error | Verify user has SUPER_ADMIN role |
| Duplicate key error | Use unique key values |
| Content not appearing | Verify correct contentType value |

## Future Enhancements

- [ ] Rich text editor for descriptions
- [ ] Image/media upload support
- [ ] Content preview before publishing
- [ ] Scheduled publishing
- [ ] Content versioning/rollback
- [ ] Bulk import/export (CSV, JSON)
- [ ] Multi-language support
- [ ] Content collaboration features
- [ ] Audit logs
- [ ] A/B testing variants

## Support

For issues or questions:

1. Check this documentation
2. Review CMS API error responses
3. Check browser console for frontend errors
4. Review server logs: `backend/logs/`
