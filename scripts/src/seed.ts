import { db, assetsTable } from "@workspace/db";

const assets = [
  {
    name: "Sunset Tower Residences",
    description: "A premium 32-story luxury residential tower in the heart of downtown. Features rooftop pool, concierge services, and panoramic city views. Consistent high occupancy driven by corporate tenant demand.",
    location: "Miami, FL",
    propertyType: "Residential",
    totalShares: 10000,
    availableShares: 6500,
    pricePerShare: "50.000000",
    totalValuation: "500000.000000",
    expectedReturn: "8.200000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    amenities: ["Rooftop Pool", "24/7 Concierge", "Fitness Center", "Underground Parking"],
    highlights: ["98% average occupancy over 3 years", "Prime downtown location", "Corporate leases with AAA tenants"],
    documents: [],
  },
  {
    name: "Harbor District Office Park",
    description: "Class-A office complex across three interconnected buildings on the waterfront. Fully leased to Fortune 500 tech and finance tenants with triple-net leases through 2029.",
    location: "San Francisco, CA",
    propertyType: "Commercial",
    totalShares: 20000,
    availableShares: 8000,
    pricePerShare: "100.000000",
    totalValuation: "2000000.000000",
    expectedReturn: "7.500000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    amenities: ["Waterfront Views", "Covered Parking", "Conference Facilities", "EV Charging"],
    highlights: ["Triple-net leases to 2029", "LEED Gold certified", "Recent $2M renovation"],
    documents: [],
  },
  {
    name: "Oakwood Logistics Hub",
    description: "Modern 250,000 sq ft distribution and logistics center with direct highway access. Strategically located serving the greater Atlanta metro with strong e-commerce driven demand.",
    location: "Atlanta, GA",
    propertyType: "Industrial",
    totalShares: 15000,
    availableShares: 10000,
    pricePerShare: "75.000000",
    totalValuation: "1125000.000000",
    expectedReturn: "9.100000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    amenities: ["36 Loading Docks", "Cross-Docking Capability", "24/7 Security", "Rail Access"],
    highlights: ["5-year lease with major retailer", "Sub-5% vacancy in submarket", "Recently upgraded racking system"],
    documents: [],
  },
  {
    name: "Riverwalk Mixed-Use Plaza",
    description: "Vibrant mixed-use development featuring 80 retail units, 200 apartments, and a boutique hotel along a scenic riverside promenade. A landmark destination in Austin's fastest-growing corridor.",
    location: "Austin, TX",
    propertyType: "Mixed-Use",
    totalShares: 25000,
    availableShares: 0,
    pricePerShare: "120.000000",
    totalValuation: "3000000.000000",
    expectedReturn: "10.300000",
    status: "fully_funded" as const,
    imageUrl: "https://images.unsplash.com/photo-1565791380713-1756b9a05343?w=800&q=80",
    amenities: ["Riverside Promenade", "Boutique Hotel", "Underground Parking", "Event Spaces"],
    highlights: ["Fully funded in 48 hours", "Anchor tenants secured", "City-backed tax incentives"],
    documents: [],
  },
  {
    name: "Northgate Shopping Centre",
    description: "Established regional mall anchored by three major national retailers. Currently undergoing repositioning with experiential retail, dining, and entertainment to drive foot traffic.",
    location: "Denver, CO",
    propertyType: "Retail",
    totalShares: 18000,
    availableShares: 13000,
    pricePerShare: "60.000000",
    totalValuation: "1080000.000000",
    expectedReturn: "6.800000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=800&q=80",
    amenities: ["Food Court", "Cinema Complex", "Ample Parking", "EV Charging Stations"],
    highlights: ["Stable anchor tenants", "Repositioning upside", "Strong suburban catchment"],
    documents: [],
  },
  {
    name: "Alpine Peaks Ski Resort Lodges",
    description: "Portfolio of 45 ski-in/ski-out luxury lodges at a premier Rocky Mountain resort. Professionally managed with strong seasonal rental income and year-round mountain tourism appeal.",
    location: "Vail, CO",
    propertyType: "Hospitality",
    totalShares: 9000,
    availableShares: 7200,
    pricePerShare: "200.000000",
    totalValuation: "1800000.000000",
    expectedReturn: "11.500000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800&q=80",
    amenities: ["Ski-in/Ski-out", "Hot Tubs", "Concierge", "Shuttle Service"],
    highlights: ["Peak season 95% occupancy", "Year-round demand", "Professional property management"],
    documents: [],
  },
  {
    name: "Sunrise Senior Living Campus",
    description: "Purpose-built senior living facility with 300 independent living units and 100 assisted care suites. Strong demographic tailwinds with aging population driving sustained demand.",
    location: "Scottsdale, AZ",
    propertyType: "Healthcare",
    totalShares: 12000,
    availableShares: 12000,
    pricePerShare: "85.000000",
    totalValuation: "1020000.000000",
    expectedReturn: "8.700000",
    status: "coming_soon" as const,
    imageUrl: "https://images.unsplash.com/photo-1493540447904-49763eecf55f?w=800&q=80",
    amenities: ["Medical Care Units", "Dining Facilities", "Wellness Center", "Gardens"],
    highlights: ["Pre-leased 60% before opening", "Aging population demand", "Experienced operator"],
    documents: [],
  },
  {
    name: "Clearwater Beach Resort & Spa",
    description: "Beachfront boutique hotel with 120 rooms, full-service spa, and two restaurants. Award-winning property with a loyal repeat customer base and strong online ratings.",
    location: "Tampa, FL",
    propertyType: "Hospitality",
    totalShares: 8000,
    availableShares: 4400,
    pricePerShare: "150.000000",
    totalValuation: "1200000.000000",
    expectedReturn: "9.900000",
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    amenities: ["Private Beach", "Full-Service Spa", "Two Restaurants", "Marina Access"],
    highlights: ["4.8/5 TripAdvisor rating", "Florida tourism growth", "Strong RevPAR metrics"],
    documents: [],
  },
];

async function seed() {
  console.log("Seeding assets...");

  const existing = await db.select({ id: assetsTable.id }).from(assetsTable);
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} assets. Skipping seed.`);
    process.exit(0);
  }

  await db.insert(assetsTable).values(assets);
  console.log(`Inserted ${assets.length} assets successfully.`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
