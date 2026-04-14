import { Box, Typography } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CursorSparkle from "../CursorSparkle";
import { authBackgroundSx, authCardSx } from "../../styles/authStyles";

function Blob({ sx }) {
  return (
    <Box
      sx={{
        position: "absolute",
        borderRadius: "50%",
        ...sx,
      }}
    />
  );
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  features,
  cardTitle,
  cardSubtitle,
  children,
}) {
  return (
    <>
      <CursorSparkle />
      <Box sx={authBackgroundSx}>
        <Blob
          sx={{
            width: 540,
            height: 540,
            background: "radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 72%)",
            top: -140,
            left: -120,
            animation: "flowdeskFloatOne 12s ease-in-out infinite alternate",
          }}
        />
        <Blob
          sx={{
            width: 420,
            height: 420,
            background: "radial-gradient(circle,rgba(56,189,248,0.14) 0%,transparent 72%)",
            right: "8%",
            bottom: -90,
            animation: "flowdeskFloatTwo 14s ease-in-out infinite alternate",
          }}
        />
        <Blob
          sx={{
            width: 340,
            height: 340,
            background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 72%)",
            top: "28%",
            right: -80,
            animation: "flowdeskFloatOne 10s ease-in-out infinite alternate",
          }}
        />
        <style>{`
          @keyframes flowdeskFloatOne {
            from { transform: translateY(0px) translateX(0px); }
            to { transform: translateY(36px) translateX(28px); }
          }
          @keyframes flowdeskFloatTwo {
            from { transform: translateY(0px) translateX(0px); }
            to { transform: translateY(-36px) translateX(-22px); }
          }
        `}</style>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 4, md: 8, xl: 12 },
            py: { xs: 6, md: 8 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 7 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "14px",
                background: "linear-gradient(135deg,#2563eb,#38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 24px rgba(37,99,235,0.3)",
              }}
            >
              <TrendingUpRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 24, color: "#1e3a8a" }}>
              FlowDesk
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#2563eb",
              mb: 2,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 36, md: 54 },
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.05,
              letterSpacing: "-1.4px",
              mb: 2.5,
              maxWidth: 620,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: "#52637b",
              fontSize: 17,
              lineHeight: 1.8,
              maxWidth: 520,
              mb: 5,
            }}
          >
            {subtitle}
          </Typography>

          <Box sx={{ display: "grid", gap: 1.5, maxWidth: 420 }}>
            {features.map((feature) => (
              <Box
                key={feature}
                sx={{
                  px: 2.25,
                  py: 1.4,
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.56)",
                  border: "1px solid rgba(148,163,184,0.16)",
                  color: "#334155",
                  fontWeight: 600,
                  boxShadow: "0 10px 24px rgba(148,163,184,0.08)",
                }}
              >
                {feature}
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: { xs: 3, md: 5 },
            py: { xs: 2, md: 8 },
          }}
        >
          <Box sx={authCardSx}>
            <Box sx={{ mb: 4.5 }}>
              <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#0f172a", mb: 0.8 }}>
                {cardTitle}
              </Typography>
              <Typography sx={{ fontSize: 15, color: "#7b8ba6" }}>
                {cardSubtitle}
              </Typography>
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}
