// The platform FAQs, from the founder's document. Wording is his, unchanged:
// these explain how the functions actually work, and several draw the line
// between what Qura does and what an employer or buyer decides. Paraphrasing
// them loosely would blur exactly the distinction they exist to protect.
//
// Grouped by lens rather than listed as 40 in a row, so someone finds their own
// questions instead of scrolling past everyone else's. Order matches the source
// document, so MOST_ASKED can index the flattened list by its original number.

export const FAQ_GROUPS = [
 {
  "id": "general",
  "label": "How Qura works",
  "accent": "#0E8C7E",
  "items": [
   {
    "q": "What exactly is Qura, and how is it different from a normal healthcare jobs or recruitment website?",
    "a": [
     "Qura is a healthcare marketplace and growth CRM connecting clinicians, healthcare providers, workforce suppliers and medical suppliers within one ecosystem.",
     "Rather than focusing only on advertised vacancies, Qura connects several parts of the healthcare market at the same time. It can surface live workforce demand, map healthcare organisations and decision-makers, match clinicians to opportunities, help suppliers identify commercial opportunities, support outreach and proposals, and track activity through a healthcare-specific CRM.",
     "For clinicians, this means being discoverable by verified healthcare organisations as well as searching and applying for opportunities. For suppliers, it means being able to identify demand and the people behind that demand rather than manually researching the market. For providers, it means being able to identify clinicians and suitable healthcare partners through the same environment.",
     "Qura is therefore designed around the whole journey from identifying demand to making the right connection, rather than just publishing vacancies."
    ]
   },
   {
    "q": "What does Qura mean by a “live healthcare marketplace”?",
    "a": [
     "The marketplace is designed to continuously surface healthcare activity including vacancies, workforce requirements, insourcing opportunities, contracts, tenders and other relevant market signals.",
     "Opportunities can then be categorised according to factors such as profession, specialty, organisation, geography and opportunity type.",
     "This allows Qura to make the same piece of demand useful to different users. A clinician may see a relevant career opportunity, while a workforce supplier may see a potential business opportunity connected with the same area of demand.",
     "The objective is to reduce reliance on manually checking numerous job boards, procurement portals, organisation websites and market sources."
    ]
   },
   {
    "q": "Does Qura's AI make recruitment or procurement decisions?",
    "a": [
     "No. Qura's AI is designed to support research, matching, analysis, scoring, drafting and administration. It does not replace the healthcare organisation, hiring manager, procurement team or other authorised decision-maker.",
     "For example, Qura may identify that a clinician appears highly relevant to a vacancy or that a supplier appears aligned with an opportunity. That is an intelligence or matching signal, not a hiring, shortlisting, procurement or contract award decision.",
     "Human organisations remain responsible for their own recruitment, procurement, due-diligence and commercial decisions."
    ]
   },
   {
    "q": "What does a Qura match or percentage score actually mean?",
    "a": [
     "Where Qura displays a match, fit or opportunity score, it should be understood as an analytical indicator.",
     "Qura can compare available information about an opportunity against relevant factors such as profession, specialty, location, service type, experience, organisation, market and other available criteria.",
     "The resulting score helps users prioritise where they may have the strongest alignment. It does not mean that a clinician has been shortlisted, that a supplier has been selected, or that an organisation will award work. Those decisions remain with the relevant organisation."
    ]
   },
   {
    "q": "Where does Qura's market intelligence come from?",
    "a": [
     "Qura brings together structured healthcare market intelligence and information obtained from appropriate public business and market sources, alongside information created or supplied by users and organisations within the platform.",
     "Its purpose is to organise fragmented healthcare information into something users can actually act upon, rather than requiring teams to repeatedly research organisations, vacancies, leadership structures and market developments manually.",
     "Users should still verify critical information before making recruitment, procurement, regulatory or commercial decisions."
    ]
   }
  ]
 },
 {
  "id": "clinician",
  "label": "Clinicians",
  "accent": "#2D6BFF",
  "items": [
   {
    "q": "How does Qura verify a clinician?",
    "a": [
     "Qura verification is not simply an automated badge.",
     "Where professional registration is required, the Qura team checks the clinician against the relevant official public professional register. This may include confirming registration, profession and other available professional information.",
     "Qura also records information including specialty, experience and country of residence.",
     "Verification is intended to increase trust within the marketplace. It does not replace an employer's own pre-employment checks, references, occupational health checks, right-to-work checks, DBS or equivalent checks, or any other compliance requirements applicable to a particular role."
    ]
   },
   {
    "q": "Can I create a Qura profile even if I am not actively looking for another job?",
    "a": [
     "Yes. A major part of the clinician model is discoverability, rather than requiring clinicians to repeatedly apply for vacancies.",
     "A verified clinician can maintain a profile containing their profession, specialty, experience and career preferences and remain discoverable to relevant verified organisations.",
     "This means a clinician can potentially become aware of suitable opportunities without constantly searching job boards. The clinician remains in control of whether they want to engage with an introduction or opportunity."
    ]
   },
   {
    "q": "Who can see my clinician profile and contact details?",
    "a": [
     "Clinician profiles are intended to be visible within the controlled Qura ecosystem to relevant verified healthcare organisations.",
     "Importantly, Qura distinguishes between being professionally discoverable and automatically publishing a clinician's personal contact information.",
     "The clinician retains control over introductions and can pause their visibility or remove their profile in accordance with the platform's available controls and policies."
    ]
   },
   {
    "q": "How does application tracking work?",
    "a": [
     "Qura is designed to give clinicians visibility over the progression of applications rather than leaving them wondering what happened after submitting a CV.",
     "An application can move through defined stages within the platform as its status changes.",
     "However, there is an important distinction between a Qura system status and an employer decision. Qura can record and display known application activity, but it should not falsely represent an employer as having shortlisted, rejected or selected someone unless that status has actually been supplied or confirmed through the appropriate workflow.",
     "AI can help organise information and provide updates, but it should not invent hiring decisions."
    ]
   },
   {
    "q": "If Qura says I am a strong match, does that mean I have been shortlisted?",
    "a": [
     "No. A strong match means that the information available to Qura indicates a high level of alignment between your profile and an opportunity.",
     "“Matched” and “shortlisted” are fundamentally different.",
     "Matched = Qura's technology identifies potential suitability.",
     "Shortlisted = the recruiting organisation or authorised hiring process has progressed your application.",
     "Qura should never present an algorithmic match as though a hospital or employer has made a decision."
    ]
   },
   {
    "q": "Can international clinicians use Qura?",
    "a": [
     "Yes. Qura is designed around international healthcare mobility as well as domestic recruitment. Clinicians can use relevant country and market information to better understand potential pathways and requirements.",
     "However, Qura guidance should not be treated as immigration, legal or regulatory advice. Professional registration, visa eligibility and employer requirements must ultimately be confirmed with the relevant authority."
    ]
   },
   {
    "q": "Does joining Qura guarantee me a job?",
    "a": [
     "No. Qura increases visibility, access to opportunities and the ability to be matched with relevant organisations, but employment cannot be guaranteed. Hiring decisions remain with employers."
    ]
   }
  ]
 },
 {
  "id": "supplier",
  "label": "Workforce suppliers",
  "accent": "#7C5CFF",
  "items": [
   {
    "q": "How does Qura identify business opportunities for workforce suppliers?",
    "a": [
     "Qura is designed to identify multiple forms of healthcare demand rather than limiting business development teams to traditional recruitment vacancies.",
     "This can include permanent recruitment, contract requirements, insourcing, international recruitment, tenders, frameworks, PSL opportunities, MSP/RPO activity, regional programmes and appropriate temporary workforce requirements.",
     "The platform then helps organise these opportunities around factors such as geography, specialty, organisation and potential fit.",
     "This allows suppliers to move from “Where might there be business?” to “Which opportunities should we prioritise and who should we approach?”"
    ]
   },
   {
    "q": "What is Qura's decision-maker intelligence?",
    "a": [
     "Qura maps relevant healthcare organisations and the people occupying important decision-making or influencing positions.",
     "Instead of a consultant manually searching organisation websites, LinkedIn, board papers, procurement notices and other sources every time they enter a market, Qura structures that intelligence within the platform.",
     "The objective is not simply to provide a large contact list. It is to help users understand which organisation has a potential requirement, which people are relevant to that requirement, and what the appropriate next action may be."
    ]
   },
   {
    "q": "How does Qura's opportunity scoring work?",
    "a": [
     "Qura's scoring is designed to help suppliers prioritise opportunities rather than treating every market signal equally.",
     "Available information about the opportunity can be considered alongside factors relevant to the supplier's capability and market.",
     "The resulting score should be viewed as a business-development prioritisation tool, not a prediction that a contract will definitely be won.",
     "A high score means “investigate and prioritise this”; it does not mean “Qura guarantees you will win this.”"
    ]
   },
   {
    "q": "Can Qura create outreach for my business?",
    "a": [
     "Yes. Qura's AI tools can use the context surrounding an organisation and opportunity to help draft relevant outreach and proposals.",
     "This is fundamentally different from producing the same generic sales message for hundreds of contacts.",
     "The aim is to give the user a useful first draft informed by the available opportunity and organisation context. Users remain responsible for reviewing, approving and sending their communications."
    ]
   },
   {
    "q": "Can Qura generate proposals from opportunities?",
    "a": [
     "Qura can assist in turning identified opportunities into structured proposal content.",
     "Where sufficient information is available, AI can use the opportunity, organisation and relevant business context to create a first draft significantly faster than starting from a blank document.",
     "The supplier should review commercial claims, pricing, delivery capacity, contractual commitments, regulatory statements and other material information before anything is submitted externally.",
     "AI accelerates proposal creation; it does not accept commercial responsibility on behalf of the supplier."
    ]
   },
   {
    "q": "Is Qura a replacement for our CRM?",
    "a": [
     "For healthcare business-development activity, Qura contains CRM functionality designed specifically around healthcare.",
     "Users can track opportunities, contacts, candidate activity, conversations, meetings and pipeline progression while connecting these activities to the market intelligence that originally created the opportunity.",
     "This is important because Qura is not simply storing a sales record after someone has found an opportunity elsewhere. The intelligence, opportunity, relevant stakeholders and subsequent pipeline activity can exist within the same environment."
    ]
   },
   {
    "q": "What happens when Qura detects a tender?",
    "a": [
     "Relevant tenders and procurement opportunities can be surfaced as commercial intelligence.",
     "The user can then review the opportunity, relevant organisation, available deadline and supporting information before deciding whether to pursue it.",
     "Qura can help with research, prioritisation and drafting, but suppliers remain responsible for checking the official procurement documentation and complying with the buyer's formal procurement process."
    ]
   },
   {
    "q": "Does being on Qura mean my agency is automatically approved by hospitals?",
    "a": [
     "No. Qura membership or visibility does not constitute NHS, hospital, framework, procurement or regulatory approval.",
     "Healthcare organisations remain responsible for their own supplier governance and procurement processes."
    ]
   }
  ]
 },
 {
  "id": "provider",
  "label": "Hospitals & providers",
  "accent": "#0E6B4F",
  "items": [
   {
    "q": "How can healthcare providers use Qura to find clinicians?",
    "a": [
     "Healthcare providers can use Qura to search and discover registered clinician profiles based on relevant professional information such as profession, specialty, experience, location and other available criteria.",
     "Because Qura verification occurs before clinician profiles become available within the professional ecosystem, providers can begin their search with a more structured pool of healthcare professionals.",
     "This does not remove the provider's responsibility for its own recruitment and compliance checks."
    ]
   },
   {
    "q": "Can a hospital approach a clinician directly?",
    "a": [
     "Where the platform workflow permits an introduction, Qura is designed to allow healthcare organisations and clinicians to connect without automatically exposing the clinician's private contact information.",
     "The clinician remains in control of whether to proceed.",
     "This creates a middle ground between a completely public CV database and the traditional model where clinicians must repeatedly submit applications before an employer knows they exist."
    ]
   },
   {
    "q": "How can providers compare workforce or medical suppliers?",
    "a": [
     "Qura is designed to make supplier discovery more structured.",
     "Rather than relying only on existing relationships or whichever company happens to make contact first, providers can identify relevant suppliers and assess available information about their capabilities and alignment.",
     "The purpose is to broaden visibility of the market and help providers make better-informed decisions.",
     "Formal due diligence, procurement, contracting and supplier approval remain the responsibility of the healthcare organisation."
    ]
   },
   {
    "q": "Does Qura select the best supplier for a hospital?",
    "a": [
     "No. Qura may surface relevant suppliers or indicate potential alignment based on available information, but it does not replace procurement or organisational judgement.",
     "Supplier selection can involve pricing, clinical governance, compliance, framework status, service capability, financial standing, references, contractual requirements and local procurement policy.",
     "Qura supports the decision. It does not make the decision."
    ]
   },
   {
    "q": "Can providers post vacancies and workforce requirements?",
    "a": [
     "Yes. Providers can use Qura to expose requirements to the relevant marketplace, helping suitable clinicians and workforce partners discover demand more quickly.",
     "Because Qura connects multiple lenses, the same demand can potentially generate different relevant responses across the ecosystem instead of remaining isolated on one traditional job board."
    ]
   }
  ]
 },
 {
  "id": "medical",
  "label": "Medical suppliers",
  "accent": "#B8893B",
  "items": [
   {
    "q": "How is Qura useful to a medical supplier that does not recruit clinicians?",
    "a": [
     "Qura's commercial-intelligence model is not limited to recruitment.",
     "Medical, technology and healthcare suppliers also face the problem of identifying where demand exists, which organisations are changing services, which programmes are developing, who the relevant stakeholders are and how to approach them.",
     "Qura can help connect healthcare market intelligence with decision-maker mapping and CRM activity so commercial teams can prioritise organisations and opportunities more efficiently."
    ]
   },
   {
    "q": "Can Qura tell us who to contact within an NHS organisation?",
    "a": [
     "Where appropriate information is available, Qura can map relevant decision-makers and organisational stakeholders.",
     "The value is in connecting the contact to the context.",
     "Instead of simply showing that someone works at an NHS Trust or healthcare organisation, the platform is intended to help commercial users understand why that organisation or stakeholder may be relevant to the opportunity they are researching."
    ]
   },
   {
    "q": "Can Qura guarantee that decision-maker information is always current?",
    "a": [
     "No professional intelligence platform should make that guarantee.",
     "Healthcare leadership changes frequently.",
     "Qura is designed to reduce the problem of stale manual databases through continuously maintained intelligence, but users should verify critical contact or organisational information before significant commercial activity."
    ]
   }
  ]
 },
 {
  "id": "gpcare",
  "label": "GP & care",
  "accent": "#C2410C",
  "items": [
   {
    "q": "How does Qura support GP practices and care organisations?",
    "a": [
     "GP and care organisations can use the ecosystem to help identify available healthcare professionals and address workforce requirements while benefiting from Qura's wider healthcare marketplace.",
     "The platform is designed to connect demand with suitable workforce more quickly while retaining appropriate compliance and verification processes."
    ]
   },
   {
    "q": "Can Qura automatically fill an urgent shift?",
    "a": [
     "Qura can help surface the requirement and connect it with potentially relevant workforce, but an algorithmic match is not the same as a confirmed booking.",
     "The provider and professional must still complete the necessary acceptance, availability and compliance processes.",
     "This distinction is particularly important in healthcare, where speed should never be confused with bypassing governance."
    ]
   }
  ]
 },
 {
  "id": "ai",
  "label": "AI, privacy & trust",
  "accent": "#0891B2",
  "items": [
   {
    "q": "What decisions does Qura AI make and what remains human?",
    "a": [
     "A simple principle applies: AI supports intelligence. Humans retain judgement.",
     "AI can help Qura search, organise, categorise, match, score, summarise and draft.",
     "Human users remain responsible for consequential decisions such as hiring, shortlisting, rejecting candidates, awarding contracts, approving suppliers and making clinical or procurement decisions.",
     "Qura uses AI to reduce the administrative work surrounding healthcare relationships rather than attempting to remove the people from them."
    ]
   },
   {
    "q": "Is Qura scraping private information?",
    "a": [
     "Qura's decision-maker intelligence is based on appropriate professional and public business information rather than creating access to people's private accounts.",
     "The purpose is to organise relevant healthcare-market information that commercial teams would otherwise have to research manually.",
     "Personal data should always be processed in accordance with Qura's privacy policy and applicable data-protection requirements."
    ]
   },
   {
    "q": "Does Qura sell clinician data?",
    "a": [
     "No. Clinician information should not be treated as a commodity for sale. Clinicians maintain control over their professional visibility and introductions in accordance with Qura's platform controls and privacy policies."
    ]
   },
   {
    "q": "Can users rely completely on AI-generated information?",
    "a": [
     "No. AI-generated summaries, recommendations, scores, proposals and other outputs should be treated as decision-support tools.",
     "Users should review important information before acting on it, particularly where it relates to contracts, procurement, employment, professional registration, immigration, regulatory requirements or financial commitments."
    ]
   }
  ]
 },
 {
  "id": "academy",
  "label": "Qura Academy",
  "accent": "#B8893B",
  "items": [
   {
    "q": "What is the purpose of Qura Academy?",
    "a": [
     "Qura Academy is intended to complement the platform by helping users understand the skills, processes and behaviours required to use healthcare market intelligence effectively.",
     "This is particularly important because having access to decision-makers, opportunities and AI tools does not automatically make someone effective at healthcare business development.",
     "The learning environment helps users understand how to interpret opportunities, approach organisations appropriately and use Qura's capabilities responsibly."
    ]
   },
   {
    "q": "Does completing a Qura course mean someone is professionally or clinically accredited?",
    "a": [
     "No, unless a particular course explicitly states otherwise.",
     "A Qura course or certificate confirms completion of the relevant Qura learning programme. It should not be interpreted as professional registration, statutory clinical accreditation or endorsement by an external healthcare regulator unless specifically stated."
    ]
   }
  ]
 },
 {
  "id": "edge",
  "label": "Edge cases",
  "accent": "#5A6783",
  "items": [
   {
    "q": "What happens if Qura's data and an organisation's official information are different?",
    "a": [
     "The official source should be checked before a consequential decision is made.",
     "Qura exists to accelerate healthcare intelligence and discovery, but healthcare organisations, leadership teams, procurement exercises and vacancies can change quickly.",
     "Where information is critical to an application, tender, contract or regulatory decision, users should confirm it with the relevant authoritative source."
    ]
   },
   {
    "q": "What happens if AI incorrectly matches me with an opportunity?",
    "a": [
     "A Qura match is a recommendation rather than an instruction.",
     "Users should review the underlying opportunity and decide whether it is genuinely relevant.",
     "Matching should improve as the quality and completeness of user profile information increases."
    ]
   },
   {
    "q": "Why does Qura still need humans if it uses AI?",
    "a": [
     "Because healthcare is fundamentally relationship-driven.",
     "AI is extremely useful for analysing large amounts of fragmented information, identifying patterns, removing repetitive research and producing first drafts.",
     "It is considerably less suited to replacing trust, negotiation, professional judgement, relationship-building and accountability.",
     "Qura therefore uses AI to reduce the administrative work surrounding healthcare relationships rather than attempting to remove the people from them."
    ]
   },
   {
    "q": "What happens after Qura makes a connection?",
    "a": [
     "That is where Qura's ecosystem model becomes important.",
     "Discovery is only the beginning.",
     "Depending on the user and opportunity, the next stage might involve an introduction, application, conversation, meeting, proposal, supplier assessment or progression through a pipeline.",
     "Qura is designed to help users move from:",
     "Intelligence → Match → Connection → Action → Tracking",
     "rather than simply presenting information and leaving the user to manage everything elsewhere."
    ]
   }
  ]
 }
];

// The six worth surfacing above the fold. Each settles something a sceptical
// reader asks before trusting anything else on the page.
export const MOST_ASKED = [1, 3, 6, 17, 25, 36];
