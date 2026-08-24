// Qura Academy — course structure, generated from the founder's blueprint.
// Modules, outcomes and lessons only. The question bank and its answer keys
// live server-side in api/_academy.js and are never shipped to the browser:
// a credential whose answers are readable in the page source is worthless.

export const ACADEMY_COURSES = [
  {
    "id": "essentials",
    "name": "Qura Essentials",
    "tag": "Universal onboarding",
    "accent": "#00C2B8",
    "blurb": "How healthcare connects through Qura. Short, universal, and the first thing every new member does.",
    "lenses": [
      "clinician",
      "agency",
      "hospital",
      "gp",
      "care",
      "operator"
    ],
    "passMark": 80,
    "questionsAsked": 10,
    "unlimitedRetakes": true,
    "flagship": false,
    "modules": [
      {
        "id": "essentials-m1",
        "n": 1,
        "title": "The Healthcare Market",
        "outcome": "Recognise the main participants in Qura's healthcare ecosystem.",
        "lessons": [
          "Clinicians, providers, workforce suppliers and healthcare suppliers",
          "Decision-makers, procurement, tenders and workforce requirements",
          "How the parties connect commercially"
        ]
      },
      {
        "id": "essentials-m2",
        "n": 2,
        "title": "The Qura Ecosystem",
        "outcome": "Understand Qura as the connection layer rather than a single-purpose directory.",
        "lessons": [
          "Profiles and discovery",
          "Decision-maker and market intelligence",
          "Opportunities, tenders, live activity, AI and meetings"
        ]
      },
      {
        "id": "essentials-m3",
        "n": 3,
        "title": "Your Qura Lens",
        "outcome": "Understand how the platform changes according to user type.",
        "lessons": [
          "Lens-specific navigation",
          "Relevant profiles, data and opportunities",
          "Recommended next actions"
        ]
      },
      {
        "id": "essentials-m4",
        "n": 4,
        "title": "Finding Opportunities",
        "outcome": "Use a repeatable discovery workflow.",
        "lessons": [
          "Search and filters",
          "Read intelligence before outreach",
          "Move from signal to relevant engagement"
        ]
      },
      {
        "id": "essentials-m5",
        "n": 5,
        "title": "Using Qura Responsibly",
        "outcome": "Use Qura intelligence professionally.",
        "lessons": [
          "Accurate profiles and representation",
          "Relevant, proportionate outreach",
          "Respect for provider procurement and governance"
        ]
      }
    ],
    "bankSize": 10
  },
  {
    "id": "career-ready",
    "name": "Career Ready",
    "tag": "For clinicians",
    "accent": "#2D6BFF",
    "blurb": "Build a profile healthcare organisations act on, and stay visible for the right work.",
    "lenses": [
      "clinician"
    ],
    "passMark": 80,
    "questionsAsked": 10,
    "unlimitedRetakes": true,
    "flagship": false,
    "modules": [
      {
        "id": "career-ready-m1",
        "n": 1,
        "title": "Build a Discoverable Profile",
        "outcome": "Present experience clearly and accurately.",
        "lessons": [
          "Specialty and experience",
          "Availability and preferred opportunity types",
          "CV and professional evidence"
        ]
      },
      {
        "id": "career-ready-m2",
        "n": 2,
        "title": "Understand Healthcare Work",
        "outcome": "Recognise common routes into healthcare opportunities.",
        "lessons": [
          "Permanent, temporary and contract work",
          "Provider-direct and supplier-led routes",
          "UK and international context"
        ]
      },
      {
        "id": "career-ready-m3",
        "n": 3,
        "title": "Become Opportunity-Ready",
        "outcome": "Reduce avoidable delays when opportunities arise.",
        "lessons": [
          "Current documentation",
          "References and evidence",
          "Accurate availability"
        ]
      },
      {
        "id": "career-ready-m4",
        "n": 4,
        "title": "Work Effectively With Suppliers",
        "outcome": "Understand representation and recruiter relationships.",
        "lessons": [
          "Clear consent and communication",
          "Avoiding duplicate representation",
          "Evaluating supplier fit"
        ]
      },
      {
        "id": "career-ready-m5",
        "n": 5,
        "title": "Use Qura Opportunities",
        "outcome": "Respond appropriately to matching and live opportunities.",
        "lessons": [
          "Reading requirements",
          "Assessing fit",
          "Timely, accurate responses"
        ]
      },
      {
        "id": "career-ready-m6",
        "n": 6,
        "title": "Build Long-Term Career Visibility",
        "outcome": "Use Qura beyond the next role.",
        "lessons": [
          "Maintain profile",
          "Build credible experience history",
          "Stay visible to relevant organisations"
        ]
      }
    ],
    "bankSize": 10
  },
  {
    "id": "provider-certified",
    "name": "Provider Certified",
    "tag": "For hospitals and providers",
    "accent": "#0E8C7E",
    "blurb": "Evaluate suppliers and buy well. Written from the buyer's side of the table.",
    "lenses": [
      "hospital",
      "gp",
      "care"
    ],
    "passMark": 80,
    "questionsAsked": 10,
    "unlimitedRetakes": true,
    "flagship": false,
    "modules": [
      {
        "id": "provider-certified-m1",
        "n": 1,
        "title": "Understand the Supplier Marketplace",
        "outcome": "Distinguish supplier types and capabilities.",
        "lessons": [
          "Workforce suppliers",
          "Healthcare and medical suppliers",
          "Specialist service partners"
        ]
      },
      {
        "id": "provider-certified-m2",
        "n": 2,
        "title": "Supplier Due Diligence",
        "outcome": "Evaluate suppliers before engagement.",
        "lessons": [
          "Relevant track record",
          "Capability and evidence",
          "Ratings as one input, not the only input"
        ]
      },
      {
        "id": "provider-certified-m3",
        "n": 3,
        "title": "Qura Supplier Ratings",
        "outcome": "Use and contribute feedback responsibly.",
        "lessons": [
          "Past performance signals",
          "Provider feedback",
          "Fair and factual ratings"
        ]
      },
      {
        "id": "provider-certified-m4",
        "n": 4,
        "title": "Find and Compare Suppliers",
        "outcome": "Shortlist relevant suppliers efficiently.",
        "lessons": [
          "Specialty and capability filters",
          "Geography and service fit",
          "Comparable evidence"
        ]
      },
      {
        "id": "provider-certified-m5",
        "n": 5,
        "title": "Use Market Intelligence",
        "outcome": "Interpret workforce and supplier-market signals.",
        "lessons": [
          "Capacity and demand",
          "Opportunity signals",
          "Market changes"
        ]
      },
      {
        "id": "provider-certified-m6",
        "n": 6,
        "title": "Post Requirements",
        "outcome": "Create useful market signals.",
        "lessons": [
          "Clear need",
          "Scope and timing",
          "Appropriate response route"
        ]
      },
      {
        "id": "provider-certified-m7",
        "n": 7,
        "title": "Procurement & Governance",
        "outcome": "Know where Qura discovery ends.",
        "lessons": [
          "Local procurement rules",
          "Due diligence",
          "Contracting and governance"
        ]
      }
    ],
    "bankSize": 10
  },
  {
    "id": "supplier-certified",
    "name": "Supplier Certified",
    "tag": "For workforce suppliers",
    "accent": "#7C5CFF",
    "blurb": "Use Qura commercially: present credibly, find relevant work and progress it properly.",
    "lenses": [
      "agency"
    ],
    "passMark": 80,
    "questionsAsked": 10,
    "unlimitedRetakes": true,
    "flagship": false,
    "modules": [
      {
        "id": "supplier-certified-m1",
        "n": 1,
        "title": "Market Intelligence",
        "outcome": "Identify where relevant demand exists.",
        "lessons": [
          "Markets and specialties",
          "Provider change signals",
          "Prioritisation"
        ]
      },
      {
        "id": "supplier-certified-m2",
        "n": 2,
        "title": "Decision-Maker Intelligence",
        "outcome": "Understand stakeholder roles.",
        "lessons": [
          "Clinical, operational and commercial stakeholders",
          "Budget ownership and influence",
          "Contact relevance"
        ]
      },
      {
        "id": "supplier-certified-m3",
        "n": 3,
        "title": "Opportunity Intelligence",
        "outcome": "Recognise commercial signals.",
        "lessons": [
          "Tenders",
          "Workforce gaps",
          "Transformation and expansion"
        ]
      },
      {
        "id": "supplier-certified-m4",
        "n": 4,
        "title": "Supplier Profile Optimisation",
        "outcome": "Make capabilities discoverable.",
        "lessons": [
          "Evidence",
          "Specialties and geography",
          "Differentiation"
        ]
      },
      {
        "id": "supplier-certified-m5",
        "n": 5,
        "title": "Relevant Outreach",
        "outcome": "Convert intelligence into a reason to speak.",
        "lessons": [
          "Context-led messaging",
          "Timing",
          "Avoiding generic spam"
        ]
      },
      {
        "id": "supplier-certified-m6",
        "n": 6,
        "title": "CRM & Pipeline Discipline",
        "outcome": "Track opportunities consistently.",
        "lessons": [
          "Stage definitions",
          "Next actions",
          "Evidence and notes"
        ]
      },
      {
        "id": "supplier-certified-m7",
        "n": 7,
        "title": "Meetings & Conversion",
        "outcome": "Advance qualified opportunities.",
        "lessons": [
          "Discovery",
          "Next steps",
          "Commercial progression"
        ]
      }
    ],
    "bankSize": 10
  },
  {
    "id": "qbd",
    "name": "Qura Qualified Healthcare BD Consultant",
    "tag": "Flagship credential",
    "accent": "#B8893B",
    "blurb": "The QURA Method. A founder-led professional qualification in healthcare business development.",
    "lenses": [
      "agency",
      "operator"
    ],
    "passMark": 80,
    "questionsAsked": 30,
    "unlimitedRetakes": false,
    "flagship": true,
    "modules": [
      {
        "id": "qbd-m1",
        "n": 1,
        "title": "Understanding the Healthcare Market",
        "outcome": "Understand how healthcare demand, budgets and buying pathways differ.",
        "lessons": [
          "NHS, private, community, primary care and international settings",
          "Workforce and healthcare-supplier markets",
          "Problem owner vs budget holder vs influencer vs signer"
        ]
      },
      {
        "id": "qbd-m2",
        "n": 2,
        "title": "Healthcare Decision Makers",
        "outcome": "Map stakeholders by role rather than title alone.",
        "lessons": [
          "Clinical stakeholder",
          "Operational stakeholder",
          "Procurement / commercial",
          "Finance and executive sponsor"
        ]
      },
      {
        "id": "qbd-m3",
        "n": 3,
        "title": "Territory & Account Mapping",
        "outcome": "Build an evidence-led target market.",
        "lessons": [
          "Market → region → organisation → department",
          "Decision-makers and stakeholder map",
          "Problems, signals and opportunities"
        ]
      },
      {
        "id": "qbd-m4",
        "n": 4,
        "title": "Identifying Opportunity Signals",
        "outcome": "Recognise change before sending outreach.",
        "lessons": [
          "Tenders and contract cycles",
          "Workforce gaps and service pressure",
          "Expansion, transformation, leadership change and pathway redesign"
        ]
      },
      {
        "id": "qbd-m5",
        "n": 5,
        "title": "The QURA BD Method",
        "outcome": "Apply Qura's proprietary four-stage workflow.",
        "lessons": [
          "Q — Qualify",
          "U — Understand",
          "R — Reach",
          "A — Advance"
        ]
      },
      {
        "id": "qbd-m6",
        "n": 6,
        "title": "Healthcare Outreach",
        "outcome": "Create relevant, proportionate engagement.",
        "lessons": [
          "Email and LinkedIn",
          "Telephone and warm introductions",
          "Event / tender follow-up",
          "When not to contact"
        ]
      },
      {
        "id": "qbd-m7",
        "n": 7,
        "title": "The Healthcare BD Call",
        "outcome": "Run discovery that uncovers a real commercial problem.",
        "lessons": [
          "Opening and agenda",
          "Discovery and qualification",
          "Objections",
          "Securing a measurable next step"
        ]
      },
      {
        "id": "qbd-m8",
        "n": 8,
        "title": "From Conversation to Contract",
        "outcome": "Understand commercial progression.",
        "lessons": [
          "Signal → contact → conversation",
          "Qualified opportunity → meeting → proposal",
          "Procurement → contract → delivery → account growth"
        ]
      },
      {
        "id": "qbd-m9",
        "n": 9,
        "title": "Qura as a BD Operating System",
        "outcome": "Apply the method through platform workflows.",
        "lessons": [
          "Decision-maker directory",
          "Tender and opportunity intelligence",
          "AI assistance, CRM and calendar",
          "Opportunity scoring and Live Feed"
        ]
      },
      {
        "id": "qbd-m10",
        "n": 10,
        "title": "Professional Standards & Final Assessment",
        "outcome": "Demonstrate responsible healthcare BD judgement.",
        "lessons": [
          "Accuracy and evidence",
          "Confidentiality and responsible data use",
          "No misrepresentation",
          "Final 30-question assessment",
          "Final backend multiple-choice assessment"
        ]
      }
    ],
    "bankSize": 30
  }
];
