import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sponsor } from "@/lib/models/Sponsor";

export async function GET() {
  try {
    console.log("connecting to db");
    await connectDB();

    const sponsors = await Sponsor.find({
      stripeStatus: { $in: ["active", "trialing"] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select("_id gridPosition name slogan logoUrl websiteUrl monthlyAmount")
      .sort({ gridPosition: 1 })
      .lean();

    // Transform _id to id for frontend compatibility
    const formattedSponsors = sponsors.map((sponsor: any) => ({
      id: sponsor._id.toString(),
      gridPosition: sponsor.gridPosition,
      name: sponsor.name,
      slogan: sponsor.slogan || null,
      logoUrl: sponsor.logoUrl,
      websiteUrl: sponsor.websiteUrl,
      monthlyAmount: sponsor.monthlyAmount,
    }));

    return NextResponse.json({ sponsors: formattedSponsors });
  } catch (error) {
    console.error("Fetch sponsors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsors" },
      { status: 500 }
    );
  }
}
