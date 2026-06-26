import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
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

    // 3. Authenticate User (Support both real Supabase sessions and sandbox mock tokens)
    const isMockUser = !token || token.startsWith('mock_') || token === 'undefined' || token === 'null';
    
    if (isMockUser || !hasSupabase) {
      // In sandbox mode, return jobs as null to trigger Next.js client-side sandbox matching calculations
      return NextResponse.json({
        status: 'success',
        message: 'Sandbox Mode active. Gracefully falling back to client-side matching.',
        jobs: null
      });
    }

    // 4. Authenticate real user session
    const supabaseUserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired authentication session' }, { status: 401 });
    }

    // 5. Query recommendation engine (PL/pgSQL database function)
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Call the custom PL/pgSQL function: get_job_recommendations(usr_id, min_score, limit_num, offset_num)
    const { data: dbJobs, error: rpcError } = await supabaseAdmin.rpc('get_job_recommendations', {
      usr_id: user.id,
      min_score: 20, // Request lower threshold (20%) to show more matched jobs as per user request #6
      limit_num: 50,
      offset_num: 0
    });

    if (rpcError) {
      console.error('Recommendations RPC error:', rpcError.message);
      // Fail gracefully to client-side matching
      return NextResponse.json({
        status: 'warning',
        message: `Recommendation engine RPC failed: ${rpcError.message}. Falling back to sandbox mode.`,
        jobs: null
      });
    }

    // 6. Map database results to frontend job structure
    const jobs = (dbJobs || []).map((j: any) => ({
      id: j.job_id,
      title: j.title,
      company: j.company,
      location: j.location,
      is_remote: j.is_remote,
      salary: j.salary || 'Salary not disclosed',
      url: j.url,
      match_score: j.match_score,
      match_explanation: j.match_explanation || `Matched ${j.match_score}% of criteria.`,
      missing_skills: j.missing_skills || [],
      posted_at: j.posted_at
    }));

    return NextResponse.json({
      status: 'success',
      jobs: jobs
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
