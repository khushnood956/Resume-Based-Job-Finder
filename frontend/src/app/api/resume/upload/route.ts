import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Get authentication token from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Initialize Supabase variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase environment variables are not configured' }, { status: 500 });
    }

    // Connect using user token to verify session
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired authentication session' }, { status: 401 });
    }

    // 3. Parse request payload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate type and size
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

    // 4. Upload file to Supabase private storage bucket "resumes"
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;

    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(fileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) {
      return NextResponse.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 });
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
      // Clean up uploaded file if parsing fails to avoid orphaned storage files
      await supabaseAdmin.storage.from('resumes').remove([fileName]);
      return NextResponse.json({ error: `Parsing service failed: ${parserError.message}` }, { status: 502 });
    }

    // 6. Write parsed results to Supabase (resumes and user_skills tables)
    const { error: resumeDbError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: user.id,
        file_path: storageData.path,
        extracted_text: parsedResult.extracted_text
      });

    if (resumeDbError) {
      return NextResponse.json({ error: `Database write failed: ${resumeDbError.message}` }, { status: 500 });
    }

    // Write skills to public.skills and public.user_skills
    const skillsToLink = parsedResult.extracted_skills || [];
    const matchedSkills = [];

    for (const skill of skillsToLink) {
      const { data: skillData } = await supabaseAdmin
        .from('skills')
        .select('id, name')
        .ilike('name', skill.name)
        .maybeSingle();

      let skillId = skillData?.id;

      if (!skillId) {
        const { data: newSkill, error: newSkillError } = await supabaseAdmin
          .from('skills')
          .insert({ name: skill.name, category: skill.category })
          .select('id')
          .maybeSingle();

        if (!newSkillError && newSkill) {
          skillId = newSkill.id;
        } else {
          // If insert fails due to unique index race condition, fetch it again
          const { data: refetchData } = await supabaseAdmin
            .from('skills')
            .select('id')
            .ilike('name', skill.name)
            .maybeSingle();
          skillId = refetchData?.id;
        }
      }

      if (skillId) {
        // Map skill to user profile
        await supabaseAdmin
          .from('user_skills')
          .insert({ user_id: user.id, skill_id: skillId })
          .select();
        
        matchedSkills.push(skill);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Resume parsed and profile updated successfully',
      file_path: storageData.path,
      extracted_skills: matchedSkills,
      sections: parsedResult.sections
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
