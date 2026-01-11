# Cloud Storage Setup Guide

This guide explains how to set up cloud storage for file uploads in CareOS profile sharing feature.

## Overview

The profile sharing feature supports three storage providers:
1. **AWS S3** (Recommended for production)
2. **Cloudinary** (Good for image optimization)
3. **Local Storage** (Development only - not recommended for production)

## Storage Providers

### AWS S3

**Pros:**
- Highly scalable and reliable
- Cost-effective for large files
- Global CDN support
- Fine-grained access control

**Setup:**

1. Create an AWS S3 bucket:
   ```bash
   aws s3 mb s3://careos-profile-files --region us-east-1
   ```

2. Configure bucket CORS (if needed):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://careos.app"],
       "ExposeHeaders": []
     }
   ]
   ```

3. Create IAM user with S3 access:
   - Policy: `AmazonS3FullAccess` or custom policy for your bucket
   - Generate access keys

4. Set environment variables:
   ```env
   STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=careos-profile-files
   AWS_S3_ACL=private  # or 'public-read' for public files
   AWS_S3_CDN_URL=https://d1234567890.cloudfront.net  # Optional CDN URL
   ```

### Cloudinary

**Pros:**
- Automatic image optimization
- Transformation APIs
- Video support
- Easy integration

**Setup:**

1. Sign up at [cloudinary.com](https://cloudinary.com)

2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret

3. Set environment variables:
   ```env
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Local Storage (Development)

**Pros:**
- No setup required
- Good for development

**Cons:**
- Not scalable
- Files lost on deployment
- No CDN

**Setup:**

Just don't set `STORAGE_PROVIDER` or set it to `local`:
```env
STORAGE_PROVIDER=local
# or omit entirely
```

Files will be stored in `public/uploads/profile-files/`

## File Size Limits

Configure the maximum file size:

```env
MAX_FILE_SIZE_MB=10  # Default: 10MB
```

This limit applies to all uploads. You can adjust based on your needs:
- 5MB for images
- 10MB for documents
- 25MB for medical files

## Rate Limiting

File uploads are rate-limited to prevent abuse:

- **Per user**: 10 uploads per minute
- **Per share**: 50 uploads per hour

These limits can be adjusted in `lib/rate-limit.ts`:

```typescript
fileUpload: {
  interval: 60, // 1 minute
  limit: 10, // 10 uploads per minute
},
```

## Monitoring

Access patterns and upload metrics are automatically tracked:

### Metrics Tracked:
- Upload success/failure rates
- Upload duration
- File sizes and types
- Storage provider used
- Access patterns (views, downloads, uploads)

### View Analytics:

```bash
GET /api/profile/{token}/analytics
```

Requires authentication (profile owner only).

### Logs:

All upload metrics are logged to console:
```
[FILE_UPLOAD_METRICS] {
  shareId: "...",
  userId: "...",
  fileSize: 1234567,
  fileType: "image",
  provider: "s3",
  uploadDuration: 234,
  success: true
}
```

In production, integrate with:
- **DataDog**: Set `MONITORING_SERVICE=datadog`
- **New Relic**: Send metrics via their API
- **Sentry**: For error tracking
- **Custom monitoring**: Extend `lib/file-upload-monitoring.ts`

## Security

### File Validation:
- File type validation (images, PDFs, documents only)
- File size limits
- MIME type checking
- Filename sanitization

### Access Control:
- Only invited users can upload
- Medical professionals only (if view-only enabled)
- Rate limiting prevents abuse

### Privacy:
- Files can be marked private (medical team only)
- IP addresses logged for security
- Complete audit trail

## Environment Variables Summary

```env
# Storage Provider
STORAGE_PROVIDER=s3|cloudinary|local

# AWS S3 (if using S3)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=careos-profile-files
AWS_S3_ACL=private
AWS_S3_CDN_URL=https://cdn.example.com  # Optional

# Cloudinary (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File Limits
MAX_FILE_SIZE_MB=10

# Monitoring (optional)
MONITORING_SERVICE=datadog|newrelic|sentry
```

## Testing

Test file uploads:

```bash
# Upload a file
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "description=Test file" \
  -F "category=lab_result" \
  https://careos.app/api/profile/{token}/files
```

## Production Checklist

- [ ] Set up cloud storage (S3 or Cloudinary)
- [ ] Configure environment variables
- [ ] Set appropriate file size limits
- [ ] Configure CORS (if using S3)
- [ ] Set up monitoring service
- [ ] Enable rate limiting
- [ ] Test file uploads
- [ ] Set up file cleanup policy (delete old files)
- [ ] Configure CDN (optional but recommended)
- [ ] Set up backup strategy
- [ ] Document storage costs

## Cost Considerations

### AWS S3:
- Storage: ~$0.023 per GB/month
- PUT requests: ~$0.005 per 1,000 requests
- GET requests: ~$0.0004 per 1,000 requests
- Data transfer: ~$0.09 per GB (first 10TB)

### Cloudinary:
- Free tier: 25GB storage, 25GB bandwidth
- Paid: Starts at $89/month for 50GB storage, 50GB bandwidth

### Local Storage:
- Free but not recommended for production

## Troubleshooting

### Upload Fails:
1. Check storage provider credentials
2. Verify file size is within limits
3. Check rate limiting (429 errors)
4. Review server logs

### Files Not Accessible:
1. Check CORS configuration (S3)
2. Verify ACL settings (S3)
3. Check file URL format
4. Verify CDN configuration (if using)

### Slow Uploads:
1. Check file size
2. Monitor network connection
3. Consider using CDN
4. Optimize images before upload (client-side)

## Support

For issues or questions:
1. Check server logs
2. Review monitoring metrics
3. Test with different file types/sizes
4. Verify storage provider status

