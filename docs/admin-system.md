# Admin System Documentation

## Overview

The admin system provides comprehensive error logging, user analytics, and administrative controls for the DueNorth application. It follows the established architecture pattern: **page → component → hook → route → interface → service → db**.

## Features

### 🔐 Admin Authentication
- Secret admin promotion page at `/admin/auth`
- Users can promote themselves to admin with their credentials + admin password
- Secure role-based access control (RBAC)
- Admin status persists across sessions

### 📊 Error Logging
- Structured error logging with contextual information
- Automatic error capture from API routes and client-side errors
- Error grouping and filtering by level, user, and time
- Error resolution tracking with admin actions

### 📈 Analytics & Metrics
- Real-time user activity tracking
- System health monitoring
- Usage analytics with time-range filtering
- Page view and API call tracking

### 👥 User Management
- View all users with detailed information
- Promote/demote admin access
- User data purging capabilities
- Admin action audit logging

### 🛡️ Security Features
- XSS protection with input sanitization
- CSRF protection
- Rate limiting (general and admin-specific)
- Content Security Policy (CSP) headers
- Origin validation

## Setup Instructions

### 1. Database Migration

The database schema has been updated with new tables for admin functionality:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### 2. Admin Password Setup

Generate an admin password hash:

```bash
npx tsx scripts/setup-admin.ts
```

Add the generated hash to your environment variables:

```bash
# .env.local (development)
ADMIN_PASSWORD_HASH="your_generated_hash_here"

# Production
# Set ADMIN_PASSWORD_HASH in your hosting platform
```

### 3. Optional: Rate Limiting Setup

For production rate limiting, configure Upstash Redis:

```bash
# Environment variables
UPSTASH_REDIS_REST_URL="your_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"
```

## Usage

### Becoming an Admin

1. Navigate to `/admin/auth` (this is the secret page)
2. Enter your existing email and password
3. Enter the admin password
4. Click "Gain Admin Access"
5. You'll be redirected to the admin dashboard

### Admin Dashboard

Access the admin dashboard at `/admin` after becoming an admin. The dashboard includes:

- **Overview**: System health, recent errors, key metrics
- **Error Logs**: Detailed error tracking with resolution capabilities
- **Users**: User management and admin controls
- **Analytics**: Usage metrics and system analytics

### Navigation

Admin users will see an "Admin Panel" link in the sidebar navigation.

## API Endpoints

### Admin Authentication
- `POST /api/admin/auth/promote` - Promote user to admin

### Error Management
- `GET /api/admin/errors` - List error logs with filtering
- `POST /api/admin/errors` - Resolve error logs

### Analytics
- `GET /api/admin/analytics` - Get analytics data

### User Management
- `GET /api/admin/users` - List users
- `GET /api/admin/status` - Check admin status

## Database Schema

### New Tables

#### ErrorLog
```sql
- id: String (Primary Key)
- level: String (ERROR, WARN, INFO, DEBUG)
- message: String
- stack: String? (Stack trace)
- context: Json? (Additional context)
- endpoint: String? (API endpoint)
- method: String? (HTTP method)
- userAgent: String?
- ip: String?
- userId: String? (Foreign Key)
- sessionId: String?
- timestamp: DateTime
- resolved: Boolean
- resolvedAt: DateTime?
- resolvedBy: String?
```

#### Analytics
```sql
- id: String (Primary Key)
- event: String (Event type)
- data: Json? (Event data)
- userId: String?
- sessionId: String?
- ip: String?
- userAgent: String?
- timestamp: DateTime
```

#### AdminAction
```sql
- id: String (Primary Key)
- action: String (Action type)
- targetId: String? (Target resource ID)
- targetType: String? (Target resource type)
- data: Json? (Action data)
- adminId: String (Foreign Key)
- timestamp: DateTime
```

#### User (Updated)
```sql
- isAdmin: Boolean (Added field)
```

## Security Considerations

### Input Sanitization
All user inputs are sanitized to prevent XSS attacks:
- HTML content is sanitized using DOMPurify
- String inputs are cleaned of dangerous characters
- Object properties are recursively sanitized

### Rate Limiting
- General API calls: 10 requests per 10 seconds
- Admin operations: 5 requests per 60 seconds
- IP-based rate limiting

### CSRF Protection
- Origin validation for non-GET requests
- CSRF token validation for sensitive operations

### Content Security Policy
Strict CSP headers are applied:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- `style-src 'self' 'unsafe-inline'`
- And more...

### Admin Access Control
- Admin routes require authentication
- Admin operations verify admin status
- Audit logging for all admin actions
- Prevention of self-demotion and self-deletion

## Monitoring & Maintenance

### Error Log Cleanup
```typescript
// Clean up old error logs (default: 30 days)
await errorLogInterface.cleanupOldErrors(adminUserId, 30);
```

### Analytics Cleanup
```typescript
// Clean up old analytics (default: 90 days)
await analyticsInterface.cleanupOldAnalytics(adminUserId, 90);
```

### System Health Monitoring
The admin dashboard provides real-time system health indicators:
- Database connection status
- API response times
- Error rates
- Active user counts

## Development vs Production

### Development
- Error logging works in development mode
- Admin functionality is fully available
- Rate limiting may be disabled if Redis is not configured

### Production
- All security features are enabled
- Rate limiting is active with Redis
- Error logging captures production issues
- Analytics track real user behavior

## Troubleshooting

### Common Issues

1. **Admin password not working**
   - Ensure `ADMIN_PASSWORD_HASH` is set correctly
   - Regenerate the hash using the setup script

2. **Rate limiting errors**
   - Check Redis configuration
   - Verify environment variables

3. **Error logs not appearing**
   - Check database connection
   - Verify error logging service is initialized

4. **Admin panel not visible**
   - Confirm user has admin status in database
   - Check session authentication

### Debugging

Enable debug logging by setting:
```bash
NODE_ENV=development
```

Check the browser console and server logs for detailed error information.

## Future Enhancements

Potential improvements for the admin system:
- Email notifications for critical errors
- Automated error categorization
- Advanced analytics dashboards
- Bulk user operations
- Export functionality for logs and analytics
- Role-based permissions (beyond just admin/user)
