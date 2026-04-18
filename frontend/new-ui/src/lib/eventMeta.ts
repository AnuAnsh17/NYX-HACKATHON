export type EventMeta = { code: string; color: string; bgColor: string };

export function parseEventMeta(data: string): EventMeta {
  const lower = data.toLowerCase();
  const pipe = data.indexOf("|");
  if (pipe > 0) {
    const name = lower.slice(0, pipe);
    if (name.includes("loan_disb") || name.includes("disburs"))
      return { code: "LOAN_DISB", color: "#00D4B0", bgColor: "rgba(0,212,176,0.08)" };
    if (name.includes("loan"))
      return { code: "LOAN", color: "#00D4B0", bgColor: "rgba(0,212,176,0.08)" };
    if (name.includes("kyc"))
      return { code: "KYC", color: "#FFB800", bgColor: "rgba(255,184,0,0.08)" };
    if (name.includes("fraud") || name.includes("frozen"))
      return { code: "FRAUD", color: "#FF2D55", bgColor: "rgba(255,45,85,0.1)" };
    if (name.includes("repay"))
      return { code: "REPAY", color: "#00E07F", bgColor: "rgba(0,224,127,0.08)" };
    if (name.includes("consent"))
      return { code: "CONSENT", color: "#A78BFA", bgColor: "rgba(167,139,250,0.08)" };
    if (name.includes("cred"))
      return { code: "CREDIT", color: "#60A5FA", bgColor: "rgba(96,165,250,0.08)" };
    if (name.includes("reg") || name.includes("report"))
      return { code: "REG_RPT", color: "#FFB800", bgColor: "rgba(255,184,0,0.08)" };
    if (name.includes("data_access"))
      return { code: "DAR", color: "#8080A0", bgColor: "transparent" };
  }
  const colon = data.indexOf(":");
  if (colon > 0) {
    const type = data.slice(0, colon).toUpperCase();
    const map: Record<string, EventMeta> = {
      TXN:    { code: "TXN",    color: "#00D4B0", bgColor: "rgba(0,212,176,0.08)" },
      KYC:    { code: "KYC",    color: "#FFB800", bgColor: "rgba(255,184,0,0.08)" },
      LOGIN:  { code: "LOGIN",  color: "#60A5FA", bgColor: "rgba(96,165,250,0.08)" },
      ALERT:  { code: "ALERT",  color: "#FF2D55", bgColor: "rgba(255,45,85,0.1)" },
      CUSTOM: { code: "CUSTOM", color: "#8080A0", bgColor: "transparent" },
    };
    return map[type] ?? { code: type.slice(0, 8), color: "#585870", bgColor: "transparent" };
  }
  return { code: "EVT", color: "#363650", bgColor: "transparent" };
}
