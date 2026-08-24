// Qura Academy — lesson content, from the founder's Lesson Content Backend v1.
// Each lesson maps 1:1 to the assessment concept it teaches, which is why the
// counts here (10, 10, 10, 10, 30) match the question banks exactly. The
// assessment stays locked until every lesson is complete.
//
// No answers here. The keys live server-side in api/_academy_bank.js.

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
    "lessons": [
      {
        "id": "QE-L01",
        "title": "Understanding the Qura ecosystem",
        "principle": "A healthcare ecosystem connecting people, providers, suppliers, intelligence and opportunities.",
        "explanation": "On Qura, the working rule is: A healthcare ecosystem connecting people, providers, suppliers, intelligence and opportunities. Qura connects multiple healthcare-market participants and workflows. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Qura connects multiple healthcare-market participants and workflows.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new imaging opportunity appears. Instead of messaging every contact, the user checks the organisation, requirement and relevant stakeholder first.",
        "mistake": "A generic jobs board.",
        "takeaway": "Remember: A healthcare ecosystem connecting people, providers, suppliers, intelligence and opportunities."
      },
      {
        "id": "QE-L02",
        "title": "Research before outreach",
        "principle": "Review the organisation, requirement and relevant decision-maker intelligence.",
        "explanation": "On Qura, the working rule is: Review the organisation, requirement and relevant decision-maker intelligence. Relevant engagement begins with understanding context. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Relevant engagement begins with understanding context.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A clinician, provider and supplier can all use Qura differently because each sees information and actions through the lens relevant to their role.",
        "mistake": "Send the same message to every contact.",
        "takeaway": "Remember: Review the organisation, requirement and relevant decision-maker intelligence."
      },
      {
        "id": "QE-L03",
        "title": "Your Qura lens",
        "principle": "To tailor the experience to the user's role in healthcare.",
        "explanation": "On Qura, the working rule is: To tailor the experience to the user's role in healthcare. Lenses surface the most relevant tools and information. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Lenses surface the most relevant tools and information.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A tender appears in the feed. It is treated as a signal to qualify, not as proof that a contract is already available to win.",
        "mistake": "To change subscription currency.",
        "takeaway": "Remember: To tailor the experience to the user's role in healthcare."
      },
      {
        "id": "QE-L04",
        "title": "Responsible platform use",
        "principle": "Use verified context to contact relevant stakeholders with a clear reason.",
        "explanation": "On Qura, the working rule is: Use verified context to contact relevant stakeholders with a clear reason. Qura should improve relevance, not create spam. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Qura should improve relevance, not create spam.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new imaging opportunity appears. Instead of messaging every contact, the user checks the organisation, requirement and relevant stakeholder first.",
        "mistake": "Mass-message every decision maker.",
        "takeaway": "Remember: Use verified context to contact relevant stakeholders with a clear reason."
      },
      {
        "id": "QE-L05",
        "title": "The opportunity discovery workflow",
        "principle": "Search → Filter → Intelligence → Decision maker → Engage.",
        "explanation": "On Qura, the working rule is: Search → Filter → Intelligence → Decision maker → Engage. Discovery should precede engagement. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Discovery should precede engagement.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A clinician, provider and supplier can all use Qura differently because each sees information and actions through the lens relevant to their role.",
        "mistake": "Pitch → Search → Research → Qualify.",
        "takeaway": "Remember: Search → Filter → Intelligence → Decision maker → Engage."
      },
      {
        "id": "QE-L06",
        "title": "Who Qura connects",
        "principle": "Clinicians, providers, suppliers and healthcare leaders.",
        "explanation": "On Qura, the working rule is: Clinicians, providers, suppliers and healthcare leaders. Qura spans multiple healthcare participant types. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Qura spans multiple healthcare participant types.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A tender appears in the feed. It is treated as a signal to qualify, not as proof that a contract is already available to win.",
        "mistake": "Clinicians only.",
        "takeaway": "Remember: Clinicians, providers, suppliers and healthcare leaders."
      },
      {
        "id": "QE-L07",
        "title": "Trustworthy profiles",
        "principle": "Accurate and current.",
        "explanation": "On Qura, the working rule is: Accurate and current. Trust depends on accurate, current profiles. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A new imaging opportunity appears. Instead of messaging every contact, the user checks the organisation, requirement and relevant stakeholder first.",
        "mistake": "Anonymous and incomplete.",
        "takeaway": "Remember: Accurate and current."
      },
      {
        "id": "QE-L08",
        "title": "Understanding tenders",
        "principle": "A formal opportunity or procurement signal that still requires qualification.",
        "explanation": "On Qura, the working rule is: A formal opportunity or procurement signal that still requires qualification. A tender is an opportunity signal, not a guaranteed win. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "A tender is evidence of a potential route to market, not a guaranteed win.",
        "apply": "Check fit, evidence requirements, deadline, stakeholder path and commercial viability before committing resource.",
        "example": "A clinician, provider and supplier can all use Qura differently because each sees information and actions through the lens relevant to their role.",
        "mistake": "A guaranteed contract.",
        "takeaway": "Remember: A formal opportunity or procurement signal that still requires qualification."
      },
      {
        "id": "QE-L09",
        "title": "Finding the relevant stakeholder",
        "principle": "Find the stakeholder relevant to the problem or buying process.",
        "explanation": "On Qura, the working rule is: Find the stakeholder relevant to the problem or buying process. Relevance matters more than seniority alone. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "Map a person to the problem, influence and buying process - not just to a job title.",
        "apply": "The person experiencing the problem, controlling budget and signing the contract may be different people.",
        "example": "A tender appears in the feed. It is treated as a signal to qualify, not as proof that a contract is already available to win.",
        "mistake": "Contact them anyway.",
        "takeaway": "Remember: Find the stakeholder relevant to the problem or buying process."
      },
      {
        "id": "QE-L10",
        "title": "Why Qura Academy exists",
        "principle": "To improve how users understand and operate within the healthcare market and Qura ecosystem.",
        "explanation": "On Qura, the working rule is: To improve how users understand and operate within the healthcare market and Qura ecosystem. The academy combines platform fluency with healthcare-market capability. Before taking an action, the learner should be able to explain what information they are using and why the next step is relevant.",
        "why": "The academy combines platform fluency with healthcare-market capability.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new imaging opportunity appears. Instead of messaging every contact, the user checks the organisation, requirement and relevant stakeholder first.",
        "mistake": "Only to explain buttons.",
        "takeaway": "Remember: To improve how users understand and operate within the healthcare market and Qura ecosystem."
      }
    ]
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
    "lessons": [
      {
        "id": "QCR-L01",
        "title": "Build a profile that proves fit",
        "principle": "Accurate specialty, experience, availability and supporting information.",
        "explanation": "For a clinician, the practical rule is: Accurate specialty, experience, availability and supporting information. Decision-makers need concise evidence of fit and availability. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A sonographer updates availability after accepting a three-month contract, preventing organisations from approaching them for an immediate start that is no longer possible.",
        "mistake": "A long personal biography.",
        "takeaway": "Remember: Accurate specialty, experience, availability and supporting information."
      },
      {
        "id": "QCR-L02",
        "title": "Keep availability current",
        "principle": "Whenever it materially changes.",
        "explanation": "For a clinician, the practical rule is: Whenever it materially changes. Current availability improves matching quality. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A clinician sees a matched role requiring a modality they have not practised. They do not alter their profile; they focus on roles that match their documented experience.",
        "mistake": "Only once at registration.",
        "takeaway": "Remember: Whenever it materially changes."
      },
      {
        "id": "QCR-L03",
        "title": "Control who represents you",
        "principle": "Know who is representing you and for which opportunity.",
        "explanation": "For a clinician, the practical rule is: Know who is representing you and for which opportunity. Clear representation reduces duplication and confusion. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Clear representation reduces duplication and confusion.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A clinician confirms which supplier is representing them for a specific vacancy so the same CV is not submitted by multiple parties.",
        "mistake": "Allow unlimited duplicate submissions.",
        "takeaway": "Remember: Know who is representing you and for which opportunity."
      },
      {
        "id": "QCR-L04",
        "title": "Match honestly to opportunities",
        "principle": "Respond accurately and focus on roles matching your evidence.",
        "explanation": "For a clinician, the practical rule is: Respond accurately and focus on roles matching your evidence. Accurate matching protects clinicians and providers. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Accurate matching protects clinicians and providers.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A sonographer updates availability after accepting a three-month contract, preventing organisations from approaching them for an immediate start that is no longer possible.",
        "mistake": "Claim equivalent experience.",
        "takeaway": "Remember: Respond accurately and focus on roles matching your evidence."
      },
      {
        "id": "QCR-L05",
        "title": "Become opportunity-ready",
        "principle": "Having relevant information and documentation current enough to act when a suitable opportunity appears.",
        "explanation": "For a clinician, the practical rule is: Having relevant information and documentation current enough to act when a suitable opportunity appears. Readiness is about reducing avoidable friction. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Readiness is about reducing avoidable friction.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A clinician sees a matched role requiring a modality they have not practised. They do not alter their profile; they focus on roles that match their documented experience.",
        "mistake": "Applying to every vacancy.",
        "takeaway": "Remember: Having relevant information and documentation current enough to act when a suitable opportunity appears."
      },
      {
        "id": "QCR-L06",
        "title": "Maintain long-term career visibility",
        "principle": "Long-term visibility can support future career progression and relevant approaches.",
        "explanation": "For a clinician, the practical rule is: Long-term visibility can support future career progression and relevant approaches. Qura is intended as an ongoing healthcare career profile. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A clinician confirms which supplier is representing them for a specific vacancy so the same CV is not submitted by multiple parties.",
        "mistake": "There is no reason.",
        "takeaway": "Remember: Long-term visibility can support future career progression and relevant approaches."
      },
      {
        "id": "QCR-L07",
        "title": "Check fit before responding",
        "principle": "Check the requirements and your fit.",
        "explanation": "For a clinician, the practical rule is: Check the requirements and your fit. The details determine genuine fit. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "The details determine genuine fit.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A sonographer updates availability after accepting a three-month contract, preventing organisations from approaching them for an immediate start that is no longer possible.",
        "mistake": "Forward it publicly.",
        "takeaway": "Remember: Check the requirements and your fit."
      },
      {
        "id": "QCR-L08",
        "title": "Write an evidence-based profile",
        "principle": "A clear, evidence-based summary of specialty, experience and target opportunities.",
        "explanation": "For a clinician, the practical rule is: A clear, evidence-based summary of specialty, experience and target opportunities. Specific evidence improves trust and discovery. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A clinician sees a matched role requiring a modality they have not practised. They do not alter their profile; they focus on roles that match their documented experience.",
        "mistake": "'Can do anything'.",
        "takeaway": "Remember: A clear, evidence-based summary of specialty, experience and target opportunities."
      },
      {
        "id": "QCR-L09",
        "title": "Understand the Career Ready credential",
        "principle": "Completion of Qura's career-readiness learning pathway.",
        "explanation": "For a clinician, the practical rule is: Completion of Qura's career-readiness learning pathway. It is a platform credential, not a guarantee or regulator-issued status. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "It is a platform credential, not a guarantee or regulator-issued status.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A clinician confirms which supplier is representing them for a specific vacancy so the same CV is not submitted by multiple parties.",
        "mistake": "Guaranteed employment.",
        "takeaway": "Remember: Completion of Qura's career-readiness learning pathway."
      },
      {
        "id": "QCR-L10",
        "title": "Protect your professional visibility",
        "principle": "Keeping information current and responding appropriately.",
        "explanation": "For a clinician, the practical rule is: Keeping information current and responding appropriately. Consistency and accuracy improve professional trust. This keeps the profile credible and helps providers or suppliers make decisions from evidence rather than assumptions.",
        "why": "Consistency and accuracy improve professional trust.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A sonographer updates availability after accepting a three-month contract, preventing organisations from approaching them for an immediate start that is no longer possible.",
        "mistake": "Ignoring messages for months.",
        "takeaway": "Remember: Keeping information current and responding appropriately."
      }
    ]
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
    "lessons": [
      {
        "id": "QPC-L01",
        "title": "Assess supplier fit with evidence",
        "principle": "Relevant capability, evidence, track record and fit.",
        "explanation": "For a healthcare provider, the principle is: Relevant capability, evidence, track record and fit. Supplier choice should be evidence-led. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Supplier choice should be evidence-led.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A provider needs a specialist diagnostic partner. They filter for relevant capability, review evidence and feedback, then invite only the strongest-fit suppliers to a discussion.",
        "mistake": "Logo design only.",
        "takeaway": "Remember: Relevant capability, evidence, track record and fit."
      },
      {
        "id": "QPC-L02",
        "title": "Use ratings as one decision signal",
        "principle": "As one useful signal alongside the provider's own due diligence and governance.",
        "explanation": "For a healthcare provider, the principle is: As one useful signal alongside the provider's own due diligence and governance. Ratings inform decisions but do not replace governance. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Treat ratings as decision support, not a substitute for due diligence.",
        "apply": "Feedback should be factual, relevant and free of confidential or unverified information.",
        "example": "A supplier has excellent ratings, but the provider still carries out its own procurement, compliance and governance checks before contracting.",
        "mistake": "As the only procurement criterion.",
        "takeaway": "Remember: As one useful signal alongside the provider's own due diligence and governance."
      },
      {
        "id": "QPC-L03",
        "title": "Build a relevant supplier shortlist",
        "principle": "Filter for relevant capability and review comparable profiles.",
        "explanation": "For a healthcare provider, the principle is: Filter for relevant capability and review comparable profiles. Structured discovery creates a more relevant shortlist. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Structured discovery creates a more relevant shortlist.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new service launches and creates a workforce gap. That operational change is a valid reason to review the supplier market.",
        "mistake": "Contact every supplier.",
        "takeaway": "Remember: Filter for relevant capability and review comparable profiles."
      },
      {
        "id": "QPC-L04",
        "title": "Post requirements clearly",
        "principle": "Clear scope, need, timing and relevant context.",
        "explanation": "For a healthcare provider, the principle is: Clear scope, need, timing and relevant context. Clarity improves response quality. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Clarity improves response quality.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A provider needs a specialist diagnostic partner. They filter for relevant capability, review evidence and feedback, then invite only the strongest-fit suppliers to a discussion.",
        "mistake": "Being vague.",
        "takeaway": "Remember: Clear scope, need, timing and relevant context."
      },
      {
        "id": "QPC-L05",
        "title": "Qura and local procurement rules",
        "principle": "No.",
        "explanation": "For a healthcare provider, the principle is: No. Qura supports discovery and intelligence; local governance remains applicable. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Qura supports discovery and intelligence; local governance remains applicable.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A supplier has excellent ratings, but the provider still carries out its own procurement, compliance and governance checks before contracting.",
        "mistake": "Yes.",
        "takeaway": "Remember: No."
      },
      {
        "id": "QPC-L06",
        "title": "Compare before you meet",
        "principle": "It can reduce low-value meetings and focus time on relevant suppliers.",
        "explanation": "For a healthcare provider, the principle is: It can reduce low-value meetings and focus time on relevant suppliers. Pre-qualification improves efficiency. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "A new service launches and creates a workforce gap. That operational change is a valid reason to review the supplier market.",
        "mistake": "It guarantees the lowest price.",
        "takeaway": "Remember: It can reduce low-value meetings and focus time on relevant suppliers."
      },
      {
        "id": "QPC-L07",
        "title": "Leave responsible supplier feedback",
        "principle": "Be factual and based on relevant experience.",
        "explanation": "For a healthcare provider, the principle is: Be factual and based on relevant experience. Ratings should be credible and responsible. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Treat ratings as decision support, not a substitute for due diligence.",
        "apply": "Feedback should be factual, relevant and free of confidential or unverified information.",
        "example": "A provider needs a specialist diagnostic partner. They filter for relevant capability, review evidence and feedback, then invite only the strongest-fit suppliers to a discussion.",
        "mistake": "Use rumours.",
        "takeaway": "Remember: Be factual and based on relevant experience."
      },
      {
        "id": "QPC-L08",
        "title": "Recognise when to review the market",
        "principle": "A new service or workforce requirement.",
        "explanation": "For a healthcare provider, the principle is: A new service or workforce requirement. Operational change can create a legitimate supplier need. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Operational change can create a legitimate supplier need.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A supplier has excellent ratings, but the provider still carries out its own procurement, compliance and governance checks before contracting.",
        "mistake": "A change in office furniture.",
        "takeaway": "Remember: A new service or workforce requirement."
      },
      {
        "id": "QPC-L09",
        "title": "Use market intelligence to inform decisions",
        "principle": "Supporting better-informed decisions.",
        "explanation": "For a healthcare provider, the principle is: Supporting better-informed decisions. Intelligence supports, rather than replaces, decision-making. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Intelligence supports, rather than replaces, decision-making.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new service launches and creates a workforce gap. That operational change is a valid reason to review the supplier market.",
        "mistake": "Replacing all human judgement.",
        "takeaway": "Remember: Supporting better-informed decisions."
      },
      {
        "id": "QPC-L10",
        "title": "Move from discovery into governance",
        "principle": "Follow the organisation's appropriate evaluation, engagement and procurement process.",
        "explanation": "For a healthcare provider, the principle is: Follow the organisation's appropriate evaluation, engagement and procurement process. Platform discovery does not supersede organisational controls. Qura should accelerate discovery and comparison while leaving formal governance, contracting and local policy with the organisation.",
        "why": "Platform discovery does not supersede organisational controls.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A provider needs a specialist diagnostic partner. They filter for relevant capability, review evidence and feedback, then invite only the strongest-fit suppliers to a discussion.",
        "mistake": "Automatically award a contract.",
        "takeaway": "Remember: Follow the organisation's appropriate evaluation, engagement and procurement process."
      }
    ]
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
    "lessons": [
      {
        "id": "QSC-L01",
        "title": "Contact providers for a relevant reason",
        "principle": "You have identified a relevant problem, change or opportunity your organisation can credibly address.",
        "explanation": "For a supplier using Qura commercially, the principle is: You have identified a relevant problem, change or opportunity your organisation can credibly address. Relevance is the foundation of good healthcare BD. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Relevance is the foundation of good healthcare BD.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A trust announces service expansion. The supplier identifies the likely requirement and relevant decision-maker before drafting outreach.",
        "mistake": "You have their email address.",
        "takeaway": "Remember: You have identified a relevant problem, change or opportunity your organisation can credibly address."
      },
      {
        "id": "QSC-L02",
        "title": "Understand why a decision-maker matters",
        "principle": "Why a stakeholder may matter to the requirement or buying process.",
        "explanation": "For a supplier using Qura commercially, the principle is: Why a stakeholder may matter to the requirement or buying process. Role relevance matters more than contact volume. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Map a person to the problem, influence and buying process - not just to a job title.",
        "apply": "The person experiencing the problem, controlling budget and signing the contract may be different people.",
        "example": "A tender fits the supplier’s specialty but requires evidence the business cannot provide. The opportunity is qualified out rather than pursued simply to increase bid volume.",
        "mistake": "Only a person's name.",
        "takeaway": "Remember: Why a stakeholder may matter to the requirement or buying process."
      },
      {
        "id": "QSC-L03",
        "title": "Recognise opportunity signals",
        "principle": "All of the above.",
        "explanation": "For a supplier using Qura commercially, the principle is: All of the above. All can indicate emerging demand. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "All can indicate emerging demand.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "After a productive meeting, the supplier records the agreed action, owner and date in Qura CRM so the opportunity has a concrete next step.",
        "mistake": "Service expansion.",
        "takeaway": "Remember: All of the above."
      },
      {
        "id": "QSC-L04",
        "title": "Make your supplier profile credible",
        "principle": "Verifiable capability and relevant differentiation.",
        "explanation": "For a supplier using Qura commercially, the principle is: Verifiable capability and relevant differentiation. Buyers need credible evidence of fit. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Keep information factual, specific and current.",
        "apply": "Only include claims or availability you would be comfortable having a provider verify.",
        "example": "A trust announces service expansion. The supplier identifies the likely requirement and relevant decision-maker before drafting outreach.",
        "mistake": "Generic claims only.",
        "takeaway": "Remember: Verifiable capability and relevant differentiation."
      },
      {
        "id": "QSC-L05",
        "title": "Set concrete CRM next actions",
        "principle": "A specific action, owner and sensible timing.",
        "explanation": "For a supplier using Qura commercially, the principle is: A specific action, owner and sensible timing. Pipeline discipline depends on concrete next steps. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Pipeline discipline depends on concrete next steps.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A tender fits the supplier’s specialty but requires evidence the business cannot provide. The opportunity is qualified out rather than pursued simply to increase bid volume.",
        "mistake": "'Follow up sometime'.",
        "takeaway": "Remember: A specific action, owner and sensible timing."
      },
      {
        "id": "QSC-L06",
        "title": "Qualify tenders before bidding",
        "principle": "Qualify fit, requirements, timing and commercial viability.",
        "explanation": "For a supplier using Qura commercially, the principle is: Qualify fit, requirements, timing and commercial viability. Not every tender is worth pursuing. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "A tender is evidence of a potential route to market, not a guaranteed win.",
        "apply": "Check fit, evidence requirements, deadline, stakeholder path and commercial viability before committing resource.",
        "example": "After a productive meeting, the supplier records the agreed action, owner and date in Qura CRM so the opportunity has a concrete next step.",
        "mistake": "Bid immediately.",
        "takeaway": "Remember: Qualify fit, requirements, timing and commercial viability."
      },
      {
        "id": "QSC-L07",
        "title": "Open outreach with context",
        "principle": "A concise reference to a relevant provider need or market signal and why it may be worth speaking.",
        "explanation": "For a supplier using Qura commercially, the principle is: A concise reference to a relevant provider need or market signal and why it may be worth speaking. Context creates a credible reason for engagement. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Context creates a credible reason for engagement.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A trust announces service expansion. The supplier identifies the likely requirement and relevant decision-maker before drafting outreach.",
        "mistake": "'Just introducing our company'.",
        "takeaway": "Remember: A concise reference to a relevant provider need or market signal and why it may be worth speaking."
      },
      {
        "id": "QSC-L08",
        "title": "Use opportunity scoring to prioritise",
        "principle": "Prioritise attention using relevant signals.",
        "explanation": "For a supplier using Qura commercially, the principle is: Prioritise attention using relevant signals. Scoring helps focus effort. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Technology should support professional judgement rather than replace it.",
        "apply": "Review the source context, accuracy and next action before relying on an automated output.",
        "example": "A tender fits the supplier’s specialty but requires evidence the business cannot provide. The opportunity is qualified out rather than pursued simply to increase bid volume.",
        "mistake": "Guarantee revenue.",
        "takeaway": "Remember: Prioritise attention using relevant signals."
      },
      {
        "id": "QSC-L09",
        "title": "Advance the opportunity after meetings",
        "principle": "Record agreed actions and advance the opportunity appropriately.",
        "explanation": "For a supplier using Qura commercially, the principle is: Record agreed actions and advance the opportunity appropriately. Clear next steps maintain momentum. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "After a productive meeting, the supplier records the agreed action, owner and date in Qura CRM so the opportunity has a concrete next step.",
        "mistake": "Wait indefinitely.",
        "takeaway": "Remember: Record agreed actions and advance the opportunity appropriately."
      },
      {
        "id": "QSC-L10",
        "title": "Represent the Supplier Certified credential accurately",
        "principle": "A user has completed Qura's supplier learning pathway.",
        "explanation": "For a supplier using Qura commercially, the principle is: A user has completed Qura's supplier learning pathway. The credential must be represented accurately. The learner should use Qura intelligence to narrow effort toward opportunities where there is a credible reason to engage.",
        "why": "The credential must be represented accurately.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A trust announces service expansion. The supplier identifies the likely requirement and relevant decision-maker before drafting outreach.",
        "mistake": "The supplier has won an NHS framework.",
        "takeaway": "Remember: A user has completed Qura's supplier learning pathway."
      }
    ]
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
    "lessons": [
      {
        "id": "QBD-L01",
        "title": "Qualify change before you pitch",
        "principle": "Qualify what is changing, likely need and relevant stakeholders.",
        "explanation": "The Qura Qualified standard is: Qualify what is changing, likely need and relevant stakeholders. Change is a signal; qualification comes first. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Change is a signal; qualification comes first.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Send a generic company deck.",
        "takeaway": "Remember: Qualify what is changing, likely need and relevant stakeholders."
      },
      {
        "id": "QBD-L02",
        "title": "Seniority does not equal decision ownership",
        "principle": "No one; decision influence depends on the specific requirement.",
        "explanation": "The Qura Qualified standard is: No one; decision influence depends on the specific requirement. Titles alone do not prove ownership of a decision. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Map a person to the problem, influence and buying process - not just to a job title.",
        "apply": "The person experiencing the problem, controlling budget and signing the contract may be different people.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "The CEO.",
        "takeaway": "Remember: No one; decision influence depends on the specific requirement."
      },
      {
        "id": "QBD-L03",
        "title": "QURA Method: Qualify",
        "principle": "Qualify.",
        "explanation": "The Qura Qualified standard is: Qualify. Q = Qualify. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Q = Qualify.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Reach.",
        "takeaway": "Remember: Qualify."
      },
      {
        "id": "QBD-L04",
        "title": "QURA Method: Understand",
        "principle": "Understand the organisation, problem, stakeholder context and commercial situation.",
        "explanation": "The Qura Qualified standard is: Understand the organisation, problem, stakeholder context and commercial situation. Understanding creates relevant engagement. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Understanding creates relevant engagement.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Read the contact's social media only.",
        "takeaway": "Remember: Understand the organisation, problem, stakeholder context and commercial situation."
      },
      {
        "id": "QBD-L05",
        "title": "Use signals to make outreach relevant",
        "principle": "When it is tied to a credible signal or problem.",
        "explanation": "The Qura Qualified standard is: When it is tied to a credible signal or problem. Signal-led relevance improves quality. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Signal-led relevance improves quality.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "When sent to the largest possible list.",
        "takeaway": "Remember: When it is tied to a credible signal or problem."
      },
      {
        "id": "QBD-L06",
        "title": "Redirect when you have the wrong stakeholder",
        "principle": "Politely clarify who owns the area if appropriate, then update the stakeholder map.",
        "explanation": "The Qura Qualified standard is: Politely clarify who owns the area if appropriate, then update the stakeholder map. Good BD learns and redirects respectfully. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Good BD learns and redirects respectfully.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Keep pitching.",
        "takeaway": "Remember: Politely clarify who owns the area if appropriate, then update the stakeholder map."
      },
      {
        "id": "QBD-L07",
        "title": "Build an account map",
        "principle": "Structuring organisations, stakeholders, needs and opportunity signals within a target market.",
        "explanation": "The Qura Qualified standard is: Structuring organisations, stakeholders, needs and opportunity signals within a target market. Account mapping creates commercial context. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Account mapping creates commercial context.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Collecting as many emails as possible.",
        "takeaway": "Remember: Structuring organisations, stakeholders, needs and opportunity signals within a target market."
      },
      {
        "id": "QBD-L08",
        "title": "Know what makes an opportunity qualified",
        "principle": "There is a defined need, plausible fit, stakeholder path and sensible timing.",
        "explanation": "The Qura Qualified standard is: There is a defined need, plausible fit, stakeholder path and sensible timing. Qualification requires more than engagement activity. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Qualification requires more than engagement activity.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "A contact opened an email.",
        "takeaway": "Remember: There is a defined need, plausible fit, stakeholder path and sensible timing."
      },
      {
        "id": "QBD-L09",
        "title": "Use discovery questions properly",
        "principle": "To understand the problem, impact, current approach, stakeholders and next step.",
        "explanation": "The Qura Qualified standard is: To understand the problem, impact, current approach, stakeholders and next step. Discovery establishes whether and how to progress. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Discovery establishes whether and how to progress.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "To fill time.",
        "takeaway": "Remember: To understand the problem, impact, current approach, stakeholders and next step."
      },
      {
        "id": "QBD-L10",
        "title": "Disqualify poor-fit opportunities professionally",
        "principle": "Disqualify or redirect the opportunity professionally.",
        "explanation": "The Qura Qualified standard is: Disqualify or redirect the opportunity professionally. Professional qualification includes saying no. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Saying no to a weak opportunity is a commercial skill.",
        "apply": "A clean disqualification protects time, credibility and future relationships.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Keep pushing.",
        "takeaway": "Remember: Disqualify or redirect the opportunity professionally."
      },
      {
        "id": "QBD-L11",
        "title": "Make disciplined bid / no-bid decisions",
        "principle": "Qualify realistically and avoid a weak or non-compliant bid.",
        "explanation": "The Qura Qualified standard is: Qualify realistically and avoid a weak or non-compliant bid. Commercial discipline includes bid/no-bid decisions. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "A tender is evidence of a potential route to market, not a guaranteed win.",
        "apply": "Check fit, evidence requirements, deadline, stakeholder path and commercial viability before committing resource.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "Submit anyway.",
        "takeaway": "Remember: Qualify realistically and avoid a weak or non-compliant bid."
      },
      {
        "id": "QBD-L12",
        "title": "QURA Method: Reach",
        "principle": "Contact the right stakeholder with a relevant reason and channel.",
        "explanation": "The Qura Qualified standard is: Contact the right stakeholder with a relevant reason and channel. Reach is targeted engagement. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Reach is targeted engagement.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Send bulk emails.",
        "takeaway": "Remember: Contact the right stakeholder with a relevant reason and channel."
      },
      {
        "id": "QBD-L13",
        "title": "QURA Method: Advance",
        "principle": "Move a qualified relationship toward a clear, measurable next step.",
        "explanation": "The Qura Qualified standard is: Move a qualified relationship toward a clear, measurable next step. Advancement is outcome-led. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Get any reply.",
        "takeaway": "Remember: Move a qualified relationship toward a clear, measurable next step."
      },
      {
        "id": "QBD-L14",
        "title": "Separate problem ownership from budget ownership",
        "principle": "Operational lead.",
        "explanation": "The Qura Qualified standard is: Operational lead. Problem ownership and budget ownership can differ. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Map a person to the problem, influence and buying process - not just to a job title.",
        "apply": "The person experiencing the problem, controlling budget and signing the contract may be different people.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "No one.",
        "takeaway": "Remember: Operational lead."
      },
      {
        "id": "QBD-L15",
        "title": "Write useful CRM follow-up notes",
        "principle": "Problem, stakeholders, agreed actions, owner, timing and next step.",
        "explanation": "The Qura Qualified standard is: Problem, stakeholders, agreed actions, owner, timing and next step. Useful CRM notes preserve commercial context. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "'Good call'.",
        "takeaway": "Remember: Problem, stakeholders, agreed actions, owner, timing and next step."
      },
      {
        "id": "QBD-L16",
        "title": "Track procurement and contract timing",
        "principle": "To understand when an opportunity may realistically move.",
        "explanation": "The Qura Qualified standard is: To understand when an opportunity may realistically move. Timing is a core qualification factor. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Timing is a core qualification factor.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "To guarantee an award.",
        "takeaway": "Remember: To understand when an opportunity may realistically move."
      },
      {
        "id": "QBD-L17",
        "title": "Open healthcare BD calls with context",
        "principle": "A concise reason for the call linked to relevant context, followed by permission to explore.",
        "explanation": "The Qura Qualified standard is: A concise reason for the call linked to relevant context, followed by permission to explore. Context plus permission creates a professional opening. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Context plus permission creates a professional opening.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "A five-minute company history.",
        "takeaway": "Remember: A concise reason for the call linked to relevant context, followed by permission to explore."
      },
      {
        "id": "QBD-L18",
        "title": "Never overpromise under pressure",
        "principle": "Making unsupported promises simply to win the conversation.",
        "explanation": "The Qura Qualified standard is: Making unsupported promises simply to win the conversation. Credibility matters more than overpromising. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Credibility matters more than overpromising.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Understanding urgency.",
        "takeaway": "Remember: Making unsupported promises simply to win the conversation."
      },
      {
        "id": "QBD-L19",
        "title": "Agree a measurable next step",
        "principle": "A mutually agreed action that advances evaluation.",
        "explanation": "The Qura Qualified standard is: A mutually agreed action that advances evaluation. Next steps should be concrete. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "'Keep in touch' with no date.",
        "takeaway": "Remember: A mutually agreed action that advances evaluation."
      },
      {
        "id": "QBD-L20",
        "title": "Treat leadership changes as signals, not guarantees",
        "principle": "New leaders can change priorities, structures or programmes.",
        "explanation": "The Qura Qualified standard is: New leaders can change priorities, structures or programmes. Leadership change may create new priorities, but is not a guarantee. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Leadership change may create new priorities, but is not a guarantee.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "They guarantee supplier changes.",
        "takeaway": "Remember: New leaders can change priorities, structures or programmes."
      },
      {
        "id": "QBD-L21",
        "title": "Review AI-generated outreach before sending",
        "principle": "A draft to review against real context, accuracy and tone.",
        "explanation": "The Qura Qualified standard is: A draft to review against real context, accuracy and tone. Human review remains essential. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Technology should support professional judgement rather than replace it.",
        "apply": "Review the source context, accuracy and next action before relying on an automated output.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Automatically perfect and ready to send.",
        "takeaway": "Remember: A draft to review against real context, accuracy and tone."
      },
      {
        "id": "QBD-L22",
        "title": "Measure progression, not activity",
        "principle": "Qualified conversations progressing to appropriate next steps.",
        "explanation": "The Qura Qualified standard is: Qualified conversations progressing to appropriate next steps. BD quality is about progression, not activity for its own sake. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "BD quality is about progression, not activity for its own sake.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Emails sent.",
        "takeaway": "Remember: Qualified conversations progressing to appropriate next steps."
      },
      {
        "id": "QBD-L23",
        "title": "Keep stakeholder maps current",
        "principle": "Update the account map and re-qualify the stakeholder path.",
        "explanation": "The Qura Qualified standard is: Update the account map and re-qualify the stakeholder path. Stakeholder intelligence must stay current. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Stakeholder intelligence must stay current.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "Keep using the old information.",
        "takeaway": "Remember: Update the account map and re-qualify the stakeholder path."
      },
      {
        "id": "QBD-L24",
        "title": "Use intelligence to improve judgement",
        "principle": "Qura informs better judgement.",
        "explanation": "The Qura Qualified standard is: Qura informs better judgement. Intelligence supports professional decision-making. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Technology should support professional judgement rather than replace it.",
        "apply": "Review the source context, accuracy and next action before relying on an automated output.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Qura replaces judgement.",
        "takeaway": "Remember: Qura informs better judgement."
      },
      {
        "id": "QBD-L25",
        "title": "Protect confidential information",
        "principle": "Handle it according to professional, contractual and data-protection obligations.",
        "explanation": "The Qura Qualified standard is: Handle it according to professional, contractual and data-protection obligations. Confidentiality is a core professional standard. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Progress should end with a specific action, owner and timing.",
        "apply": "Avoid vague CRM notes such as “follow up” with no date or purpose.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Post it to the Live Feed.",
        "takeaway": "Remember: Handle it according to professional, contractual and data-protection obligations."
      },
      {
        "id": "QBD-L26",
        "title": "Connect proposals to the qualified need",
        "principle": "The provider's defined problem, proposed solution, evidence, outcomes and commercial next steps.",
        "explanation": "The Qura Qualified standard is: The provider's defined problem, proposed solution, evidence, outcomes and commercial next steps. Proposals should respond to the qualified need. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Proposals should respond to the qualified need.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "Your full product catalogue.",
        "takeaway": "Remember: The provider's defined problem, proposed solution, evidence, outcomes and commercial next steps."
      },
      {
        "id": "QBD-L27",
        "title": "Know when to disqualify",
        "principle": "When evidence shows poor fit, no credible need/path, unacceptable risk or commercially unsound conditions.",
        "explanation": "The Qura Qualified standard is: When evidence shows poor fit, no credible need/path, unacceptable risk or commercially unsound conditions. Disqualification protects time and credibility. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Saying no to a weak opportunity is a commercial skill.",
        "apply": "A clean disqualification protects time, credibility and future relationships.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "Never.",
        "takeaway": "Remember: When evidence shows poor fit, no credible need/path, unacceptable risk or commercially unsound conditions."
      },
      {
        "id": "QBD-L28",
        "title": "Use opportunity scoring as a prioritisation aid",
        "principle": "Help prioritise opportunities using relevant evidence and signals.",
        "explanation": "The Qura Qualified standard is: Help prioritise opportunities using relevant evidence and signals. Scoring assists prioritisation. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "Technology should support professional judgement rather than replace it.",
        "apply": "Review the source context, accuracy and next action before relying on an automated output.",
        "example": "A new CDC pathway is announced. A Qura Qualified consultant first works out what is changing, who owns the operational problem, who influences the decision and whether their solution genuinely fits.",
        "mistake": "Predict the future with certainty.",
        "takeaway": "Remember: Help prioritise opportunities using relevant evidence and signals."
      },
      {
        "id": "QBD-L29",
        "title": "Describe the Qura Qualified badge precisely",
        "principle": "Successful completion of Qura's founder-led healthcare BD learning and assessment requirements.",
        "explanation": "The Qura Qualified standard is: Successful completion of Qura's founder-led healthcare BD learning and assessment requirements. The badge must be described precisely. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "The badge must be described precisely.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "A senior executive is visible in the account, but the requirement is owned operationally elsewhere. The consultant maps the true stakeholder path rather than assuming the most senior title is the buyer.",
        "mistake": "Government licensing.",
        "takeaway": "Remember: Successful completion of Qura's founder-led healthcare BD learning and assessment requirements."
      },
      {
        "id": "QBD-L30",
        "title": "The Qura Qualified professional standard",
        "principle": "Evidence-led qualification, relevant engagement, accurate records and professional advancement of genuine opportunities.",
        "explanation": "The Qura Qualified standard is: Evidence-led qualification, relevant engagement, accurate records and professional advancement of genuine opportunities. The credential should represent a consistent professional method. The learner should be able to apply this in a live account without relying on title, activity volume or unsupported assumptions.",
        "why": "The credential should represent a consistent professional method.",
        "apply": "Apply the principle to the specific organisation, requirement and role rather than using a generic response.",
        "example": "Discovery confirms there is no credible need or commercial route. The consultant closes or redirects the opportunity professionally instead of manufacturing urgency.",
        "mistake": "High-volume generic outreach.",
        "takeaway": "Remember: Evidence-led qualification, relevant engagement, accurate records and professional advancement of genuine opportunities."
      }
    ]
  }
];
