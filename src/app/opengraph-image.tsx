import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at top left, rgba(56,189,248,0.26), transparent 30%), radial-gradient(circle at top right, rgba(167,139,250,0.18), transparent 26%), #07090d",
          color: "#f4f7fb",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          AI Native Personal Studio
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 84, fontWeight: 700 }}>CHEN AI STUDIO</div>
          <div style={{ fontSize: 32, color: "#93ddff" }}>
            用 AI、代码与视觉持续构建
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#9ca3af",
            fontSize: 24,
          }}
        >
          <span>AI Lab · Build Log · Prompt Library · Projects</span>
          <span>chen-ai-studio.local</span>
        </div>
      </div>
    ),
    size,
  );
}
