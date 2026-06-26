# Security Specifications

Security is a primary design concern, especially when dealing with personal candidate resumes and public-facing endpoints.

---

## 1. Supabase Row-Level Security (RLS) Policies

Every user table requires strict constraints. Without an explicit policy, tables are closed to client operations.

```sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Resumes Policies
CREATE POLICY "Users can view own resumes" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own resume" ON resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume" ON resumes
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Bookmarks Policies
CREATE POLICY "Users can CRUD own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- 4. Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
```

---

## 2. API Route & Cron Protection

### Cron Endpoint Authentication
The `/api/cron/jobs` endpoint runs heavy workflows. It must be protected to prevent Denial of Service (DoS) attacks.
* The Next.js API route checks for a secret token inside the request headers:
  ```typescript
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  ```
* This key is stored in GitHub Secrets and parsed during workflow trigger.

### Parser Service Token
The FastAPI parsing service uses a shared API token (`PARSER_API_TOKEN`) passed in request headers:
```python
# services/resume-parser/main.py
@app.middleware("http")
async def verify_token(request: Request, call_next):
    token = request.headers.get("X-API-Token")
    if token != os.getenv("API_TOKEN"):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)
```

---

## 3. Upload File Validation (PDF Safeguards)

To prevent malicious uploads (large files, buffer overflow exploits):
1. **Size Checking**: Next.js server limits size to 5MB before sending it to Supabase or the Parser.
2. **MIME Verification**: Validate the `Content-Type` is strictly `application/pdf`.
3. **Magic Byte Verification**: Check first 4 bytes of file stream for `%PDF` to verify it is a valid PDF and not a renamed malicious executable.
4. **PyMuPDF Extraction**: Handled within a try/except sandbox in the Python service. If the document is corrupted or contains malware code, PyMuPDF fails gracefully without executing raw scripts.
