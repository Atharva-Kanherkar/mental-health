# Dual-Bucket Security Architecture Guide

## Overview

This application now implements a dual-bucket architecture that provides maximum security isolation between zero-knowledge encrypted files and server-managed files that can be processed by AI/LLM features.

## Security Architecture

### Physical Bucket Separation

1. **Zero-Knowledge Bucket** (`DO_SPACES_ZK_BUCKET`)
   - Stores client-side encrypted files
   - Server cannot decrypt contents
   - Restricted access key (PUT/DELETE only)
   - Files are AES-256-CBC encrypted before upload

2. **Server-Managed Bucket** (`DO_SPACES_SM_BUCKET`)
   - Stores unencrypted files for AI processing
   - Server has full access (GET/PUT/DELETE)
   - Enables LLM walkthrough features
   - Files are stored in original format

### Access Control Layer

The application enforces security at multiple levels:

#### 1. Environment Configuration
```bash
# Zero-Knowledge Bucket (Minimal permissions)
DO_SPACES_ZK_BUCKET=your-app-zero-knowledge
DO_SPACES_ZK_KEY=restricted_key_here     # Only PutObject, DeleteObject
DO_SPACES_ZK_SECRET=restricted_secret_here

# Server-Managed Bucket (Full permissions)
DO_SPACES_SM_BUCKET=your-app-server-managed  
DO_SPACES_SM_KEY=full_access_key_here    # GetObject, PutObject, DeleteObject
DO_SPACES_SM_SECRET=full_access_secret_here
```

#### 2. Code-Level Isolation
```typescript
// storage.ts - Bucket routing based on privacy level
export function getS3Client(privacyLevel: PrivacyLevel): AWS.S3 {
  return privacyLevel === 'zero_knowledge' ? s3ZeroKnowledge : s3ServerManaged;
}

export function getBucketName(privacyLevel: PrivacyLevel): string {
  return privacyLevel === 'zero_knowledge' 
    ? SPACES_CONFIG.zeroKnowledgeBucket 
    : SPACES_CONFIG.serverManagedBucket;
}
```

#### 3. Database Constraints
```sql
-- Privacy level is enforced at the data layer
ALTER TABLE "Memory" ADD COLUMN "privacyLevel" TEXT NOT NULL DEFAULT 'server_managed';

-- Encryption metadata only stored for zero-knowledge files
encryptionIV: privacyLevel === 'zero_knowledge' ? iv : null,
encryptionAuthTag: privacyLevel === 'zero_knowledge' ? authTag : null,
isEncrypted: privacyLevel === 'zero_knowledge'
```

## Security Verification Tests

### Test 1: Bucket Isolation Verification

**Objective**: Verify that zero-knowledge files cannot be accessed by server-managed credentials and vice versa.

**Steps**:
1. Create a zero-knowledge memory with file upload
2. Try to access the file using server-managed S3 credentials
3. Verify access is denied (403 Forbidden)
4. Repeat test in reverse (server-managed file with zero-knowledge credentials)

**Expected Result**: Cross-bucket access should fail with authorization errors.

### Test 2: Encryption Key Isolation

**Objective**: Confirm that encryption keys never leave the client.

**Steps**:
1. Monitor network traffic during zero-knowledge file upload
2. Verify that user password is never transmitted
3. Confirm only encrypted blob is sent to server
4. Check server logs to ensure no encryption keys are logged

**Expected Result**: No sensitive cryptographic material should be transmitted to server.

### Test 3: Server Processing Limitation

**Objective**: Verify server cannot process zero-knowledge files for AI features.

**Steps**:
1. Upload identical content as both privacy levels
2. Attempt to trigger AI processing on both
3. Verify server-managed file can be processed
4. Verify zero-knowledge file processing fails gracefully

**Expected Result**: AI features should only work with server-managed files.

### Test 4: Client-Side Decryption Verification

**Objective**: Confirm decryption happens entirely on client.

**Steps**:
1. Upload zero-knowledge file
2. Monitor browser DevTools during file viewing
3. Verify decryption happens in browser
4. Check that decrypted content never touches server

**Expected Result**: All decryption operations should occur in browser memory.

### Test 5: Access Key Permission Validation

**Objective**: Ensure access keys have minimal required permissions.

**Steps**:
1. Try to perform GetObject on zero-knowledge bucket with ZK credentials
2. Verify operation fails (should only have PUT/DELETE)
3. Try to perform operations on server-managed bucket with SM credentials
4. Verify full access works as expected

**Expected Result**: Zero-knowledge key should reject GET operations.

## Manual Security Testing

### Testing Zero-Knowledge Privacy

```bash
# 1. Try to access zero-knowledge file directly with server credentials
aws s3api get-object \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --bucket your-app-zero-knowledge \
  --key user/USER_ID/image/TIMESTAMP_RANDOM.jpg \
  --region nyc3 \
  downloaded-file.jpg

# Expected: Access Denied (403)
```

### Testing Bucket Separation

```bash
# 2. List objects in each bucket with wrong credentials
aws s3api list-objects-v2 \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --bucket your-app-zero-knowledge \
  --region nyc3

# With server-managed credentials: Should fail
# With zero-knowledge credentials: Should succeed
```

### Testing Encryption Verification

```javascript
// 3. Browser console test during file upload
// Monitor for any encryption keys in network requests
console.log('Monitoring network for encryption keys...');

// Look for these patterns in requests (should NOT appear):
// - User passwords
// - Derived encryption keys  
// - Unencrypted file contents
// - IV/AuthTag values in zero-knowledge uploads
```

## Deployment Checklist

### Infrastructure Setup
- [ ] Create two separate DigitalOcean Spaces buckets
- [ ] Generate restricted access key for zero-knowledge bucket (PUT/DELETE only)
- [ ] Generate full access key for server-managed bucket
- [ ] Configure CORS policies for both buckets
- [ ] Set up proper IAM policies with minimal permissions

### Application Configuration
- [ ] Set all environment variables for dual-bucket setup
- [ ] Run database migration to add privacyLevel field
- [ ] Verify bucket routing logic in storage.ts
- [ ] Test privacy level selection in UI
- [ ] Validate encryption/decryption flows

### Security Validation
- [ ] Run all verification tests above
- [ ] Check server logs for any encryption key leaks
- [ ] Verify client-side encryption performance
- [ ] Test error handling for wrong privacy levels
- [ ] Confirm graceful degradation when AI features unavailable

### Monitoring Setup
- [ ] Set up alerts for cross-bucket access attempts
- [ ] Monitor for unusual file access patterns
- [ ] Track encryption/decryption success rates
- [ ] Alert on any server-side decryption attempts

## Security Best Practices

### For Zero-Knowledge Files
1. **Never** store decryption keys on server
2. **Always** encrypt files before transmission
3. **Use** strong, user-provided passwords
4. **Implement** proper key derivation (PBKDF2)
5. **Clean up** blob URLs to prevent memory leaks

### For Server-Managed Files
1. **Clearly** indicate reduced privacy to users
2. **Secure** server processing environment
3. **Limit** AI processing to necessary operations
4. **Log** all server-side file access
5. **Encrypt** files at rest using server-side encryption

### General Architecture
1. **Separate** infrastructure prevents accidental mixing
2. **Granular** IAM policies limit blast radius
3. **Code-level** routing ensures proper bucket selection
4. **UI indicators** make privacy levels clear to users
5. **Database constraints** enforce data integrity

## Compliance Notes

This architecture supports compliance with privacy regulations:

- **GDPR**: Zero-knowledge files provide data minimization
- **HIPAA**: Client-side encryption ensures data confidentiality  
- **SOC 2**: Physical separation demonstrates access controls
- **Zero Trust**: Never trust, always verify bucket selection

## Troubleshooting

### Common Issues

1. **Files not loading**: Check bucket CORS configuration
2. **Upload failures**: Verify access key permissions
3. **Decryption errors**: Confirm IV/AuthTag storage
4. **Performance issues**: Monitor client-side encryption overhead

### Debug Commands

```bash
# Check bucket accessibility
aws s3api head-bucket --bucket your-app-zero-knowledge --region nyc3

# Verify file encryption status
aws s3api head-object --bucket your-app-zero-knowledge --key file-key --region nyc3

# Test access key permissions
aws s3api get-bucket-policy --bucket your-app-zero-knowledge --region nyc3
```

This dual-bucket architecture provides true zero-knowledge privacy while maintaining the flexibility for AI-powered features when users choose the server-managed option.
