import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const reportPath = path.resolve("VERIFICATION_REPORT.md");
  if (!fs.existsSync(reportPath)) {
    return NextResponse.json({ exists: false, markdown: "" });
  }
  const markdown = fs.readFileSync(reportPath, "utf8");
  return NextResponse.json({ exists: true, markdown });
}
