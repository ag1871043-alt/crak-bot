const axios = require('axios');

// 1. THE ARSENAL (14 Keys)
const SCRAPER_KEYS = [
  '91725d9c99fbca8c210a75936b98f357', '4a77d01d020421d9e2ed20248ae7fc3d',
  'b7153204cf207bcd374b40ba89de5b15', '263e22f57da06629cf76370fbccd9c6b', 
  'd6317dc14e6913475573c461e5c47364', 'c87f017655fdc0ad452b0dc8eac62a28', 
  'f66d03f17b85a08585eddefe74a67735', '1b003a6034f4c91a63b4b3eb0edbc7ce', 
  '709eac970456d80d83c3f2a90e5efaca4', 'eb6362d9aa8507026562350ea7866a5b', 
  'e0689357652a846cca6f86f32bb23496', 'de246793e290b0f2ef67ada008e61b7a', 
  'b091e902e9b4fe7b70ffa1d502ac8f8a', 'dd11627ba35c316eadc5e2c1cb95baba', 
  'aeec0d8c7598cb07460cd5cc2865a69b'
];

const CONFIG = {
  OFFER_URL: 'https://top-deal.me/a/NkR2OHMOo5hRxK0',
  WEBHOOK: 'https://discord.com/api/webhooks/1466180407790670115/_B0VJ0h6v8rGGv0evpBQJUfchddXCJOWGyKQxffiUydN9gk-tBlQwskfVQhqspaTt-fg',
  TARGET: 803,
  REFERER: 'https://privateaccesss.netlify.app/' // Locked in 🔒
};

let currentKeyIndex = 0;
let totalHits = 0;

const VANGUARD_JS = `
  (async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const start = Date.now();
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    Object.defineProperty(navigator, 'webdriver', {get: () => false});
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return isMobile ? 'Qualcomm' : 'Intel Inc.'; 
      if (parameter === 37446) return isMobile ? 'Adreno (TM) 640' : 'Intel(R) Iris(R) Xe Graphics'; 
      return getParameter.apply(this, [parameter]);
    };
    const scrollPattern = async () => {
      const steps = Math.floor(Math.random() * 6) + 6; 
      for (let i = 0; i < steps; i++) {
        const pause = Math.random() > 0.8 ? 5000 : 2000; 
        window.scrollBy({ top: Math.random() * 300 + 100, behavior: 'smooth' });
        await sleep(pause);
        if (Math.random() > 0.85) window.scrollBy({ top: -200, behavior: 'smooth' });
      }
    };
    await scrollPattern();
    const links = Array.from(document.querySelectorAll('a, button'));
    const cta = links.find(l => l.innerText.match(/Enter|Watch|Join|Match|Chat/i)) || links[0];
    if (cta) {
      const eventType = isMobile ? 'touchstart' : 'mouseover';
      cta.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
      await sleep(Math.random() * 2000 + 1000); 
      cta.click(); 
    }
    const dwell = Math.floor(Math.random() * 35000) + 45000; 
    const elapsed = Date.now() - start;
    if (dwell > elapsed) await sleep(dwell - elapsed);
  })();
`;

async function fireAgent(id) {
  if (totalHits >= CONFIG.TARGET) {
    console.log("🏁 MISSION COMPLETE: 1,500 HITS.");
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
        device_type: Math.random() > 0.5 ? 'desktop' : 'mobile', 
        js_instructions: VANGUARD_JS,
        session_number: Math.floor(Math.random() * 1000000)
      },
      headers: {
        'Referer': CONFIG.REFERER // Set custom referer 🛡️
      },
      timeout: 180000 
    });

    totalHits++;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await reportToDiscord(id, duration, totalHits);
    
  } catch (e) {
    const status = e.response?.status;
    const deadKey = SCRAPER_KEYS[currentKeyIndex];
    console.log(`[T${id}] Key Index ${currentKeyIndex} Drop: Status ${status || e.message}`);
    
    if (status === 401 || status === 403) {
      await alertDeadKey(status, deadKey, currentKeyIndex);
      currentKeyIndex = (currentKeyIndex + 1) % SCRAPER_KEYS.length;
    }
    
    if (status === 429) {
        currentKeyIndex = (currentKeyIndex + 1) % SCRAPER_KEYS.length;
    }
    
    await new Promise(r => setTimeout(r, 15000));
  }
}

// ... (Rest of your alertDeadKey, reportToDiscord, and worker functions remain the same)
async function alertDeadKey(status, key, index) {
  const type = status === 401 ? "INVALID/BANNED" : "OUT OF CREDITS";
  const payload = {
    embeds: [{
      title: `⚠️ KEY EJECTED: ${type}`,
      color: 0xff0000,
      fields: [
        { name: "Status", value: `${status}`, inline: true },
        { name: "Index", value: `${index}`, inline: true },
        { name: "Key Snippet", value: `\`${key.substring(0, 8)}...\``, inline: false }
      ],
      timestamp: new Date()
    }]
  };
  await axios.post(CONFIG.WEBHOOK, payload).catch(() => {});
}

async function reportToDiscord(id, time, total) {
  const payload = {
    embeds: [{
      title: "🛡️ TACTICAL VANGUARD: HIT",
      color: 0x9b59b6,
      fields: [
        { name: "Agent", value: `Thread-${id}`, inline: true },
        { name: "Dwell Time", value: `${time}s`, inline: true },
        { name: "Progress", value: `${total} / ${CONFIG.TARGET}`, inline: true }
      ],
      footer: { text: "Self-Healing Mode | Auto-Rotating Keys" },
      timestamp: new Date()
    }]
  };
  await axios.post(CONFIG.WEBHOOK, payload).catch(() => {});
}

async function worker(id) {
  await new Promise(r => setTimeout(r, (id - 1) * 60000));
  while (totalHits < CONFIG.TARGET) {
    await fireAgent(id);
    const chillTime = Math.floor(Math.random() * 30000) + 15000; 
    await new Promise(r => setTimeout(r, chillTime));
  }
}

for (let i = 1; i <= 6; i++) {
  console.log(`🚀 Launching Agent ${i} (Tactical Mode)...`);
  worker(i);
}
