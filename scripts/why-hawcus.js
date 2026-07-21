/* The "why Hawcus" comparison block. One source of truth: the builder writes it
   into every feature page and into book-a-demo.html, so the copy never drifts. */

const TICK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

/* Visuals are built from the diagram classes the feature pages already use,
   so there is no new styling and nothing to load. */

const VIZ_CHAT = `
          <div class="fig fig--split">
            <div class="figsplit">
              <div class="figsplit__chat">
                <div class="figsplit__bar"><span class="figsplit__av">P</span><b>Priya V</b></div>
                <p class="figbub figbub--in">Hi, saw your ad. Is this available in Coimbatore?</p>
                <p class="figbub figbub--out">Hi Priya, yes it is. I can walk you through it today if that helps.</p>
                <p class="figbub figbub--in">Perfect, please do.</p>
              </div>
              <div class="figsplit__rec">
                <b class="figsplit__rechead">Answered in</b>
                <div class="figsplit__row"><span>First reply</span><b>9 seconds</b></div>
                <div class="figsplit__row"><span>Qualified</span><b>Automatically</b></div>
                <div class="figsplit__row"><span>Assigned</span><b>Ravi Kumar</b></div>
                <div class="figsplit__row"><span>Status</span><b>Hot lead</b></div>
              </div>
            </div>
            <p class="fig__cap">A reply goes out before the lead closes the tab</p>
          </div>`;

const VIZ_CADENCE = `
          <div class="fig fig--cadence">
            <ol class="figcad">
              <li class="figcad__row figcad__row--now">
                <span class="figcad__day">Day 0</span>
                <span class="figcad__mark" aria-hidden="true"></span>
                <span class="figcad__body"><b>Enquiry answered</b><span>Automatic, within seconds</span></span>
              </li>
              <li class="figcad__row figcad__row--on">
                <span class="figcad__day">Day 2</span>
                <span class="figcad__mark" aria-hidden="true"></span>
                <span class="figcad__body"><b>Rep checks in</b><span>Prompted, not remembered</span></span>
              </li>
              <li class="figcad__row figcad__row--on">
                <span class="figcad__day">Day 5</span>
                <span class="figcad__mark" aria-hidden="true"></span>
                <span class="figcad__body"><b>Quiet lead nudged</b><span>Sequence keeps running</span></span>
              </li>
              <li class="figcad__row figcad__row--off">
                <span class="figcad__day">Replied</span>
                <span class="figcad__mark" aria-hidden="true"></span>
                <span class="figcad__body"><b>Sequence stops</b><span>The rep takes over</span></span>
              </li>
            </ol>
            <p class="fig__cap">The cadence runs whether anyone remembers it or not</p>
          </div>`;

const VIZ_BOARD = `
          <div class="fig fig--board">
            <div class="figboard">
              <div class="figcol figcol--a">
                <div class="figcol__head"><b>New</b><span>12</span></div>
                <div class="figcard"><span class="figcard__av">P</span><span class="figcard__name">Priya V</span></div>
                <div class="figcard"><span class="figcard__av">K</span><span class="figcard__name">Karthik R</span></div>
                <div class="figcard"><span class="figcard__av">M</span><span class="figcard__name">Meena S</span></div>
              </div>
              <div class="figcol figcol--b">
                <div class="figcol__head"><b>Contacted</b><span>8</span></div>
                <div class="figcard"><span class="figcard__av">A</span><span class="figcard__name">Arun T</span></div>
                <div class="figcard"><span class="figcard__av">S</span><span class="figcard__name">Sangeetha</span></div>
              </div>
              <div class="figcol figcol--c">
                <div class="figcol__head"><b>Qualified</b><span>5</span></div>
                <div class="figcard"><span class="figcard__av">D</span><span class="figcard__name">Dinesh K</span></div>
              </div>
              <div class="figcol figcol--d">
                <div class="figcol__head"><b>Won</b><span>3</span></div>
                <div class="figcard"><span class="figcard__av">P</span><span class="figcard__name">Prakash M</span></div>
              </div>
            </div>
            <p class="fig__cap">Chats, calls and stages on one board</p>
          </div>`;

const ROWS = [
  {
    viz: VIZ_CHAT,
    head: "Never let a warm lead go cold",
    lead: "Most enquiries die waiting for a first reply. Hawcus answers the moment one arrives, day or night.",
    points: [
      "A reply goes out within seconds of the enquiry",
      "Leads are qualified against rules you set yourself",
      "Anyone worth calling reaches the right rep straight away",
    ],
    result: "Nothing sits unanswered, and your team spends its day on the leads worth having.",
  },
  {
    viz: VIZ_CADENCE,
    head: "Close faster without chasing anyone",
    lead: "Follow-ups run on their own, so nobody has to keep a mental list of who to call back.",
    points: [
      "Each message fires at the stage it belongs to",
      "Leads who go quiet get a nudge without being asked",
      "Every reply is logged, and reps step in only when it matters",
    ],
    result: "More replies, quicker decisions, and far less chasing.",
  },
  {
    viz: VIZ_BOARD,
    head: "Run the whole pipeline from one screen",
    lead: "Chats, calls, notes and stages live together instead of being spread across four tools.",
    points: [
      "See stage, value and history while you are still typing",
      "Log a call or move a deal without leaving the conversation",
      "Saved replies and reminders keep everything moving",
    ],
    result: "More control, cleaner tracking, and a smoother close.",
  },
];

function row(r, i) {
  // alternate which side the visual sits on
  const flip = i % 2 === 1 ? " whyrow--flip" : "";
  return `        <div class="whyrow${flip}">
          <div class="whyrow__viz">
${r.viz}
          </div>
          <div class="whyrow__copy">
            <h3>${r.head}</h3>
            <p class="whyrow__lead">${r.lead}</p>
            <ul class="whylist">
${r.points.map((p) => `              <li><span class="whylist__tick">${TICK}</span>${p}</li>`).join("\n")}
            </ul>
            <div class="whyresult">
              <span class="whyresult__label">Result</span>
              <b>${r.result}</b>
            </div>
          </div>
        </div>`;
}

export const WHY_HAWCUS = `
    <!-- ============ WHY HAWCUS ============ -->
    <section class="section why">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">The difference</span>
          <h2>Why teams pick Hawcus over <span class="hl-ink">other sales tools</span></h2>
        </div>
${ROWS.map(row).join("\n\n")}
      </div>
    </section>`;
