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
            width: 420,
            height: 420,
            background: "radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 72%)",
            top: -120,
            left: -100,
            animation: "flowdeskFloatOne 12s ease-in-out infinite alternate",
          }}
        />
        <Blob
          sx={{
            width: 320,
            height: 320,
            background: "radial-gradient(circle,rgba(56,189,248,0.10) 0%,transparent 72%)",
            right: "6%",
            bottom: -70,
            animation: "flowdeskFloatTwo 14s ease-in-out infinite alternate",
          }}
        />
        <style>{`
          @keyframes flowdeskFloatOne {
            from { transform: translateY(0px) translateX(0px); }
            to { transform: translateY(28px) translateX(20px); }
          }
          @keyframes flowdeskFloatTwo {
            from { transform: translateY(0px) translateX(0px); }
            to { transform: translateY(-28px) translateX(-18px); }
          }
        `}</style>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1100,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.05fr) minmax(360px, 0.95fr)" },
            gap: { xs: 2.5, md: 4, lg: 5 },
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 560,
              justifySelf: { xs: "stretch", md: "start" },
              px: { xs: 0.5, md: 1.5 },
              py: { xs: 1, md: 2 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: { xs: 3, md: 4 } }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg,#2563eb,#38bdf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 22px rgba(37,99,235,0.24)",
                }}
              >
                <TrendingUpRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#1e3a8a" }}>
                FlowDesk
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "#2563eb",
                mb: 1.5,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 30, sm: 34, md: 40 },
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                mb: 1.5,
                maxWidth: 520,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                color: "#5f7189",
                fontSize: { xs: 14.5, md: 15.5 },
                lineHeight: 1.7,
                maxWidth: 500,
                mb: 3,
              }}
            >
              {subtitle}
            </Typography>

            <Box sx={{ display: "grid", gap: 1.5, maxWidth: 420 }}>
              {features.map((feature) => (
                <Box
                  key={feature}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(148,163,184,0.14)",
                    color: "#334155",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 8px 22px rgba(148,163,184,0.08)",
                  }}
                >
                  {feature}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              px: { xs: 0, md: 1 },
              py: { xs: 0, md: 1 },
            }}
          >
            <Box sx={authCardSx}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#0f172a", mb: 0.75 }}>
                  {cardTitle}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#7b8ba6", lineHeight: 1.6 }}>
                  {cardSubtitle}
                </Typography>
              </Box>
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
