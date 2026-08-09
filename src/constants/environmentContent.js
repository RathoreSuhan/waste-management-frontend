/**
 * ============================================================================
 * Environment Page Content
 * ============================================================================
 *
 * The written material for the Environment page, kept out of the components
 * so the sections stay layout only and the wording can be revised - or
 * translated - without touching JSX.
 *
 * Two rules were followed throughout:
 *
 * 1. No invented statistics. A civic platform that decorates itself with
 *    made-up numbers cannot then ask citizens to trust its reports. The
 *    single figure quoted is methane's global warming potential, which is
 *    attributed to the IPCC in the section that prints it.
 *
 * 2. Quotations are attributed as honestly as their provenance allows.
 *    Where a line is popularly assigned to someone but not verifiably
 *    theirs, it says "attributed to" rather than asserting it.
 *
 * The bin colours follow the Solid Waste Management Rules, 2016, which set
 * the three-stream standard for India. Individual corporations vary, and
 * the page says so rather than presenting one city's scheme as national law.
 * ============================================================================
 */

/**
 * Why waste management is worth the trouble - the wm0 section.
 *
 * Written as consequences rather than slogans: each line names something
 * that actually happens when waste is left where it falls.
 */
export const ENV_BENEFITS = [
    {
        title: "Groundwater stays drinkable",
        body:
            "Rain moves through an open dump and carries dissolved waste down " +
            "with it. What leaves the heap does not stay near the heap - it " +
            "reaches the water table that wells and borewells draw from.",
    },
    {
        title: "Less methane from what rots",
        body:
            "Food and garden waste buried under other rubbish breaks down " +
            "without air and releases methane, a gas the IPCC assesses at " +
            "roughly 28 times the warming effect of carbon dioxide over a " +
            "century. Composted in the open instead, the same waste does not.",
    },
    {
        title: "Fewer places for disease to breed",
        body:
            "Standing waste holds water, and held water breeds mosquitoes. " +
            "Dengue, chikungunya and leptospirosis all travel through exactly " +
            "the conditions an uncollected pile creates.",
    },
    {
        title: "Materials return to use",
        body:
            "Paper, glass, metal and plastic that reach a recycler go back " +
            "into production. The same material mixed with wet waste is " +
            "contaminated, and contaminated material gets buried.",
    },
    {
        title: "Safer work for those who handle it",
        body:
            "Waste separated at the doorstep is waste nobody has to sort by " +
            "hand at the other end, through broken glass, needles and " +
            "decomposing food.",
    },
];

/**
 * The three-bin standard - the wm1 section.
 *
 * swatch is an explicit hex rather than a theme token because these are
 * the bin colours themselves, not the site's palette. Green and blue
 * happen to sit close to the tricolour green and government blue, but
 * they are not the same value and must not drift with the theme.
 */
export const ENV_BINS = [
    {
        name: "Green",
        stream: "Wet / Biodegradable",
        swatch: "#1b7f2e",
        summary: "Anything that will rot. This is the largest share of a household's waste by weight.",
        accepts: [
            "Cooked food and leftovers",
            "Vegetable and fruit peel",
            "Eggshells, tea leaves, coffee grounds",
            "Garden trimmings, dry leaves, flowers",
        ],
        mistake:
            "Tying it inside a plastic bag. The bag survives the composting " +
            "the contents were sent for, and has to be opened and picked out again.",
    },
    {
        name: "Blue",
        stream: "Dry / Recyclable",
        swatch: "#1660a8",
        summary: "Anything that can go back into production - provided it arrives clean and dry.",
        accepts: [
            "Paper, newspaper, cardboard",
            "Plastic bottles, containers, packaging",
            "Glass bottles and jars",
            "Metal tins, cans, foil",
        ],
        mistake:
            "Dropping in unrinsed containers or a greasy food box. Oil and " +
            "food residue contaminate the paper around them, and the batch " +
            "is downgraded or discarded.",
    },
    {
        name: "Black",
        stream: "Domestic Hazardous",
        swatch: "#2b2b2b",
        summary: "The small fraction that is dangerous to bury, burn or handle unprotected.",
        accepts: [
            "Batteries and electronic waste",
            "CFL bulbs and tube lights",
            "Expired medicines",
            "Paint, solvents, pesticide containers",
        ],
        mistake:
            "Treating a battery as ordinary dry waste. It leaks heavy metals " +
            "wherever it ends up, and it ends up in the water table.",
    },
];

/**
 * The waste hierarchy - the wm2 / wm3 section.
 *
 * Deliberately in impact order rather than the order people recite them.
 * Recycling is the one everybody remembers and the weakest of the three,
 * which is worth saying plainly.
 */
export const ENV_THREE_R = [
    {
        letter: "R1",
        title: "Reduce",
        subtitle: "Waste never created",
        body:
            "The only waste with no collection cost, no transport emissions " +
            "and no landfill volume is the waste that was never brought home. " +
            "Refusing a plastic bag outranks recycling a hundred of them.",
        practices: [
            "Carry a cloth bag and a water bottle",
            "Buy loose produce over packaged",
            "Refuse single-use cutlery with deliveries",
        ],
    },
    {
        letter: "R2",
        title: "Reuse",
        subtitle: "Life extended",
        body:
            "A container used a second time displaces a container that would " +
            "otherwise have been manufactured. Repair, refill and hand-down " +
            "all keep material out of the stream entirely.",
        practices: [
            "Refill jars and bottles rather than replacing them",
            "Repair clothing, furniture and appliances first",
            "Donate what still works instead of discarding it",
        ],
    },
    {
        letter: "R3",
        title: "Recycle",
        subtitle: "Material recovered",
        body:
            "The last resort of the three, not the first. Recycling still " +
            "costs energy and transport, and it only works if what arrives " +
            "is clean - which brings it back to the bin at your door.",
        practices: [
            "Keep dry waste dry and free of food",
            "Separate e-waste from everything else",
            "Hand recyclables to your collector, not the street",
        ],
    },
];

/**
 * Closing quotations - the wm4 section.
 *
 * Both are attributed carefully. The first is universally associated with
 * Gandhi but has no confirmed source in his collected writing, and the
 * second is repeated as an indigenous proverb without a settled origin.
 * Neither is presented as a verified citation.
 */
export const ENV_QUOTES = [
    {
        text:
            "Earth provides enough to satisfy every man's needs, " +
            "but not every man's greed.",
        attribution: "Attributed to Mahatma Gandhi",
    },
    {
        text:
            "We do not inherit the earth from our ancestors; " +
            "we borrow it from our children.",
        attribution: "A widely repeated proverb",
    },
];
