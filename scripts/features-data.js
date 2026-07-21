/* Copy and diagrams for the seven feature pages. Kept apart from the builder so
   the wording can be edited without touching any markup logic. */

export const ICONS = {
  "whatsapp-api": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M12.5 7.5L10 11h3l-2.5 3.5"/></svg>',
  "lead-management": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
  "auto-follow-ups": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  integrations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  "lead-capture": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "whatsapp-crm": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 12v2M12 9v5M16 11v3"/></svg>',
  "dialer-app": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.4-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>',
  "smart-triggers": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
};

const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

export const FEATURES = [
  /* ------------------------------------------------------------------ */
  {
    slug: "whatsapp-api",
    seoTitle: "WhatsApp Business API for Sales Teams",
    name: "WhatsApp API",
    tagline: "Reach every lead instantly with automated WhatsApp messaging.",
    title: "WhatsApp Business API for sales teams",
    heroLead:
      "Send, receive and automate messages on your own verified business number. One number, your whole team, and a record of every conversation sitting on the right lead.",
    metaDesc:
      "Hawcus WhatsApp Business API: one verified number for your whole team, automated templates, a shared inbox and every conversation logged against the lead.",
    intro: {
      head: "Your business number, working like a sales channel",
      body: [
        "A personal WhatsApp account was never built for a sales team. Only one person can hold the phone, nothing is logged anywhere, and when that person leaves the company the conversations leave with them.",
        "The official WhatsApp Business API changes what the channel can do. Your verified number is connected to Hawcus, so several agents can work it at once, messages can be sent automatically, and every reply is written to the lead record as it happens.",
      ],
    },
    diagram: "flow",
    diagramData: {
      caption: "One number, many agents, every message on the record",
      nodes: [
        { label: "New enquiry", sub: "Lead messages your number" },
        { label: "Routed to an owner", sub: "Assignment rules pick the agent" },
        { label: "Logged to the lead", sub: "Chat history on the record" },
      ],
    },
    steps: [
      { n: "01", h: "Verify your number", p: "We take you through Meta business verification and connect the number you already advertise. Your existing number can be migrated across." },
      { n: "02", h: "Build your templates", p: "Write the messages you send over and over, get them approved once, then fire them in one tap or automatically." },
      { n: "03", h: "Put your team on it", p: "Add agents, set assignment rules, and everyone works the same number without stepping on each other." },
    ],
    benefits: [
      { h: "One number for the whole team", p: "Customers keep messaging the number they already know while any agent can reply." },
      { h: "Nothing lives on a personal phone", p: "Conversations belong to the business, not to whoever happened to answer." },
      { h: "Templates that go out in seconds", p: "Approved message templates for quotes, reminders and confirmations, ready to send." },
      { h: "Delivery you can actually see", p: "Sent, delivered and read status on every message, so you know what landed." },
    ],
    stats: [
      { n: "98%", l: "Open rate on WhatsApp", s: "Against roughly 20% for email" },
      { n: "1 number", l: "For an unlimited team", s: "No more sharing a handset" },
      { n: "Seconds", l: "From enquiry to first reply", s: "Automated acknowledgement" },
    ],
    faqs: [
      ["Do I need a new phone number?", "No. In most cases the number you already advertise can be migrated onto the API. If you would rather keep your personal WhatsApp separate, a new number works just as well."],
      ["What does Meta charge for messages?", "WhatsApp bills conversation charges directly at their published rates. Hawcus passes those through at cost and does not add a margin."],
      ["How long does verification take?", "Business verification with Meta usually takes one to three working days. We prepare the documents with you so it goes through the first time."],
      ["Can I still use WhatsApp on my phone?", "Yes. The number connected to the API is worked through Hawcus, and your personal WhatsApp stays exactly as it is on a separate number."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "lead-management",
    seoTitle: "Lead Management Software for Sales Pipelines",
    name: "Lead Management",
    tagline: "Segment, prioritize and streamline your sales pipeline.",
    title: "Lead management that keeps deals moving",
    heroLead:
      "Every lead has an owner, a stage and a next action. Nothing sits in someone's head, and nothing goes quiet without you noticing.",
    metaDesc:
      "Hawcus lead management: a visual pipeline with owners, stages and next actions, plus segmentation and stalled-deal alerts so warm leads never go cold.",
    intro: {
      head: "The difference between a list and a pipeline",
      body: [
        "A spreadsheet of enquiries tells you who got in touch. It does not tell you who is close to buying, who has been ignored for nine days, or which rep is quietly sitting on twenty deals they will never work.",
        "Hawcus turns that list into a pipeline. Each lead carries a stage, an owner and a next action, so the question stops being what have we got and starts being what happens next.",
      ],
    },
    diagram: "board",
    diagramData: {
      caption: "A working pipeline, stage by stage",
      columns: [
        { name: "New", count: 12, tone: "a", cards: ["Priya V", "Karthik R", "Meena S"] },
        { name: "Contacted", count: 8, tone: "b", cards: ["Arun T", "Sangeetha"] },
        { name: "Qualified", count: 5, tone: "c", cards: ["Dinesh K", "Vasanth"] },
        { name: "Won", count: 3, tone: "d", cards: ["Prakash M"] },
      ],
    },
    steps: [
      { n: "01", h: "Define your stages", p: "Set stages that match what the buyer is doing, not what your team is doing, with clear exit criteria for each." },
      { n: "02", h: "Give every lead an owner", p: "Round robin, by territory or by product. What matters is that no lead is ever nobody's job." },
      { n: "03", h: "Work the next action", p: "Each rep opens a queue of what to do today rather than a list of everyone who ever enquired." },
    ],
    benefits: [
      { h: "Segment by anything", p: "Source, value, city, product or how warm the lead is. Work the ones most likely to close first." },
      { h: "Stalled deals surface early", p: "Anything that has not moved in your set window is flagged before it dies quietly." },
      { h: "Full history on every lead", p: "Calls, WhatsApp chats and notes on one timeline, so anyone can pick up the thread." },
      { h: "Rep-level visibility", p: "See who is following up and who is not, without asking for a status update." },
    ],
    stats: [
      { n: "0", l: "Leads without an owner", s: "Assignment is enforced, not hoped for" },
      { n: "4-6", l: "Stages we recommend", s: "More creates admin, not clarity" },
      { n: "Weekly", l: "Pipeline review rhythm", s: "Focused on deals that have not moved" },
    ],
    faqs: [
      ["Can I customise the pipeline stages?", "Yes. Stages, their order and their exit criteria are all yours to define, and you can run different pipelines for different products."],
      ["How are leads assigned?", "Round robin, by territory, by product or manually. You can also set rules so high-value enquiries go straight to a senior rep."],
      ["What happens to leads that go cold?", "They can be moved to a nurture track automatically after a period you choose, so they keep receiving light touches without clogging the active pipeline."],
      ["Can I import my existing leads?", "Yes, and we do the migration with you at no cost. A spreadsheet or an export from your current CRM is enough to get started."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "auto-follow-ups",
    seoTitle: "Automated Sales Follow-Up Software",
    name: "Auto Follow-ups",
    tagline: "Engage leads with timely, personalized messages automatically.",
    title: "Follow-ups that happen whether anyone remembers or not",
    heroLead:
      "Most deals are lost in the follow-up, not the pitch. Set the cadence once and the next touch goes out on time, every time.",
    metaDesc:
      "Hawcus auto follow-ups: define a cadence once and every lead gets timely, personalised messages automatically, with working-hours control and instant stop on reply.",
    intro: {
      head: "The gap where most revenue leaks out",
      body: [
        "A lead enquires, someone replies once, and then everyone gets busy. Two weeks later the lead has bought from a competitor who simply followed up more than once.",
        "Automating the cadence removes the part humans are worst at, which is remembering. The message still sounds like a person wrote it, because a person did. The timing is what gets automated.",
      ],
    },
    diagram: "cadence",
    diagramData: {
      caption: "A cadence that runs itself",
      steps: [
        { day: "Day 0", label: "Instant acknowledgement", sub: "Within seconds of the enquiry", tone: "now" },
        { day: "Day 1", label: "Personal first touch", sub: "Rep reaches out on WhatsApp", tone: "on" },
        { day: "Day 3", label: "Useful follow-up", sub: "Case study or pricing detail", tone: "on" },
        { day: "Day 7", label: "Gentle nudge", sub: "Still worth a conversation?", tone: "on" },
        { day: "Day 14", label: "Last call, then nurture", sub: "Moves to the slow track", tone: "off" },
      ],
    },
    steps: [
      { n: "01", h: "Pick the cadence", p: "Five to seven touches over two to three weeks suits most B2B sales. Start there and adjust with what you learn." },
      { n: "02", h: "Write messages worth sending", p: "Each touch should add something new. The automation handles timing, not thinking." },
      { n: "03", h: "Let it run and watch replies", p: "The sequence stops the moment a lead replies, and the rep takes the conversation from there." },
    ],
    benefits: [
      { h: "Stops the second they reply", p: "Nobody ever receives a scheduled nudge after they have already answered you." },
      { h: "Respects working hours", p: "Nothing fires at 2am. Messages queue and go out when someone could actually respond." },
      { h: "Personalised, not robotic", p: "Name, product, city and enquiry detail are merged in, so it reads like a person wrote it." },
      { h: "Reps get prompted, not replaced", p: "Some steps are automatic, others surface as a task, so the human touches stay human." },
    ],
    stats: [
      { n: "5-7", l: "Touches per lead", s: "Across two to three weeks" },
      { n: "0", l: "Follow-ups forgotten", s: "The system does not get busy" },
      { n: "24/7", l: "Instant first response", s: "Even when the office is shut" },
    ],
    faqs: [
      ["How many follow-ups is too many?", "Relevance matters more than frequency. Five to seven touches works for most B2B sales, provided every message adds something the last one did not."],
      ["Should follow-ups be automated or personal?", "Both. Automate the timing so nothing is forgotten, and keep the words personal. The automation prompts the rep, it does not replace them."],
      ["Which channel do follow-ups use?", "Whichever one the lead used first, which is usually WhatsApp. Following up by email when they enquired on WhatsApp just adds friction."],
      ["How do I know the sequence is working?", "Track follow-up completion alongside reply rate. High completion with low replies means the messaging needs work; low completion means the process does."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "integrations",
    seoTitle: "CRM Integrations: Facebook, Google, IndiaMART",
    name: "Integrations",
    tagline: "Connect your tools and sync data across your workflow.",
    title: "Every lead source, connected to one pipeline",
    heroLead:
      "Facebook, Instagram, Google, IndiaMART, Justdial, your website and more, plus custom integrations built for whatever else you run. Enquiries land in Hawcus in seconds, with no copy and paste in between.",
    metaDesc:
      "Hawcus integrations: connect Facebook, Instagram, Google Ads, IndiaMART, Justdial, your website forms and Zapier, with custom integrations available for any other tool you run.",
    intro: {
      head: "The tab-switching tax",
      body: [
        "Most sales teams lose their first hour to admin. Check the Facebook lead form, check the IndiaMART inbox, check the website enquiries, paste it all into a sheet, then start actually selling.",
        "Connecting those sources once removes the whole ritual. Every enquiry arrives in the same pipeline, tagged with where it came from, within seconds of being submitted.",
      ],
    },
    diagram: "hub",
    diagramData: {
      caption: "Every source, including your own, into one pipeline",
      sources: ["Facebook", "Instagram", "Google Ads", "IndiaMART", "Justdial", "Website", "Landing pages", "Zapier", "Custom API"],
    },
    steps: [
      { n: "01", h: "Connect your sources", p: "Sign in to each platform once and pick the forms or pages you want pulled in. No developer needed." },
      { n: "02", h: "Map the fields", p: "Decide which form field is the name, the number and the requirement. We remember it from then on." },
      { n: "03", h: "Watch leads arrive", p: "New enquiries appear in the board tagged by source, and the follow-up sequence starts immediately." },
    ],
    benefits: [
      { h: "Under a minute from form to follow-up", p: "The gap between someone enquiring and hearing from you closes to almost nothing." },
      { h: "Source tagging by default", p: "Know which channel actually produces revenue rather than which produces enquiries." },
      { h: "No duplicate records", p: "The same person enquiring twice is matched to one lead instead of two half-finished ones." },
      { h: "Custom integrations built for you", p: "Running something niche or in house? We will build a direct connection to it." },
    ],
    stats: [
      { n: "8+", l: "Native integrations", s: "Plus custom ones built on request" },
      { n: "Seconds", l: "Sync speed", s: "Not an hourly batch job" },
      { n: "Zero", l: "Manual data entry", s: "Nothing typed twice" },
    ],
    faqs: [
      ["Which platforms are supported?", "Facebook and Instagram lead ads, Google Ads lead forms, IndiaMART, Justdial, your own website forms, landing page builders, and anything else through Zapier."],
      ["How quickly do leads sync?", "Seconds, not hours. Integrations are event driven rather than polled on a schedule, so the follow-up can start almost immediately."],
      ["Do I need a developer?", "No. Each integration is a sign-in and a field mapping. Website forms take one snippet that we can add for you."],
      ["What if my tool is not listed?", "Zapier connects Hawcus to thousands of apps, and our open API covers the rest. If you are running something niche or built in house, talk to us and we will build a custom integration for you."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "lead-capture",
    seoTitle: "Lead Capture Software for Every Channel",
    name: "Lead Capture",
    tagline: "Capture and store leads instantly from all your channels.",
    title: "Capture every enquiry, from every channel",
    heroLead:
      "Ads, website forms, WhatsApp, phone calls and walk-ins. If someone raises their hand, it becomes a lead record with a name, a number and an owner.",
    metaDesc:
      "Hawcus lead capture: enquiries from ads, forms, WhatsApp, calls and walk-ins all become complete lead records instantly, with no manual data entry.",
    intro: {
      head: "The leads you never knew you lost",
      body: [
        "Someone fills in a form at 9pm. Someone messages the WhatsApp number on a Sunday. Someone calls while every rep is out. In most businesses at least one of those quietly disappears.",
        "Capture is the unglamorous part of a CRM that decides everything downstream. If the record never gets created, no amount of clever pipeline management will save the deal.",
      ],
    },
    diagram: "funnel",
    diagramData: {
      caption: "Five ways in, one record out",
      sources: [
        { label: "Paid ads", sub: "Facebook, Instagram, Google" },
        { label: "Website forms", sub: "Contact and landing pages" },
        { label: "WhatsApp", sub: "Direct messages to your number" },
        { label: "Phone calls", sub: "Captured by the dialer app" },
        { label: "Marketplaces", sub: "IndiaMART and Justdial" },
      ],
      out: { label: "One complete lead record", sub: "Name, number, source, owner and next action" },
    },
    steps: [
      { n: "01", h: "Point every channel at Hawcus", p: "Connect your ad accounts, drop a snippet on your forms, and link your WhatsApp number and dialer." },
      { n: "02", h: "Records build themselves", p: "Name, number, source, campaign and the message they sent are filled in without anyone typing." },
      { n: "03", h: "Nothing waits for office hours", p: "A 9pm enquiry gets an instant acknowledgement and sits at the top of the queue in the morning." },
    ],
    benefits: [
      { h: "Missed calls become leads", p: "A call nobody picked up still creates a record with a callback task, instead of vanishing." },
      { h: "Walk-ins and offline too", p: "Add a lead in seconds from the mobile app so the person in front of you is on the record." },
      { h: "Duplicate detection", p: "The same number enquiring through two channels is merged into one lead with both trails." },
      { h: "Instant acknowledgement", p: "Every captured lead gets a reply within seconds, even outside working hours." },
    ],
    stats: [
      { n: "5", l: "Capture channels", s: "Online, offline and everything between" },
      { n: "100%", l: "Of enquiries recorded", s: "Including missed calls" },
      { n: "0", l: "Fields typed by hand", s: "Records build themselves" },
    ],
    faqs: [
      ["What happens to enquiries outside working hours?", "They are captured and acknowledged instantly with an automated message, then queued at the top of the list for the morning."],
      ["Are missed calls really captured?", "Yes. The dialer app logs the number, creates or matches a lead, and raises a callback task so nobody has to check a call log."],
      ["Can I add a lead manually?", "Of course. A walk-in or a referral can be added in a few seconds from the mobile app or the web dashboard."],
      ["What if the same person enquires twice?", "They are matched on phone number and merged into a single lead, so you see one person with two touchpoints rather than two half records."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "whatsapp-crm",
    seoTitle: "WhatsApp CRM for Sales Teams",
    name: "WhatsApp CRM",
    tagline: "Manage your entire sales workflow directly on WhatsApp.",
    title: "A CRM built around the channel your customers actually use",
    heroLead:
      "Not a CRM with WhatsApp bolted on. The chat and the deal live in one place, so your team never has to reconstruct what was said.",
    metaDesc:
      "Hawcus WhatsApp CRM: chats and deals in one place, with a shared team inbox, lead context beside every conversation and full history on every record.",
    intro: {
      head: "Where the conversation and the deal finally meet",
      body: [
        "Most CRMs were designed around email and later had a WhatsApp panel added to the side. You end up switching between the chat and the record, copying context from one to the other.",
        "Hawcus starts from the conversation. Open a chat and you see the lead's stage, value, source and history beside it. Reply, move the deal, set the next action, all without leaving the thread.",
      ],
    },
    diagram: "split",
    diagramData: {
      caption: "The chat and the record, side by side",
      chat: [
        { side: "in", text: "Hi, saw your ad. What does it cost for 5 users?" },
        { side: "out", text: "Hi Priya, happy to help. It is a flat Rs 4,999 a month for the whole team." },
        { side: "in", text: "That works. Can we do a demo tomorrow?" },
      ],
      panel: {
        name: "Priya V",
        rows: [
          ["Stage", "Qualified"],
          ["Source", "Facebook ad"],
          ["Value", "Rs 4,999 / mo"],
          ["Owner", "Ravi Kumar"],
          ["Next action", "Demo, tomorrow 11am"],
        ],
      },
    },
    steps: [
      { n: "01", h: "Connect your number", p: "Your verified business number is linked to Hawcus and every message starts flowing into the shared inbox." },
      { n: "02", h: "Work from the inbox", p: "Assign, reply, tag and move deals along without ever opening a separate CRM screen." },
      { n: "03", h: "History builds itself", p: "Every message is filed against the lead, so anyone can pick up a conversation cold and know where it stands." },
    ],
    benefits: [
      { h: "Shared team inbox", p: "Several agents on one number, each conversation with a single clear owner." },
      { h: "Context beside every chat", p: "Stage, value, source and past calls visible while you type, so you never ask twice." },
      { h: "Move deals from the thread", p: "Change stage, set a reminder or log a note without leaving the conversation." },
      { h: "Nothing lost when people leave", p: "Conversations belong to the business, so handovers take minutes rather than weeks." },
    ],
    stats: [
      { n: "1 screen", l: "Chat and CRM together", s: "No more switching tabs" },
      { n: "Minutes", l: "Average first response", s: "Instead of hours" },
      { n: "Everything", l: "Logged automatically", s: "No manual note taking" },
    ],
    faqs: [
      ["What happens to my existing chats?", "Past conversations stay on the device they were sent from. From the moment your number is connected, new messages are logged against the right lead automatically."],
      ["Can more than one person reply?", "Yes. The shared inbox lets several team members work the same number, with assignment rules so every conversation has one owner."],
      ["Do I need the WhatsApp API for this?", "For multiple agents and automation, yes. Smaller teams can start with a QR-linked number and move to the API later without losing history."],
      ["How quickly can we be set up?", "Most teams connect a number, import their leads and send their first templated follow-up within an afternoon."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "smart-triggers",
    seoTitle: "Sales Workflow Automation and Triggers",
    name: "Smart Triggers",
    tagline: "Trigger messages and workflows based on user actions.",
    title: "Workflows that react to what the lead actually does",
    heroLead:
      "When this happens, do that. Build the rules once and Hawcus handles the routing, the reminders and the messages on its own.",
    metaDesc:
      "Hawcus smart triggers: when-this-then-that rules that route leads, send messages and raise tasks automatically based on what the lead does.",
    intro: {
      head: "Rules beat reminders",
      body: [
        "Every sales process has unwritten rules. High-value enquiries go to the senior rep. Anyone who asks about pricing gets the quote within the hour. Nobody sits untouched for three days.",
        "Unwritten rules only work when everyone is having a good week. Written as triggers, they hold on the bad weeks too, which is exactly when deals get dropped.",
      ],
    },
    diagram: "trigger",
    diagramData: {
      caption: "When this happens, do that",
      rules: [
        { when: "Lead asks about pricing", then: "Send the quote template and raise a task for the owner", tone: "a" },
        { when: "Deal value over Rs 50,000", then: "Assign to a senior rep and flag it on the board", tone: "b" },
        { when: "No activity for 3 days", then: "Nudge the lead and alert the manager", tone: "c" },
        { when: "Lead replies to a sequence", then: "Stop the sequence and hand it to the rep", tone: "d" },
      ],
    },
    steps: [
      { n: "01", h: "Pick the signal", p: "A reply, a keyword, a stage change, a value threshold, a period of silence or a form submission." },
      { n: "02", h: "Choose what happens", p: "Send a message, assign an owner, change stage, raise a task, notify a manager, or several at once." },
      { n: "03", h: "Let it hold the line", p: "The rule runs the same way on a quiet Tuesday and on the busiest day of the quarter." },
    ],
    benefits: [
      { h: "Route by value automatically", p: "Big enquiries reach your best closer without anyone having to notice them first." },
      { h: "Silence is a signal", p: "A lead going quiet fires a rule rather than waiting for someone to spot the gap." },
      { h: "Keyword-aware replies", p: "Ask about price, delivery or availability and the right response goes out immediately." },
      { h: "Managers hear about it early", p: "Alerts fire while a stalled deal is still recoverable, not at the month-end review." },
    ],
    stats: [
      { n: "Instant", l: "Rule execution", s: "The moment the signal fires" },
      { n: "Any", l: "Number of conditions", s: "Combine signals however you need" },
      { n: "0", l: "Deals dropped on a busy day", s: "The rules do not get busy" },
    ],
    faqs: [
      ["What can fire a trigger?", "A reply, a keyword in a message, a stage change, a value threshold, a form submission, a missed call or a set period of inactivity."],
      ["What can a trigger do?", "Send a message, assign or reassign an owner, change stage, raise a task, add a tag, notify a manager, or any combination of those."],
      ["Can a lead get caught in two rules?", "Rules run in the order you set, and you can stop later ones from firing once a match is found, so nobody receives contradictory messages."],
      ["Do I need technical knowledge?", "No. Triggers are built by picking a condition and an action from a list. If you can describe the rule out loud, you can build it."],
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "dialer-app",
    seoTitle: "Mobile Dialer App with Call Recording",
    name: "Dialer App",
    tagline: "Call, record and manage every lead from your phone.",
    title: "Hawcus Dialer, your whole pipeline in your pocket",
    heroLead:
      "Add a number, call from the app, and every conversation is recorded and filed against the right lead on its own. No dialling from a personal phone, no notes lost on the road.",
    metaDesc:
      "Hawcus Dialer is a mobile CRM and calling app for sales teams. One-tap calling, automatic call recording, missed calls turned into leads, and full lead management from your phone.",
    intro: {
      head: "Selling does not happen at a desk",
      body: [
        "Field teams, showroom staff and anyone selling on the move spend their day on the phone, not in a browser. So the calls happen on personal handsets, the notes are written down later if at all, and the CRM ends up a week behind what actually happened.",
        "Hawcus Dialer closes that gap. You add your number once, and from then on calling a lead, recording the conversation, writing the note and moving the deal all happen in the same app, in the moment.",
      ],
    },
    diagram: "dialer",
    diagramData: {
      caption: "Every call filed against the right lead, automatically",
      screen: {
        name: "Priya Venkat",
        meta: "Qualified lead, Coimbatore",
        status: "Recording",
      },
      log: [
        { name: "Priya Venkat", detail: "Outgoing, 6m 12s", tag: "Recorded", tone: "ok" },
        { name: "Karthik Raman", detail: "Incoming, 2m 40s", tag: "Recorded", tone: "ok" },
        { name: "Meena Sundar", detail: "Missed call", tag: "Callback set", tone: "warn" },
      ],
    },
    steps: [
      { n: "01", h: "Add your number", p: "Install the app, add the mobile number your team already calls from, and link it to Hawcus in a couple of taps." },
      { n: "02", h: "Call from the app", p: "Open a lead and dial. No copying numbers into the phone keypad and no switching between apps." },
      { n: "03", h: "The record writes itself", p: "The recording, duration and outcome land on the lead the moment you hang up, ready for the next person who opens it." },
    ],
    benefits: [
      { h: "Automatic call recording", p: "Every call is saved against the lead it belongs to, with no button to remember pressing." },
      { h: "Missed calls become leads", p: "A call nobody answered still creates a record and a callback task instead of vanishing from a call log." },
      { h: "The full CRM on mobile", p: "Stages, notes, follow-ups and WhatsApp history all work from the app, not just the dialling." },
      { h: "Numbers stay with the business", p: "Calls run through the company number, so contacts do not walk out when a rep does." },
    ],
    stats: [
      { n: "1 tap", l: "From lead to call", s: "No copying numbers by hand" },
      { n: "100%", l: "Of calls recorded", s: "Including the ones nobody logs" },
      { n: "0", l: "Notes written after the fact", s: "The record is made as you go" },
    ],
    faqs: [
      ["Which phones does the app run on?", "Hawcus Dialer is available for Android through the Play Store. Any reasonably recent handset your team already uses will run it."],
      ["Are recordings stored securely?", "Recordings are held against the lead record in your account and are only visible to your team. You can export or delete them at any time."],
      ["Do I need to tell customers they are being recorded?", "Yes. Recording rules vary by state and by industry, so we recommend an announcement at the start of the call. We can help you set one up."],
      ["Does it work if the rep loses signal?", "Calls still connect over the normal mobile network. Anything logged offline syncs to Hawcus as soon as the phone is back online."],
    ],
  },
];

export const TICK = tick;
