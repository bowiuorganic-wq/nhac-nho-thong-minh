import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const TYPE_LABEL = {
  quick: 'Tức thời',
  recurring: 'Lặp lại thường xuyên',
  periodic: 'Định kỳ dài hạn'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const body = await readJson(req);
      const text = String(body.text || '').trim();
      const nowISO = String(body.nowISO || new Date().toISOString());
      const settings = body.settings || {};
      if (!text) return sendJson(res, 400, { error: 'Thiếu nội dung cần phân tích.' });

      const result = OPENAI_API_KEY
        ? await analyzeWithOpenAI(text, nowISO, settings).catch(err => {
            console.error('[OpenAI failed, fallback local]', err.message);
            return localAnalyze(text, nowISO, settings);
          })
        : localAnalyze(text, nowISO, settings);
      return sendJson(res, 200, result);
    }

    const safePath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    if (safePath.includes('..')) return sendText(res, 403, 'Forbidden');
    const filePath = path.join(__dirname, safePath);
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    if (err?.code === 'ENOENT') return sendText(res, 404, 'Not found');
    console.error(err);
    return sendJson(res, 500, { error: err.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Nhắc nhở thông minh V7 POCO đang chạy: http://localhost:${PORT}`);
  console.log(OPENAI_API_KEY ? `✅ Đang dùng OpenAI model: ${OPENAI_MODEL}` : 'ℹ️ Chưa có OPENAI_API_KEY: app dùng bộ phân tích local rule-based.');
  console.log('Nhấn Ctrl+C để dừng server.\n');
});

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

async function analyzeWithOpenAI(text, nowISO, settings) {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: [
      'task', 'emoji', 'type', 'typeLabel', 'dueAt', 'preAlertAt', 'preAlerts', 'repeat',
      'autoRepeat', 'maxAlertCount', 'alarmSeconds', 'alarmSound', 'askBeforeDue',
      'defaultTimeUsed', 'defaultTime', 'defaultTimeReason', 'confidence', 'explanation'
    ],
    properties: {
      task: { type: 'string' },
      emoji: { type: 'string' },
      type: { type: 'string', enum: ['quick', 'periodic', 'recurring'] },
      typeLabel: { type: 'string' },
      dueAt: { type: 'string' },
      preAlertAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      preAlerts: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['type', 'time'],
          properties: {
            type: { type: 'string' },
            time: { type: 'string' }
          }
        }
      },
      repeat: {
        anyOf: [
          {
            type: 'object', additionalProperties: false,
            required: ['unit', 'interval'],
            properties: {
              unit: { type: 'string', enum: ['minute', 'hour', 'day', 'week', 'month', 'year'] },
              interval: { type: 'integer', minimum: 1, maximum: 999 }
            }
          },
          { type: 'null' }
        ]
      },
      autoRepeat: { type: 'boolean' },
      maxAlertCount: { anyOf: [{ type: 'integer', minimum: 1, maximum: 5 }, { type: 'null' }] },
      alarmSeconds: { type: 'integer', minimum: 30, maximum: 600 },
      alarmSound: { type: 'string' },
      askBeforeDue: { type: 'boolean' },
      defaultTimeUsed: { type: 'boolean' },
      defaultTime: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      defaultTimeReason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      explanation: { type: 'string' }
    }
  };

  const defaultTime = settings.defaultTime || '09:00';
  const alarmQuick = Number(settings.alarmQuick || 180);
  const alarmRecurring = Number(settings.alarmRecurring || 180);
  const alarmPeriodic = Number(settings.alarmPeriodic || 180);
  const alarmSound = settings.alarmSound || 'classic';

  const prompt = `Bạn là AI phân tích nhắc nhở thông minh tiếng Việt.\n\nThời gian hiện tại: ${nowISO}. Múi giờ người dùng: Asia/Bangkok/GMT+7.\nCâu người dùng: "${text}"\n\nCài đặt hiện tại:\n- Giờ mặc định chung nếu không nói giờ: ${defaultTime}\n- Alarm quick: ${alarmQuick}s\n- Alarm recurring: ${alarmRecurring}s\n- Alarm periodic: ${alarmPeriodic}s\n- Kiểu chuông: ${alarmSound}\n\nApp có 3 nhóm:
1. quick - Tức thời: việc nhắc một lần. Bao gồm việc <= 7 ngày, mốc giờ một lần, hoặc sự kiện một lần dù > 7 ngày như đi khám, gặp khách, đi du lịch, dự đám cưới. autoRepeat=false, askBeforeDue=false. QUAN TRỌNG: quick có thể có nhiều mốc nhắc sớm nếu là sự kiện một lần ở tương lai xa. Trả về cả preAlerts array và preAlertAt là mốc nhắc sớm đầu tiên hoặc null. Rule quick: nếu dueAt cách now <= 2 giờ thì preAlerts=[] và maxAlertCount=1; nếu >2 giờ và <=7 ngày thì preAlerts=[dueAt-60 phút] và maxAlertCount=2; nếu >7 ngày và <=14 ngày thì preAlerts=[dueAt-1 ngày, dueAt-60 phút]; nếu >14 ngày và <=30 ngày thì preAlerts=[dueAt-2 ngày, dueAt-1 ngày, dueAt-60 phút]; nếu >30 ngày thì preAlerts=[dueAt-3 ngày, dueAt-2 ngày, dueAt-1 ngày, dueAt-60 phút]. maxAlertCount = số preAlerts + 1.
2. periodic - Định kỳ dài hạn: thời gian > 7 ngày và có tính định kỳ/bảo trì/gia hạn/đóng phí/kiểm tra định kỳ như thay dầu xe, đóng tiền điện/nước/mạng, gia hạn tên miền, bảo dưỡng camera, kiểm tra hệ thống. dueAt = now + đúng khoảng thời gian nói. repeat = đúng khoảng thời gian nói. autoRepeat=true, askBeforeDue=true. Nhắc trước: 8-14 ngày => dueAt-1 ngày; 15-30 ngày => dueAt-3 ngày; >30 ngày => dueAt-5 ngày. KHÔNG áp dụng maxAlertCount=2 của quick cho periodic; với periodic trả về maxAlertCount=null vì có thể hỏi Rồi/Chưa nhiều ngày trước hạn nếu người dùng bấm Chưa.
3. recurring - Lặp lại thường xuyên: có từ khóa hàng ngày/mỗi ngày/hàng tuần/mỗi tuần/hàng tháng/mỗi tháng/thứ X hàng tuần. autoRepeat=true, askBeforeDue=false. Nếu không nói nhắc sớm thì preAlertAt=null, maxAlertCount=1. Nếu nói nhắc sớm/nhắc trước/báo trước lúc thì preAlertAt = giờ nhắc sớm đó trong cùng chu kỳ, maxAlertCount=2. Không yêu cầu người dùng phải nói dấu phẩy hoặc dấu câu. Ví dụ câu không có dấu phẩy: "Làm báo cáo 14h thứ 2 hàng tuần nhắc sớm 10h" phải hiểu dueAt = 14h thứ 2 hàng tuần, preAlertAt = 10h thứ 2 hàng tuần.\n\nQuy tắc giờ:\n- Luôn tính theo thời điểm hiện tại ở trên.\n- Thời gian tương đối: dueAt = now + đúng khoảng thời gian.\n- 15h=15:00, 15h30=15:30, 8h sáng=08:00, 8h tối=20:00.\n- Nếu giờ hôm nay đã qua thì chọn ngày mai hoặc chu kỳ kế tiếp.\n- Nếu nói "sáng" không kèm giờ: dùng 09:00.\n- Nếu nói "chiều" không kèm giờ: dùng 14:00.\n- Nếu không nói buổi/giờ: dùng giờ mặc định chung ${defaultTime}. Khi dùng giờ mặc định, defaultTimeUsed=true và giải thích rõ.\n\nTrả về JSON theo schema, không thêm chữ bên ngoài.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: { format: { type: 'json_schema', name: 'reminder_v5', strict: true, schema } }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }
  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText) throw new Error('AI không trả về JSON hợp lệ.');
  const parsed = JSON.parse(outputText);
  return normalizeAnalysis(parsed, text, nowISO, settings, 'openai');
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const c of item.content || []) if (typeof c.text === 'string') chunks.push(c.text);
  }
  return chunks.join('').trim();
}

function localAnalyze(text, nowISO, settings = {}) {
  const now = new Date(nowISO);
  const raw = text.trim();
  const lower = stripAccents(raw.toLowerCase());

  const recurring = parseRecurring(raw, lower, now, settings);
  if (recurring) return normalizeAnalysis(recurring, raw, nowISO, settings, 'local');

  const rel = parseRelative(lower);
  if (rel) {
    const due = buildDueFromRelative(raw, lower, now, rel, settings);
    const distanceMin = (due.date.getTime() - now.getTime()) / 60000;
    const task = titleCaseTask(cleanTask(raw));
    const isLong = distanceMin > 7 * 24 * 60;
    const isPeriodic = isLong && looksPeriodic(lower) && !looksOneTime(lower);
    if (isPeriodic) {
      const pre = periodicPreAlert(due.date, distanceMin);
      return normalizeAnalysis({
        task, emoji: guessEmoji(lower), type: 'periodic', typeLabel: TYPE_LABEL.periodic,
        dueAt: due.date.toISOString(), preAlertAt: pre.toISOString(), preAlerts: [{ type: periodicPreType(distanceMin), time: pre.toISOString() }],
        repeat: { unit: rel.unit, interval: rel.interval }, autoRepeat: true,
        maxAlertCount: null, alarmSeconds: alarmFor('periodic', settings), alarmSound: settings.alarmSound || 'classic',
        askBeforeDue: true, defaultTimeUsed: due.defaultTimeUsed, defaultTime: due.defaultTime,
        defaultTimeReason: due.defaultTimeReason, confidence: 'high',
        explanation: `Nhận biết việc có tính định kỳ dài hạn; thời gian chính = hiện tại + ${rel.interval} ${unitLabel(rel.unit)}.`
      }, raw, nowISO, settings, 'local');
    }
    const quickPres = quickPreAlerts(due.date, now);
    return normalizeAnalysis({
      task, emoji: guessEmoji(lower), type: 'quick', typeLabel: TYPE_LABEL.quick,
      dueAt: due.date.toISOString(), preAlertAt: quickPres[0] ? quickPres[0].time : null, preAlerts: quickPres,
      repeat: null, autoRepeat: false, maxAlertCount: quickPres.length + 1,
      alarmSeconds: alarmFor('quick', settings), alarmSound: settings.alarmSound || 'classic',
      askBeforeDue: false, defaultTimeUsed: due.defaultTimeUsed, defaultTime: due.defaultTime,
      defaultTimeReason: due.defaultTimeReason, confidence: 'high',
      explanation: isLong
        ? 'Dù thời gian lớn hơn 7 ngày, app hiểu đây là sự kiện một lần nên xếp Tức thời.'
        : 'Nhận biết đây là việc nhắc một lần.'
    }, raw, nowISO, settings, 'local');
  }

  const explicitOrDay = parseExplicitOrDay(raw, lower, now, settings);
  if (explicitOrDay) {
    const task = titleCaseTask(cleanTask(raw));
    const pres = quickPreAlerts(explicitOrDay.date, now);
    return normalizeAnalysis({
      task, emoji: guessEmoji(lower), type: 'quick', typeLabel: TYPE_LABEL.quick,
      dueAt: explicitOrDay.date.toISOString(), preAlertAt: pres[0] ? pres[0].time : null, preAlerts: pres,
      repeat: null, autoRepeat: false, maxAlertCount: pres.length + 1,
      alarmSeconds: alarmFor('quick', settings), alarmSound: settings.alarmSound || 'classic',
      askBeforeDue: false, defaultTimeUsed: explicitOrDay.defaultTimeUsed, defaultTime: explicitOrDay.defaultTime,
      defaultTimeReason: explicitOrDay.defaultTimeReason, confidence: explicitOrDay.defaultTimeUsed ? 'medium' : 'high',
      explanation: explicitOrDay.note || 'Nhận biết mốc thời gian một lần.'
    }, raw, nowISO, settings, 'local');
  }

  if (looksPeriodic(lower)) {
    const interval = defaultPeriodicInterval(lower);
    const due = new Date(now);
    addToDate(due, interval.unit, interval.interval);
    applyDefaultTime(due, settings.defaultTime || '09:00');
    const distanceMin = (due.getTime() - now.getTime()) / 60000;
    const pre = periodicPreAlert(due, distanceMin);
    const task = titleCaseTask(cleanTask(raw));
    return normalizeAnalysis({
      task, emoji: guessEmoji(lower), type: 'periodic', typeLabel: TYPE_LABEL.periodic,
      dueAt: due.toISOString(), preAlertAt: pre.toISOString(), preAlerts: [{ type: periodicPreType(distanceMin), time: pre.toISOString() }], repeat: interval,
      autoRepeat: true, maxAlertCount: null, alarmSeconds: alarmFor('periodic', settings),
      alarmSound: settings.alarmSound || 'classic', askBeforeDue: true,
      defaultTimeUsed: true, defaultTime: settings.defaultTime || '09:00',
      defaultTimeReason: 'Không nói thời gian cụ thể; app dùng chu kỳ mặc định theo loại công việc.',
      confidence: 'medium', explanation: `Tự nhận biết việc định kỳ dài hạn, chu kỳ mặc định ${interval.interval} ${unitLabel(interval.unit)}.`
    }, raw, nowISO, settings, 'local');
  }

  const due = new Date(now);
  due.setMinutes(due.getMinutes() + 1);
  const task = titleCaseTask(cleanTask(raw));
  return normalizeAnalysis({
    task, emoji: guessEmoji(lower), type: 'quick', typeLabel: TYPE_LABEL.quick,
    dueAt: due.toISOString(), preAlertAt: null, preAlerts: [], repeat: null, autoRepeat: false,
    maxAlertCount: 1, alarmSeconds: alarmFor('quick', settings), alarmSound: settings.alarmSound || 'classic',
    askBeforeDue: false, defaultTimeUsed: false, defaultTime: null, defaultTimeReason: null,
    confidence: 'low', explanation: 'Không thấy thời gian rõ ràng; app tạm đặt sau 1 phút để test.'
  }, raw, nowISO, settings, 'local');
}

function normalizeAnalysis(r, original, nowISO, settings, engine) {
  const now = new Date(nowISO);
  let due = new Date(r.dueAt);
  if (Number.isNaN(due.getTime()) || due <= now) {
    due = new Date(now);
    due.setMinutes(due.getMinutes() + 1);
    r.dueAt = due.toISOString();
  }
  if (r.preAlertAt) {
    const pre = new Date(r.preAlertAt);
    if (Number.isNaN(pre.getTime()) || pre >= due || pre <= now) {
      if (r.type === 'quick') {
        const qps = quickPreAlerts(due, now); r.preAlertAt = qps[0] ? qps[0].time : null; r.preAlerts = qps;
      } else if (r.type === 'periodic') {
        const distMin = (due.getTime() - now.getTime()) / 60000;
        const pp = periodicPreAlert(due, distMin); r.preAlertAt = pp > now ? pp.toISOString() : null;
      } else {
        r.preAlertAt = null;
      }
    }
  }
  // Chuẩn hóa số lần nhắc theo từng loại.
  // quick mới dùng quy tắc tối đa 2 lần; periodic không dùng maxAlertCount=2
  // vì có thể hỏi Rồi/Chưa lặp lại mỗi ngày trước hạn.
  const mainOnly = isMainOnlyTask(stripAccents(String(original || '').toLowerCase()));
  if (r.type === 'quick') {
    const qps = mainOnly ? [] : quickPreAlerts(due, now);
    r.preAlerts = qps;
    r.preAlertAt = qps[0] ? qps[0].time : null;
    r.maxAlertCount = qps.length + 1;
    r.repeat = null;
    r.autoRepeat = false;
    r.askBeforeDue = false;
    if (mainOnly) r.explanation = 'Từ khóa ngủ/dậy: chỉ báo đúng giờ chính, không nhắc sớm.';
  } else if (r.type === 'periodic') {
    const distMin = (due.getTime() - now.getTime()) / 60000;
    const pp = periodicPreAlert(due, distMin);
    r.preAlertAt = pp > now ? pp.toISOString() : null;
    r.preAlerts = r.preAlertAt ? [{ type: periodicPreType(distMin), time: r.preAlertAt }] : [];
    r.maxAlertCount = null;
    r.autoRepeat = true;
    r.askBeforeDue = true;
  } else if (r.type === 'recurring') {
    if (mainOnly) { r.preAlertAt = null; r.preAlerts = []; r.explanation = 'Từ khóa ngủ/dậy: lịch lặp lại chỉ báo đúng giờ chính, không nhắc sớm.'; }
    else r.preAlerts = r.preAlertAt ? [{ type: 'custom_early', time: r.preAlertAt }] : [];
    r.maxAlertCount = r.preAlerts.length + 1;
    r.autoRepeat = true;
    r.askBeforeDue = false;
  }
  r.typeLabel = TYPE_LABEL[r.type] || r.typeLabel;
  r.alarmSeconds = Number(r.alarmSeconds || alarmFor(r.type, settings));
  r.alarmSound = r.alarmSound || settings.alarmSound || 'classic';
  return { ...r, sourceText: original, engine };
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function isMainOnlyTask(lower) {
  return /(^|\s)(di\s+ngu|ngu|thuc\s+day|day)(\s|$)/.test(lower);
}

function parseEveryIntervalRepeat(lower) {
  // Rule: "cứ/cách X phút|giờ|ngày|tháng|năm ... 1 lần"
  // => Lặp lại thường xuyên, báo lần đầu sau X đơn vị, sau đó cứ X đơn vị báo lại.
  if (!/\blan\b/.test(lower)) return null;
  const map = { phut: 'minute', gio: 'hour', tieng: 'hour', ngay: 'day', thang: 'month', nam: 'year' };
  const normalized = lower.replace(/cu\s+cach/g, 'cach');
  let m = normalized.match(/(?:^|\s)(?:cu|cach)\s+(\d+)\s*(phut|gio|tieng|ngay|thang|nam)\b/);
  if (m) {
    const interval = Number(m[1]);
    if (interval > 0) { if (map[m[2]] === 'day' && (parseTime(lower).found || parseStartWeekday(lower) != null)) return null; return { interval, unit: map[m[2]], text: m[0].trim(), phraseUnit: m[2] }; }
  }
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] !== 'cu' && tokens[i] !== 'cach') continue;
    for (let j = i + 1; j < Math.min(tokens.length, i + 8); j++) {
      if (!map[tokens[j]]) continue;
      const val = parseVietnameseNumberWords(tokens.slice(i + 1, j));
      if (val != null && val > 0) { if (map[tokens[j]] === 'day' && (parseTime(lower).found || parseStartWeekday(lower) != null)) return null; return { interval: val, unit: map[tokens[j]], text: tokens.slice(i, j + 1).join(' '), phraseUnit: tokens[j] }; }
    }
  }
  return null;
}
function cleanEveryIntervalTask(raw) {
  return String(raw || '')
    .replace(/^\s*(cứ|cu|cách|cach)\s+.*?\s*(phút|phut|giờ|gio|tiếng|tieng|ngày|ngay|tháng|thang|năm|nam)\s*/i, '')
    .replace(/\b(\d+|một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi|mốt|mot|trăm|tram|nghìn|nghin|linh|lẻ|le|không|khong)(\s+\w+){0,4}\s+lần\b/gi, '')
    .replace(/\b(lần|lan)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function cleanSkipDayTask(raw) {
  return String(raw || '')
    .replace(/\b(từ|tu|bắt đầu từ|bat dau tu)\s*(thứ|thu)\s*(2|3|4|5|6|7|hai|ba|tư|tu|năm|nam|sáu|sau|bảy|bay)\b/gi, '')
    .replace(/\b(từ|tu|bắt đầu từ|bat dau tu)\s*(chủ nhật|chu nhat|cn)\b/gi, '')
    .replace(/\b(lúc|luc)?\s*\d{1,2}\s*(?:h\d{0,2}|:\d{1,2}|giờ|gio)?\s*/gi, '')
    .replace(/\b(cứ|cu|cách|cach)\s+(ngày|ngay)\b/gi, '')
    .replace(/\b(cứ|cu|cách|cach)\s+\d+\s*(ngày|ngay)\b/gi, '')
    .replace(/\b(cứ|cu|cách|cach)\s+(một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi|trăm|tram|nghìn|nghin|linh|lẻ|le|không|khong)(\s+\w+){0,5}\s*(ngày|ngay)\b/gi, '')
    .replace(/\b\d+\s*(lần|lan)\b/gi, '')
    .replace(/\b(một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\s*(lần|lan)\b/gi, '')
    .replace(/(lần|lan)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseSkipDayRepeat(lower) {
  // Rule của app: "cách/cứ X ngày" = bỏ qua X ngày, báo tiếp sau X+1 ngày.
  const normalized = lower.replace(/cu\s+cach/g, 'cach');
  let m = normalized.match(/(?:cach|cu)\s+ngay/);
  if (m) return { skipDays: 1, interval: 2, text: m[0] };
  m = normalized.match(/(?:cach|cu)\s+(\d+)\s*ngay/);
  if (m) return { skipDays: Number(m[1]), interval: Number(m[1]) + 1, text: m[0] };
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] !== 'cach' && tokens[i] !== 'cu') continue;
    for (let j = i + 1; j < Math.min(tokens.length, i + 7); j++) {
      if (tokens[j] !== 'ngay') continue;
      const val = parseVietnameseNumberWords(tokens.slice(i + 1, j));
      if (val != null && val > 0) return { skipDays: val, interval: val + 1, text: tokens.slice(i, j + 1).join(' ') };
    }
  }
  return null;
}
function parseStartWeekday(lower) {
  const m = lower.match(/(?:tu|bat\s*dau\s*tu)\s*(thu\s*(?:2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)|chu\s*nhat|cn)/);
  if (!m) return null;
  return parseWeekday(m[1]);
}
function nextDateForWeekday(now, weekday, hour, minute) {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  const days = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + days);
  if (d <= now) d.setDate(d.getDate() + 7);
  return d;
}


function alarmFor(type, settings = {}) {
  if (type === 'periodic') return Number(settings.alarmPeriodic || 180);
  if (type === 'recurring') return Number(settings.alarmRecurring || 180);
  return Number(settings.alarmQuick || 180);
}

function parseRelative(lower) {
  const map = { phut: 'minute', gio: 'hour', tieng: 'hour', ngay: 'day', tuan: 'week', thang: 'month', nam: 'year' };

  // Dạng số: "3 tháng sau", "10 ngày nữa".
  const m = lower.match(/(\d+)\s*(phut|gio|tieng|ngay|tuan|thang|nam)\s*(nua|sau)/);
  if (m) return { interval: Number(m[1]), unit: map[m[2]], text: m[0] };

  // Dạng số bằng chữ: "ba tháng sau", "mười ngày nữa", "hai năm sau".
  // Ưu tiên các số đứng ngay trước đơn vị ngày/tháng/năm; hỗ trợ thêm tuần/phút/giờ để nhận giọng nói tự nhiên hơn.
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  const unitSet = new Set(['phut', 'gio', 'tieng', 'ngay', 'tuan', 'thang', 'nam']);
  const suffixSet = new Set(['nua', 'sau']);
  for (let i = 0; i < tokens.length - 1; i++) {
    if (!unitSet.has(tokens[i]) || !suffixSet.has(tokens[i + 1])) continue;
    let best = null;
    const startMin = Math.max(0, i - 6);
    for (let j = startMin; j < i; j++) {
      const value = parseVietnameseNumberWords(tokens.slice(j, i));
      if (value != null && value > 0 && (!best || (i - j) > (i - best.start))) {
        best = { value, start: j };
      }
    }
    if (best) {
      return {
        interval: best.value,
        unit: map[tokens[i]],
        text: tokens.slice(best.start, i + 2).join(' ')
      };
    }
  }
  return null;
}

function parseVietnameseNumberWords(words) {
  if (!words || !words.length) return null;
  const tokens = words.filter(Boolean).map(w => w.replace(/motj/g, 'mot'));
  const digit = {
    khong: 0, mot: 1, hai: 2, ba: 3, bon: 4, tu: 4,
    nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9
  };

  function parseUnder100(arr) {
    arr = arr.filter(t => t !== 'linh' && t !== 'le');
    if (!arr.length) return 0;
    if (arr.length === 1) {
      if (arr[0] === 'muoi') return 10;
      return Object.prototype.hasOwnProperty.call(digit, arr[0]) ? digit[arr[0]] : null;
    }
    if (arr[0] === 'muoi') {
      const ones = digit[arr[1]];
      return ones == null ? null : 10 + ones;
    }
    if (arr[1] === 'muoi') {
      const tens = digit[arr[0]];
      if (tens == null || tens < 2) return null;
      if (arr.length === 2) return tens * 10;
      const ones = digit[arr[2]];
      return ones == null ? null : tens * 10 + ones;
    }
    return null;
  }

  function parseUnder1000(arr) {
    if (!arr.length) return 0;
    const tramIdx = arr.indexOf('tram');
    if (tramIdx > 0) {
      const h = parseUnder100(arr.slice(0, tramIdx));
      if (h == null) return null;
      const rest = parseUnder100(arr.slice(tramIdx + 1));
      if (rest == null) return null;
      return h * 100 + rest;
    }
    return parseUnder100(arr);
  }

  const nghinIdx = tokens.findIndex(t => t === 'nghin' || t === 'ngan');
  if (nghinIdx >= 0) {
    const left = parseUnder1000(tokens.slice(0, nghinIdx));
    const right = parseUnder1000(tokens.slice(nghinIdx + 1));
    if (left == null || right == null) return null;
    return left * 1000 + right;
  }
  return parseUnder1000(tokens);
}

function buildDueFromRelative(raw, lower, now, rel, settings) {
  const date = new Date(now);
  addToDate(date, rel.unit, rel.interval);
  const explicit = parseTime(lower);
  let defaultInfo = { defaultTimeUsed: false, defaultTime: null, defaultTimeReason: null };
  if (rel.unit === 'day' || rel.unit === 'week' || rel.unit === 'month' || rel.unit === 'year') {
    if (explicit.found) {
      date.setHours(explicit.hour, explicit.minute, 0, 0);
    } else {
      const d = defaultTimeForText(lower, settings.defaultTime || '09:00');
      applyDefaultTime(date, d.time);
      defaultInfo = { defaultTimeUsed: true, defaultTime: d.time, defaultTimeReason: d.reason };
    }
  }
  return { date, ...defaultInfo };
}

function addToDate(date, unit, interval) {
  if (unit === 'minute') date.setMinutes(date.getMinutes() + interval);
  if (unit === 'hour') date.setHours(date.getHours() + interval);
  if (unit === 'day') date.setDate(date.getDate() + interval);
  if (unit === 'week') date.setDate(date.getDate() + interval * 7);
  if (unit === 'month') date.setMonth(date.getMonth() + interval);
  if (unit === 'year') date.setFullYear(date.getFullYear() + interval);
}

function parseTime(lower) {
  let m = lower.match(/(?:luc\s*)?(\d{1,2})(?:h|:)(\d{1,2})?\s*(sang|chieu|toi|dem)?/);
  if (!m) m = lower.match(/(?:luc\s*)?(\d{1,2})\s*gio(?:\s*(\d{1,2}))?\s*(sang|chieu|toi|dem|ruoi)?/);
  if (!m) return { found: false, hour: null, minute: null };
  let hour = Number(m[1]);
  let minute = Number(m[2] || 0);
  const part = m[3] || '';
  if (part === 'ruoi' && !m[2]) minute = 30;
  if ((part === 'chieu' || part === 'toi' || part === 'dem') && hour < 12) hour += 12;
  if (part === 'sang' && hour === 12) hour = 0;
  return { found: true, hour: Math.min(Math.max(hour, 0), 23), minute: Math.min(Math.max(minute, 0), 59) };
}

function parseExplicitOrDay(raw, lower, now, settings) {
  const hasTime = parseTime(lower).found;
  const hasDayWord = /hom nay|ngay mai|mai|sang mai|chieu mai|toi nay|sang nay|chieu nay|tuan sau|thang sau/.test(lower);
  const hasPart = /\bsang\b|\bchieu\b/.test(lower);
  if (!hasTime && !hasDayWord && !hasPart) return null;
  const date = new Date(now);
  if (/ngay mai|\bmai\b|sang mai|chieu mai/.test(lower)) date.setDate(date.getDate() + 1);
  if (/tuan sau/.test(lower)) date.setDate(date.getDate() + 7);
  if (/thang sau/.test(lower)) date.setMonth(date.getMonth() + 1);
  const t = parseTime(lower);
  let defaultTimeUsed = false, defaultTime = null, defaultTimeReason = null;
  if (t.found) {
    date.setHours(t.hour, t.minute, 0, 0);
    if (!/ngay mai|\bmai\b|tuan sau|thang sau/.test(lower) && date <= now) date.setDate(date.getDate() + 1);
  } else {
    const d = defaultTimeForText(lower, settings.defaultTime || '09:00');
    applyDefaultTime(date, d.time);
    defaultTimeUsed = true; defaultTime = d.time; defaultTimeReason = d.reason;
    if (!hasDayWord && date <= now) date.setDate(date.getDate() + 1);
  }
  return { date, defaultTimeUsed, defaultTime, defaultTimeReason, note: defaultTimeUsed ? defaultTimeReason : null };
}

function parseRecurring(raw, lower, now, settings) {
  const everyRepeat = parseEveryIntervalRepeat(lower);
  if (everyRepeat) {
    const due = new Date(now);
    addToDate(due, everyRepeat.unit, everyRepeat.interval);
    const task = titleCaseTask(cleanEveryIntervalTask(raw) || cleanTask(raw));
    return {
      task, emoji: guessEmoji(lower), type: 'recurring', typeLabel: TYPE_LABEL.recurring,
      dueAt: due.toISOString(), preAlertAt: null, preAlerts: [], repeat: { unit: everyRepeat.unit, interval: everyRepeat.interval, mode: 'fixed_interval' }, autoRepeat: true,
      maxAlertCount: 1, alarmSeconds: alarmFor('recurring', settings), alarmSound: settings.alarmSound || 'classic', askBeforeDue: false,
      defaultTimeUsed: false, defaultTime: null, defaultTimeReason: null, confidence: 'high',
      explanation: `Cứ ${everyRepeat.interval} ${unitLabel(everyRepeat.unit)}: báo lần đầu sau ${everyRepeat.interval} ${unitLabel(everyRepeat.unit)}, sau đó lặp lại cùng chu kỳ.`
    };
  }
  const skipRepeat = parseSkipDayRepeat(lower);
  if (skipRepeat) {
    const explicit = parseTime(lower);
    const due = new Date(now);
    let defaultInfo = { defaultTimeUsed: false, defaultTime: null, defaultTimeReason: null };
    if (explicit.found) due.setHours(explicit.hour, explicit.minute, 0, 0);
    else {
      const d = defaultTimeForText(lower, settings.defaultTime || '09:00');
      applyDefaultTime(due, d.time);
      defaultInfo = { defaultTimeUsed: true, defaultTime: d.time, defaultTimeReason: d.reason };
    }
    const startWeekday = parseStartWeekday(lower);
    let firstDue = due;
    if (startWeekday != null) firstDue = nextDateForWeekday(now, startWeekday, due.getHours(), due.getMinutes());
    else if (firstDue <= now) firstDue.setDate(firstDue.getDate() + skipRepeat.interval);
    const task = titleCaseTask(cleanSkipDayTask(raw) || cleanTask(raw));
    return {
      task, emoji: guessEmoji(lower), type: 'recurring', typeLabel: TYPE_LABEL.recurring,
      dueAt: firstDue.toISOString(), preAlertAt: null, preAlerts: [], repeat: { unit: 'day', interval: skipRepeat.interval, skipDays: skipRepeat.skipDays, mode: 'skip_days' }, autoRepeat: true,
      maxAlertCount: 1, alarmSeconds: alarmFor('recurring', settings), alarmSound: settings.alarmSound || 'classic', askBeforeDue: false,
      ...defaultInfo, confidence: 'high', explanation: `Cách ${skipRepeat.skipDays} ngày: báo xong bỏ qua ${skipRepeat.skipDays} ngày, báo tiếp sau ${skipRepeat.interval} ngày.`
    };
  }
  const daily = /moi ngay|hang ngay|hang sang|hang chieu|hang toi/.test(lower);
  const weekly = /hang tuan|moi tuan|thu\s*(2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)|chu nhat|\bcn\b/.test(lower);
  const monthly = /hang thang|moi thang/.test(lower);
  if (!daily && !weekly && !monthly) return null;

  const explicit = parseTime(lower);
  const due = new Date(now);
  let defaultInfo = { defaultTimeUsed: false, defaultTime: null, defaultTimeReason: null };
  if (explicit.found) due.setHours(explicit.hour, explicit.minute, 0, 0);
  else {
    const d = defaultTimeForText(lower, settings.defaultTime || '09:00');
    applyDefaultTime(due, d.time);
    defaultInfo = { defaultTimeUsed: true, defaultTime: d.time, defaultTimeReason: d.reason };
  }

  let repeat = { unit: 'day', interval: 1 };
  if (weekly) {
    repeat = { unit: 'week', interval: 1 };
    const target = parseWeekday(lower) ?? 1;
    const days = (target - due.getDay() + 7) % 7;
    due.setDate(due.getDate() + days);
    if (due <= now) due.setDate(due.getDate() + 7);
  } else if (monthly) {
    repeat = { unit: 'month', interval: 1 };
    if (due <= now) due.setMonth(due.getMonth() + 1);
  } else if (due <= now) {
    due.setDate(due.getDate() + 1);
  }

  const early = parseEarlyTime(lower);
  let preAlertAt = null;
  if (early) {
    const pre = new Date(due);
    pre.setHours(early.hour, early.minute, 0, 0);
    if (pre < due && pre > now) preAlertAt = pre.toISOString();
  }

  const task = titleCaseTask(cleanTask(raw));
  return {
    task, emoji: guessEmoji(lower), type: 'recurring', typeLabel: TYPE_LABEL.recurring,
    dueAt: due.toISOString(), preAlertAt, preAlerts: preAlertAt ? [{ type: 'custom_early', time: preAlertAt }] : [], repeat, autoRepeat: true,
    maxAlertCount: preAlertAt ? 2 : 1,
    alarmSeconds: alarmFor('recurring', settings), alarmSound: settings.alarmSound || 'classic',
    askBeforeDue: false, ...defaultInfo, confidence: 'high',
    explanation: preAlertAt ? 'Nhận biết việc lặp lại thường xuyên có nhắc sớm.' : 'Nhận biết việc lặp lại thường xuyên, chỉ nhắc đúng giờ vì không nói nhắc sớm.'
  };
}

function parseEarlyTime(lower) {
  const idx = lower.search(/nhac som|nhac truoc|bao truoc|bao som|canh bao truoc/);
  if (idx < 0) return null;
  const tail = lower.slice(idx);
  const t = parseTime(tail);
  return t.found ? { hour: t.hour, minute: t.minute } : null;
}

function parseWeekday(lower) {
  if (/chu nhat|\bcn\b/.test(lower)) return 0;
  const map = { '2': 1, hai: 1, '3': 2, ba: 2, '4': 3, tu: 3, '5': 4, nam: 4, '6': 5, sau: 5, '7': 6, bay: 6 };
  const m = lower.match(/thu\s*(2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)/);
  return m ? map[m[1]] : null;
}

function defaultTimeForText(lower, general = '09:00') {
  if (/\bsang\b/.test(lower)) return { time: '09:00', reason: "Người dùng nói 'sáng' nhưng không nói giờ cụ thể." };
  if (/\bchieu\b/.test(lower)) return { time: '14:00', reason: "Người dùng nói 'chiều' nhưng không nói giờ cụ thể." };
  return { time: general, reason: `Người dùng không nói giờ cụ thể; app dùng giờ mặc định ${general}.` };
}

function applyDefaultTime(date, time) {
  const [h, m] = String(time || '09:00').split(':').map(Number);
  date.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
}

function quickPreAlerts(due, now) {
  const diffMs = due.getTime() - now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const alerts = [];
  function add(type, msBefore) {
    const d = new Date(due.getTime() - msBefore);
    if (d > now && d < due) alerts.push({ type, time: d.toISOString() });
  }
  if (diffMs <= 2 * 60 * 60 * 1000) return [];
  if (diffMs > 30 * dayMs) {
    add('before_3_days', 3 * dayMs);
    add('before_2_days', 2 * dayMs);
    add('before_1_day', dayMs);
  } else if (diffMs > 14 * dayMs) {
    add('before_2_days', 2 * dayMs);
    add('before_1_day', dayMs);
  } else if (diffMs > 7 * dayMs) {
    add('before_1_day', dayMs);
  }
  add('before_60_minutes', 60 * 60 * 1000);
  return alerts.sort((a, b) => new Date(a.time) - new Date(b.time));
}

function periodicPreType(distanceMin) {
  const days = distanceMin / 1440;
  if (days <= 14) return 'before_1_day';
  if (days <= 30) return 'before_3_days';
  return 'before_5_days';
}

function periodicPreAlert(due, distanceMin) {
  const days = distanceMin / 1440;
  const pre = new Date(due);
  if (days <= 14) pre.setDate(pre.getDate() - 1);
  else if (days <= 30) pre.setDate(pre.getDate() - 3);
  else pre.setDate(pre.getDate() - 5);
  return pre;
}

function looksPeriodic(lower) {
  return /thay dau|bao tri|bao duong|dong tien|tien dien|tien nuoc|tien mang|internet|wifi|gia han|kiem tra he thong|kiem tra camera|dinh ky|bao hiem|ten mien/.test(lower);
}

function looksOneTime(lower) {
  return /di kham|gap khach|di du lich|du dam cuoi|dam cuoi|di an|di choi|du tiec|sinh nhat|phong van|bay|dat ve|hoi thao/.test(lower);
}

function defaultPeriodicInterval(lower) {
  if (/thay dau|dau xe/.test(lower)) return { unit: 'month', interval: 3 };
  if (/bao duong/.test(lower)) return { unit: 'month', interval: 6 };
  if (/gia han|ten mien|bao hiem/.test(lower)) return { unit: 'year', interval: 1 };
  if (/tien dien|tien nuoc|tien mang|internet|wifi|dong tien/.test(lower)) return { unit: 'month', interval: 1 };
  return { unit: 'month', interval: 3 };
}

function cleanTask(raw) {
  return raw
    .replace(/((một|mot|hai|ba|bốn|bon|tư|tu|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi|mốt|lăm|lam|linh|lẻ|le|mươi|trăm|tram)\s+){1,6}(ngày|ngay|tuần|tuan|tháng|thang|năm|nam|phút|phut|giờ|gio|tiếng|tieng)\s*(nữa|nua|sau)/gi, '')
    .replace(/\b\d+\s*(phút|phut|giờ|gio|tiếng|tieng|ngày|ngay|tuần|tuan|tháng|thang|năm|nam)\s*(nữa|nua|sau)\b/gi, '')
    .replace(/\b(lúc|luc)?\s*\d{1,2}\s*(giờ|gio)(\s*\d{1,2})?\s*(sáng|sang|chiều|chieu|tối|toi|đêm|dem|rưỡi|ruoi)?\b/gi, '')
    .replace(/\b(lúc|luc)?\s*\d{1,2}([h:]\d{1,2})?\s*(sáng|sang|chiều|chieu|tối|toi|đêm|dem)?\b/gi, '')
    .replace(/\b(thứ|thu)\s*(hai|ba|tư|tu|năm|nam|sáu|sau|bảy|bay|2|3|4|5|6|7)\b/gi, '')
    .replace(/\b(chủ nhật|chu nhat|cn|hàng tuần|hang tuan|mỗi tuần|moi tuan|hàng ngày|hang ngay|mỗi ngày|moi ngay|hàng tháng|hang thang|mỗi tháng|moi thang)\b/gi, '')
    .replace(/\b(nhắc sớm|nhac som|nhắc trước|nhac truoc|báo trước|bao truoc)\b.*$/gi, '')
    .replace(/\b(sáng mai|sang mai|chiều mai|chieu mai|ngày mai|ngay mai|mai|hôm nay|hom nay|sáng|sang|chiều|chieu|tuần sau|tuan sau|tháng sau|thang sau)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseTask(task) {
  const t = task || 'Nhắc việc';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function unitLabel(unit) {
  return ({ minute: 'phút', hour: 'giờ', day: 'ngày', week: 'tuần', month: 'tháng', year: 'năm' })[unit] || unit;
}

function guessEmoji(lower) {
  if (/ca phe|coffee/.test(lower)) return '☕';
  if (/thuoc|uong thuoc/.test(lower)) return '💊';
  if (/dau xe|xe may|xe/.test(lower)) return '🏍️';
  if (/bao cao|report/.test(lower)) return '📋';
  if (/hop|meeting/.test(lower)) return '👥';
  if (/dien|nuoc|internet|wifi|tien|hoa don/.test(lower)) return '💡';
  if (/goi|khach|dien thoai/.test(lower)) return '📞';
  if (/camera|he thong|bao tri|bao duong/.test(lower)) return '🛠️';
  if (/kham|bac si/.test(lower)) return '🏥';
  if (/du lich|dam cuoi|di choi/.test(lower)) return '🎉';
  return '🔔';
}
