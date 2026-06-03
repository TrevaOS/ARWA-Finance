import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only the Treva super-admin anon call is allowed — verify via a shared secret
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('FUNCTION_SECRET');
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, role, memberId } = await req.json();
    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role key to bypass email confirmation
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create auth user (email_confirm = true skips confirmation email)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) throw authErr;

    const uid = authData.user.id;

    // Insert profile row
    const { error: dbErr } = await admin.from('users').insert({
      id:        uid,
      name,
      email,
      role,
      member_id: memberId || null,
    });
    if (dbErr) {
      // Rollback: delete the auth user we just created
      await admin.auth.admin.deleteUser(uid);
      throw dbErr;
    }

    return new Response(JSON.stringify({ ok: true, id: uid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
