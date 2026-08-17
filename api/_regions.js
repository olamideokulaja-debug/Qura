// Regional mapping, in one place so the decision-maker directory and the market
// map can never disagree about where an organisation sits. Deliberately
// conservative: anything unmatched returns null and is shown as "Not mapped"
// rather than pushed into the nearest region to make a filter look fuller.

const REGION_RULES = [
  ["London", /\b(london|barts|guy'?s|st thomas|king'?s college|imperial|ucl|uclh|royal free|chelsea|westminster|homerton|whittington|croydon|lewisham|greenwich|barking|havering|redbridge|newham|hillingdon|kingston|epsom|st george'?s|moorfields|great ormond)\b/i],
  ["South East", /\b(kent|surrey|sussex|brighton|oxford|oxfordshire|berkshire|buckingham|hampshire|southampton|portsmouth|isle of wight|frimley|ashford|medway|dartford|milton keynes)\b/i],
  ["South West", /\b(bristol|somerset|devon|plymouth|exeter|cornwall|gloucester|dorset|bath|wiltshire|swindon|torbay|taunton|yeovil)\b/i],
  ["Midlands", /\b(birmingham|solihull|coventry|warwick|leicester|nottingham|derby|stoke|staffordshire|shropshire|worcester|hereford|northampton|lincoln|walsall|dudley|wolverhampton|sandwell)\b/i],
  ["East of England", /\b(cambridge|addenbrooke|norfolk|norwich|suffolk|ipswich|essex|colchester|chelmsford|bedford|hertford|luton|peterborough|basildon|southend)\b/i],
  ["North West", /\b(manchester|liverpool|lancashire|cheshire|merseyside|salford|bolton|wigan|stockport|preston|blackpool|blackburn|warrington|wirral|oldham|tameside)\b/i],
  ["Yorkshire & Humber", /\b(leeds|sheffield|bradford|york|hull|humber|doncaster|bassetlaw|rotherham|barnsley|wakefield|calderdale|harrogate|airedale|scarborough)\b/i],
  ["North East", /\b(newcastle|gateshead|sunderland|durham|northumbria|northumberland|tees|middlesbrough|south tyneside|north tyneside|hartlepool)\b/i],
  ["Scotland", /\b(scotland|scottish|glasgow|edinburgh|lothian|tayside|grampian|highland|ayrshire|lanarkshire|fife|borders|dumfries)\b/i],
  ["Wales", /\b(wales|welsh|cardiff|swansea|betsi|cadwaladr|aneurin|hywel dda|cwm taf|powys)\b/i],
  ["Northern Ireland", /\b(northern ireland|belfast|antrim|armagh|down|fermanagh|londonderry|derry)\b/i],
];

export const UK_REGIONS = REGION_RULES.map((r) => r[0]);

// Australian states and territories. Kept as a separate list because they are
// not UK regions and must not appear in the same filter: a directory offering
// "Yorkshire & Humber" next to "Queensland" in one dropdown is confusing.
export const AU_REGIONS = ["New South Wales", "Victoria", "Queensland", "Western Australia",
  "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory",
  "Federal", "National"];

export function regionOf(text) {
  const t = String(text || "");
  for (const [name, re] of REGION_RULES) if (re.test(t)) return name;
  return null;
}
