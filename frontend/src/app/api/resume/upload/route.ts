import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Get authentication token from request headers
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

    // 2. Read Supabase env configurations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if Supabase is fully configured with actual keys
    const hasSupabase = 
      supabaseUrl && 
      supabaseAnonKey && 
      supabaseServiceKey && 
      !supabaseUrl.includes('your-supabase-project');

    let user = null;

    // 3. Authenticate User (Support both real Supabase sessions and sandbox mock tokens)
    const isMockUser = !token || token.startsWith('mock_') || token === 'undefined' || token === 'null';
    if (isMockUser) {
      user = { id: '00000000-0000-0000-0000-000000000001', email: 'sandbox_user@jobfinder.pk' };
    } else {
      if (!hasSupabase) {
        return NextResponse.json({ error: 'Supabase credentials are required for live tokens' }, { status: 500 });
      }
      
      const supabaseUserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: authHeader || '' } }
      });

      const { data: { user: dbUser }, error: authError } = await supabaseUserClient.auth.getUser(token);
      if (authError || !dbUser) {
        return NextResponse.json({ error: 'Invalid or expired authentication session' }, { status: 401 });
      }
      user = dbUser;
    }

    // 4. Parse request file payload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid format. Only PDF files are supported.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    // Check magic bytes for %PDF (first 4 bytes should be: 25 50 44 46)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const headerString = Array.from(bytes).map(byte => byte.toString(16)).join('');
    if (headerString !== '25504446') {
      return NextResponse.json({ error: 'Uploaded file is not a valid PDF document.' }, { status: 400 });
    }

    // 5. Call Python FastAPI parsing service
    const parserUrl = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8000';
    const parserToken = process.env.PARSER_API_TOKEN;

    const parserFormData = new FormData();
    const fileBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    parserFormData.append('file', fileBlob, file.name);

    const headers: Record<string, string> = {};
    if (parserToken) {
      headers['X-API-Token'] = parserToken;
    }

    let parsedResult;
    try {
      const parserResponse = await fetch(`${parserUrl}/api/v1/parse`, {
        method: 'POST',
        headers,
        body: parserFormData
      });

      if (!parserResponse.ok) {
        const errorText = await parserResponse.text();
        throw new Error(errorText || `Parser returned status ${parserResponse.status}`);
      }

      parsedResult = await parserResponse.json();
    } catch (parserError: any) {
      return NextResponse.json({ error: `Parsing service failed: ${parserError.message}` }, { status: 502 });
    }

    // 6. Database Synchronization (Skipped gracefully if Supabase is offline/unconfigured or user is mock)
    if (hasSupabase && !isMockUser) {
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
      const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;

      // Upload PDF file to private resumes bucket
      const { data: storageData, error: storageError } = await supabaseAdmin.storage
        .from('resumes')
        .upload(fileName, arrayBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (!storageError && storageData) {
        // Save resume database record
        await supabaseAdmin
          .from('resumes')
          .insert({
            user_id: user.id,
            file_path: storageData.path,
            extracted_text: parsedResult.extracted_text
          });

        // Insert/map skills
        const skillsToLink = parsedResult.extracted_skills || [];
        for (const skill of skillsToLink) {
          const { data: skillData } = await supabaseAdmin
            .from('skills')
            .select('id')
            .ilike('name', skill.name)
            .maybeSingle();

          let skillId = skillData?.id;

          if (!skillId) {
            const { data: newSkill } = await supabaseAdmin
              .from('skills')
              .insert({ name: skill.name, category: skill.category })
              .select('id')
              .maybeSingle();
            skillId = newSkill?.id;
          }

          if (skillId) {
            await supabaseAdmin
              .from('user_skills')
              .insert({ user_id: user.id, skill_id: skillId });
          }
        }
      }
    }

    // 7. Return extracted details back to the client onboarding tag panel
    return NextResponse.json({
      status: 'success',
      message: hasSupabase 
        ? 'Resume parsed and database updated successfully' 
        : 'Resume parsed successfully (Sandbox Mode, database skipped)',
      extracted_skills: parsedResult.extracted_skills || [],
      sections: parsedResult.sections
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
