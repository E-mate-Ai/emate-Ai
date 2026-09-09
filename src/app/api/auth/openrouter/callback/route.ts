import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateVerifier = request.nextUrl.searchParams.get("state");
  const cookieVerifier = request.cookies.get("openrouter_verifier")?.value;

  const verifier = cookieVerifier || stateVerifier;

  if (!code || !verifier) {
    return NextResponse.json(
      { error: "Missing authorization code or PKCE verifier." },
      { status: 400 }
    );
  }

  try {
    const tokenRes = await fetch("https://openrouter.ai/api/v1/auth/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        code_challenge_method: "S256",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.key) {
      throw new Error(tokenData?.error?.message || "Failed to exchange key");
    }

    const apiKey = tokenData.key;

    const lastPage = request.cookies.get('last_visited_page')?.value
      ? decodeURIComponent(request.cookies.get('last_visited_page')?.value)
      : '/ai-topper-chat';

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <script>
            try {
              localStorage.setItem("user_openrouter_key", "${apiKey}");
              document.cookie = "user_openrouter_key=${apiKey}; path=/; max-age=2592000; SameSite=Lax; Secure";

              if (window.opener) {
                window.opener.postMessage({ type: "OPENROUTER_AUTH_SUCCESS", key: "${apiKey}" }, "*");
                window.close();
              } else {
                window.location.href = "${lastPage}";
              }
            } catch (e) {
              window.location.href = "${lastPage}";
            }
          </script>
        </body>
      </html>
    `;

    const response = new NextResponse(htmlResponse, {
      headers: { "Content-Type": "text/html" },
    });

    response.cookies.set("user_openrouter_key", apiKey, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.delete("openrouter_verifier");

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to exchange key" },
      { status: 500 }
    );
  }
}
