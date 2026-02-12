const axios = require('axios');

// 1. THE ARSENAL
const SCRAPER_KEYS = [
  '91725d9c99fbca8c210a75936b98f357', '4a77d01d020421d9e2ed20248ae7fc3d',
  'b7153204cf207bcd374b40ba89de5b15', '263e22f57da06629cf76370fbccd9c6b', 
  'd6317dc14e6913475573c461e5c47364', 'c87f017655fdc0ad452b0dc8eac62a28', 
  'f66d03f17b85a08585eddefe74a67735', '1b003a6034f4c91a63b4b3eb0edbc7ce', 
  '709eac970456d80d83c3f2a90e5efaca4', 'eb6362d9aa8507026562350ea7866a5b'
];

const CONFIG = {
  OFFER_URL: 'https://t.datsk11.com/400234/8517/35267?bo=2753,2754,2755,2756&po=6456&aff_sub5=SF_006OG000004lmDN',
  WEBHOOK: 'https://discord.com/api/webhooks/1466180407790670115/_B0VJ0h6v8rGGv0evpBQJUfchddXCJOWGyKQxffiUydN9gk-tBlQwskfVQhqspaTt-fg',
  TARGET: 758, // Mission Target
  REFERER: 'https://privateaccesss.netlify.app/'
};

let currentKeyIndex = 0;
let totalHits = 0;

// THE BRAINS: Randomized scrolling and variable interaction
const VANGUARD_JS = `
  (async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const start = Date.now();
    Object.defineProperty(navigator, 'webdriver', {get: () => false});

    // 🛡️ HUMAN PAUSE: Don't interact immediately
    await sleep(Math.random() * 4000 + 2000); 

    // 🛡️ HUMAN SCROLL: Variable speed scrolling
    window.scrollBy({ top: Math.random() * 600, behavior: 'smooth' });
    await sleep(2000);

    const elements = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
    const target = elements.find(el => el.innerText.match(/Enter|Continue|Join|Access|Yes|18/i)) || elements[0];
    
    if (target) {
      target.click();
      await sleep(3000); // Wait for tracking fire
    }

    // Randomized dwell time (45s - 75s) to avoid "Heartbeat" detection
    const dwell = Math.floor(Math.random() * 30000) + 45000; 
    const remaining = dwell - (Date.now() - start);
    if (remaining > 0) await sleep(remaining);
  })();
`;

async function fireAgent(id) {
  if (totalHits >= CONFIG.TARGET) {
    console.log("🏁 MISSION COMPLETE.");
    process.exit();
  }
  
  const key = SCRAPER_KEYS[currentKeyIndex];
  const startTime = Date.now();

  try {
    await axios.get('https://api.scraperapi.com/', {
      params: {
        api_key: key,
        url: CONFIG.OFFER_URL,
        render: 'true',
        country_code: 'us',
        premium: 'true',
        keep_headers: 'true', // Forces Referer forward
        device_type: Math.random() > 0.4 ? 'mobile' : 'desktop', // Human device mix
        js_instructions: VANGUARD_JS,
        session_number: Math.floor(Math.random() * 9999999)
      },
      headers: {
        'Referer': CONFIG.REFERER,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      timeout: 180000 
    });

    totalHits++;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await reportToDiscord(id, duration, totalHits);
    
  } catch (e) {
    const status = e.response?.status;
    if (status === 403 || status === 401 || status === 429) {
      currentKeyIndex = (currentKeyIndex + 1) % SCRAPER_KEYS.length;
      await alertDeadKey(status, currentKeyIndex);
    }
    await new Promise(r => setTimeout(r, 12000));
  }
}

async function reportToDiscord(id, time, total) {
  const payload = {
    embeds: [{
      title: "🕵️ HUMAN TRAFFIC REGISTERED",
      color: 0x9b59b6, 
      fields: [
        { name: "Agent", value: `Thread-${id}`, inline: true },
        { name: "Progress", value: `**${total}** / ${CONFIG.TARGET}`, inline: true }
      ],
      timestamp: new Date()
    }]
  };
  await axios.post(CONFIG.WEBHOOK, payload).catch(() => {});
}

async function alertDeadKey(status, index) {
  const payload = {
    embeds: [{
      title: "⚠️ ROTATING KEY",
      description: `Index ${index} hit status ${status}. Switch engaged.`,
      color: 0xe74c3c
    }]
  };
  await axios.post(CONFIG.WEBHOOK, payload).catch(() => {});
}

async function worker(id) {
  // 🛡️ STAGGERED START: Spreads agents out so they don't click together
  // Agent 1 starts now, Agent 2 in 40s, Agent 3 in 80s, etc.
  await new Promise(r => setTimeout(r, (id - 1) * 40000));

  while (totalHits < CONFIG.TARGET) {
    await fireAgent(id);
    
    // 🛡️ AGGRESSIVE JITTER: Wait between 35s and 95s
    const humanDelay = Math.floor(Math.random() * 60000) + 35000;
    await new Promise(r => setTimeout(r, humanDelay));
  }
}

// Exactly 5 simultaneous agents for the mission
for (let i = 1; i <= 5; i++) {
  console.log(`🚀 Launching Agent ${i}...`);
  worker(i);
}
