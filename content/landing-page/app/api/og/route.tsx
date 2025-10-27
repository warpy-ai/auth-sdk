import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "@warpy-auth-sdk/core";
  const description =
    searchParams.get("description") ||
    "Modern Authentication SDK for Node.js and React with AI Agent Integration";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
            maxWidth: "1000px",
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              🔐
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              color: "transparent",
              textAlign: "center",
              marginBottom: "24px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "28px",
              color: "#a0a0a0",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: "800px",
            }}
          >
            {description}
          </div>

          {/* Bottom Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "60px",
              padding: "16px 32px",
              backgroundColor: "rgba(102, 126, 234, 0.1)",
              borderRadius: "50px",
              border: "2px solid rgba(102, 126, 234, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                color: "#667eea",
                fontWeight: "600",
              }}
            >
              OAuth • Magic Links • MCP • 2FA
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
