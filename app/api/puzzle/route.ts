import { NextResponse } from "next/server";

import { fetchCsvPuzzle } from "@/app/_puzzle-data";

export async function GET() {
  try {
    const puzzle = await fetchCsvPuzzle();
    return NextResponse.json(puzzle);
  } catch (error) {
    console.error("Failed to load puzzle data", error);
    return NextResponse.json(
      { error: "Failed to load puzzle data" },
      { status: 500 }
    );
  }
}
