import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Use Gmail SMTP if configured (sends to anyone, no domain needed)
// Fallback to Resend (requires verified domain for external recipients)
function getTransport() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return null;
}

const resend = new Resend(process.env.RESEND_API_KEY);


export interface DailyBriefData {
  userName: string;
  userEmail: string;
  bottleneck: string;
  mode: string;
  action: string;
  gain: string[];
  cost: string[];
  whyThis: string;
  loops: string[];
  confidenceLevel: string;
  systemMessage: string;
  xp: number;
  streaks: number;
  level: string;
  adaptiveShift: boolean;
}

export async function sendEmailBrief(data: DailyBriefData) {
  const loopWarnings = data.loops.length > 0
    ? data.loops.map(l => `<tr><td style="padding:4px 0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#aaaaaa;letter-spacing:1px;">&#x25B6; ${l}</td></tr>`).join('')
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>CASCADE OS · Daily Brief</title>
    </head>
    <body style="background:#000000;color:#ffffff;font-family:'Courier New',Courier,monospace;margin:0;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
        <tr><td align="center" style="padding:48px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid #222222;">

            <!-- Header -->
            <tr><td style="padding:32px 32px 0 32px;border-bottom:1px solid #222222;padding-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <p style="color:#ffffff;font-size:10px;letter-spacing:6px;text-transform:uppercase;margin:0 0 8px;font-family:'Courier New',Courier,monospace;">CASCADE_OS</p>
                  <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:'Courier New',Courier,monospace;">DAILY_BRIEF · SYSTEM_TRANSMISSION</p>
                </td>
                <td align="right">
                  <div style="width:36px;height:36px;background:#ffffff;display:inline-block;text-align:center;line-height:36px;">
                    <span style="color:#000000;font-weight:700;font-size:16px;font-family:'Courier New',Courier,monospace;">C</span>
                  </div>
                </td>
              </tr></table>
            </td></tr>

            <!-- Greeting -->
            <tr><td style="padding:24px 32px;border-bottom:1px solid #1a1a1a;">
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-family:'Courier New',Courier,monospace;">OPERATOR</p>
              <p style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;font-family:'Courier New',Courier,monospace;">${data.userName}</p>
            </td></tr>

            <!-- System Message -->
            <tr><td style="padding:24px 32px;border-bottom:1px solid #1a1a1a;background:#0a0a0a;">
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;font-family:'Courier New',Courier,monospace;">SYSTEM_STATUS</p>
              <p style="color:#ffffff;font-size:13px;margin:0;font-family:'Courier New',Courier,monospace;line-height:1.7;letter-spacing:0.5px;">"${data.systemMessage}"</p>
            </td></tr>

            <!-- Mode + Bottleneck -->
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:24px 32px;border-right:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;">
                    <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;font-family:'Courier New',Courier,monospace;">SYSTEM_MODE</p>
                    <p style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:3px;margin:0;font-family:'Courier New',Courier,monospace;">${data.mode}</p>
                  </td>
                  <td width="50%" style="padding:24px 32px;border-bottom:1px solid #1a1a1a;">
                    <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;font-family:'Courier New',Courier,monospace;">ROOT_BOTTLENECK</p>
                    <p style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:3px;margin:0;font-family:'Courier New',Courier,monospace;text-transform:uppercase;">${data.bottleneck}</p>
                  </td>
                </tr>
              </table>
            </td></tr>

            ${data.loops.length > 0 ? `
            <!-- Failure Loops -->
            <tr><td style="padding:20px 32px;border-bottom:1px solid #1a1a1a;border-left:2px solid #ffffff;">
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;font-family:'Courier New',Courier,monospace;">FAILURE_LOOPS_ACTIVE</p>
              <table width="100%">${loopWarnings}</table>
            </td></tr>` : ''}

            ${data.adaptiveShift ? `
            <!-- Adaptive Shift -->
            <tr><td style="padding:16px 32px;border-bottom:1px solid #1a1a1a;background:#111111;">
              <p style="color:#ffffff;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0;font-family:'Courier New',Courier,monospace;">&#x21BA; GHOST_PROTOCOL_ACTIVE: PREVIOUS APPROACH ABANDONED. SYSTEM IS ADAPTING.</p>
            </td></tr>` : ''}

            <!-- Today's Action -->
            <tr><td style="padding:32px 32px;border-bottom:1px solid #1a1a1a;border-left:4px solid #ffffff;background:#050505;">
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;font-family:'Courier New',Courier,monospace;">TODAY'S_ONE_ACTION</p>
              <p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 20px;font-family:'Courier New',Courier,monospace;line-height:1.6;letter-spacing:0.5px;">${data.action}</p>
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-family:'Courier New',Courier,monospace;">WHY_THIS</p>
              <p style="color:#aaaaaa;font-size:12px;margin:0 0 20px;font-family:'Courier New',Courier,monospace;line-height:1.7;">${data.whyThis}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:12px;border:1px solid #222222;">
                    <p style="color:#555555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;font-family:'Courier New',Courier,monospace;">GAIN</p>
                    ${data.gain.map(g => `<p style="color:#ffffff;font-size:11px;margin:2px 0;font-family:'Courier New',Courier,monospace;">+ ${g}</p>`).join('')}
                  </td>
                  <td width="2%"></td>
                  <td width="48%" style="padding:12px;border:1px solid #222222;">
                    <p style="color:#555555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;font-family:'Courier New',Courier,monospace;">COST</p>
                    ${data.cost.map(c => `<p style="color:#aaaaaa;font-size:11px;margin:2px 0;font-family:'Courier New',Courier,monospace;">- ${c}</p>`).join('')}
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Stats -->
            <tr><td style="padding:24px 32px;border-bottom:1px solid #1a1a1a;background:#0a0a0a;">
              <p style="color:#555555;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;font-family:'Courier New',Courier,monospace;">OPERATOR_STATS</p>
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="text-align:center;border:1px solid #222222;padding:14px;">
                  <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;font-family:'Courier New',Courier,monospace;">${data.xp}</p>
                  <p style="color:#555555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 0;font-family:'Courier New',Courier,monospace;">TOTAL_XP</p>
                </td>
                <td width="6px"></td>
                <td style="text-align:center;border:1px solid #222222;padding:14px;">
                  <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;font-family:'Courier New',Courier,monospace;">${data.streaks}</p>
                  <p style="color:#555555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 0;font-family:'Courier New',Courier,monospace;">DAY_STREAK</p>
                </td>
                <td width="6px"></td>
                <td style="text-align:center;border:1px solid #222222;padding:14px;">
                  <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0;font-family:'Courier New',Courier,monospace;">${data.level}</p>
                  <p style="color:#555555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 0;font-family:'Courier New',Courier,monospace;">LEVEL</p>
                </td>
              </tr></table>
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding:20px 32px;">
              <p style="color:#333333;font-size:10px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin:0;font-family:'Courier New',Courier,monospace;">CASCADE_OS · NEURO-ADAPTIVE LIFE-SYSTEM DEBUGGER</p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const recipient = process.env.DEV_EMAIL_OVERRIDE || data.userEmail;
  const transport = getTransport();

  if (transport) {
    // Gmail SMTP path — sends to anyone
    const result = await transport.sendMail({
      from: `CASCADE OS <${process.env.GMAIL_USER}>`,
      to: recipient,
      subject: `[ CASCADE_OS ] ${data.mode}_MODE · BOTTLENECK: ${data.bottleneck.toUpperCase()}`,
      html,
    });
    console.log('[CASCADE] Gmail sent:', result.messageId);
  } else {
    // Resend fallback — requires verified domain for external recipients
    console.log(`[CASCADE] Sending email via Resend to: ${recipient}`);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CASCADE OS <noreply@cascadeos.app>',
      to: recipient,
      subject: `[ CASCADE_OS ] ${data.mode}_MODE · BOTTLENECK: ${data.bottleneck.toUpperCase()}`,
      html,
    });
    console.log('[CASCADE] Resend result:', JSON.stringify(result));
  }
}

export async function sendTelegramBrief(data: DailyBriefData, chatId: string) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not set');

  const modeEmoji = data.mode === 'TRIAGE' ? '🔴' : data.mode === 'CONTAINMENT' ? '🟡' : '🟢';
  const loopText = data.loops.length > 0
    ? `\n⚠️ *Active Loops:* ${data.loops.join(', ')}`
    : '';
  const ghostText = data.adaptiveShift ? `\n🔄 _Ghost Protocol: System is adapting its approach._` : '';

  const message = `
🧠 *CASCADE OS · Daily Brief*

_"${data.systemMessage}"_

${modeEmoji} *Mode:* ${data.mode}
🎯 *Bottleneck:* ${data.bottleneck}${loopText}${ghostText}

━━━━━━━━━━━━━━

*TODAY'S ONE ACTION:*
${data.action}

✅ *Gains:* ${data.gain.join(', ')}
⚡ *Costs:* ${data.cost.join(', ')}

_Why this:_ ${data.whyThis}

━━━━━━━━━━━━━━

⭐ ${data.xp} XP · 🔥 ${data.streaks} streak · ${data.level}
  `.trim();

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
}
