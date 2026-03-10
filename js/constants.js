// LocalStorage keys
const LS_INVOICES = "rp_invoices";
const LS_EXPENSES = "rp_expenses";
const LS_CAT_SORT = "rp_cat_sort_mode";
const LS_DEFAULT_TAB = "rp_default_tab";
const LS_LAST_CLIENT = "rp_last_client";

// Work categories
const CATEGORIES = [
  "Cabinetry","Carpentry","Countertops","Demo","Drywall","Electrical",
  "Flatwork","Flooring","Framing","Haul Away","Handyman","HVAC",
  "Installation","Painting","Plumbing","Tile","Other","Materials","Discount"
];

const CONSTRUCTION_ORDER = [
  "Demo","Framing","Electrical","Plumbing","HVAC","Drywall","Flooring","Tile",
  "Cabinetry","Countertops","Carpentry","Installation","Painting","Haul Away",
  "Handyman","Flatwork","Other","Materials","Discount"
];

const CATEGORY_NOTES = {
  "Demo": "We protect your home with dust control, careful demo, and clean disposal so the job site stays safe and livable.",
  "Framing": "We frame square, level, and plumb and overbuild where it matters for long-term strength - no shortcuts.",
  "Electrical": "All electrical work is code-compliant, neatly routed, and planned for real-life use (outlets, lighting, and load).",
  "Plumbing": "Clean, reliable plumbing with proper venting and drainage and quality valves and fixtures to prevent future issues.",
  "HVAC": "Thoughtful airflow and comfort planning with clean line routing and proper condensate management.",
  "Drywall": "Taped and finished for smooth walls and crisp corners - ready for high-end paint and trim.",
  "Flooring": "Proper prep and transitions so floors last: flat substrate, clean cuts, and durable install methods.",
  "Tile": "Flat layouts, clean lines, and tight grout work with correct waterproofing where required - built to last.",
  "Cabinetry": "Accurate layout, level installs, consistent reveals, and solid anchoring so everything looks custom.",
  "Countertops": "Coordinated templating and installation with clean seams, proper support, and careful finish protection.",
  "Carpentry": "Detail-focused trim and finish work - tight miters and professional fit and finish.",
  "Installation": "Doors, fixtures, hardware, and finish items installed cleanly with function checks and final adjustments.",
  "Painting": "Proper prep first (patch, sand, prime) then clean cut lines, thorough caulking, and uniform coverage for a pro finish.",
  "Haul Away": "We leave your home clean - debris removal and jobsite cleanup are part of the process.",
  "Handyman": "Punch work and small fixes done the right way - clean, solid, and finished.",
  "Flatwork": "Correct base prep, reinforcement when needed, and clean edges and joints for durable concrete work.",
  "Discount": "Any discount is applied at the end to keep pricing transparent across the scope."
};

const ESTIMATE_DISCLAIMER =
  "This estimate is a good-faith projection and may change if the scope of work changes, site conditions require adjustments, or additional work is added by the client.";

const ESTIMATE_PAYMENT_TERMS =
  "Payment terms: 50% deposit is required to schedule and begin work. The remaining 50% balance is due upon completion of the agreed scope of work.";

const INVOICE_THANK_YOU =
  "We appreciate your business. Referrals and reviews are always appreciated and help our small business grow.";

const INVOICE_PAYMENT_DUE =
  "Payment is due on the invoice date unless otherwise agreed in writing.";

const PAYMENT_METHODS =
  "Accepted Payment Methods: Cash, Check, Cashier's Check, Venmo, Wire Transfer, Credit/Debit Cards (5% transaction fee applies).";

const ESTIMATE_LEGAL_TEXT =
  "Legal: Work performed under this estimate is subject to RemodelPRO's standard terms and conditions. " +
  "Estimates are valid for 30 days and may change if site conditions differ. Customer is responsible for permits, " +
  "inspections, and providing clear access. RemodelPRO is not liable for weather delays, material availability, or " +
  "unforeseen conditions once work begins. Payment due as outlined above. Refer to full terms at remodelproutah.com/terms.";
