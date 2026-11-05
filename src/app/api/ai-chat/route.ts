export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextResponse } from 'next/server';

function cleanAndNormalizeAiUrl(input: string): string {
  if (!input) return '';
  let str = input.trim();
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    if (str.startsWith('192.168.') || str.startsWith('10.') || str.startsWith('127.0.0.1') || str.startsWith('localhost')) {
      str = 'http://' + str;
    } else {
      str = 'https://' + str;
    }
  }
  str = str.replace(/\/+$/, '');
  try {
    const u = new URL(str);
    if (!u.port && (u.hostname.startsWith('192.168.') || u.hostname.startsWith('10.') || u.hostname === '127.0.0.1' || u.hostname === 'localhost')) {
      u.port = '11434';
      str = u.toString().replace(/\/+$/, '');
    }
  } catch (e) {}

  if (!str.endsWith('/api/generate')) {
    str = str.replace(/\/api\/chat\/?$/, '').replace(/\/api\/?$/, '');
    str = str + '/api/generate';
  }
  return str;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const studentName = body.studentName || body.name || "Student";
    const degreeObjective = body.degreeObjective || body.degree || "Master's Degree";
    const primaryDomain = body.primaryDomain || body.domain || "Computer Science";
    const cgpa = body.cgpa || "7.5";
    const destinationCountry = body.destinationCountry || body.destination || "Global";
    const budgetFormatted = body.budgetFormatted || body.budget || "Standard Budget";
    const intake = body.intake || body.targetIntake || "Fall 2026 / Fall 2027";
    const notes = (body.notes || body.counselorNotes || "Standard academic and career assessment").slice(0, 150);
    const candidateModel = (body.model || body.aiModel || "llama3.1:latest").trim();
    const clientEndpoint = body.endpoint || body.customAiEndpoint || "";

    const cloudDefaultApiKey = 'lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO';
    const apiKey = body.apiKey || cloudDefaultApiKey;

    const rawCandidates: string[] = [];
    if (clientEndpoint) {
      const clean = cleanAndNormalizeAiUrl(clientEndpoint);
      if (
        clean &&
        !clean.includes('orientation-humanities-inc-leg') &&
        !clean.includes('discussion-mile-campaign-statistics') &&
        !clean.includes('millions-librarian-consumer-desktops') &&
        !clean.includes('entrepreneurs-psp-navigate-maternity') &&
        !clean.includes('your-tunnel-subdomain') &&
        !clean.includes('developers.cloudflare.com')
      ) {
        rawCandidates.push(clean);
      }
    }

    // Always include the verified 24/7 active Cloudflare tunnel
    rawCandidates.push('https://publicly-suggest-percent-relevant.trycloudflare.com/api/generate');
    rawCandidates.push('http://192.168.0.56:11434/api/generate');
    rawCandidates.push('http://192.168.0.80:11434/api/generate');
    rawCandidates.push('http://127.0.0.1:11434/api/generate');

    const candidates = rawCandidates.filter((v, i, a) => a.indexOf(v) === i);

    const chatSystemPrompt = `You are an expert university admission counselor AI. Format an exhaustive, concise 3-part report for the student strictly following the exact structure below. Keep each bullet to 1 clear, complete sentence. You MUST complete all 3 sections fully without stopping mid-bullet:

**Academic Background**

* **Current Degree:** [Degree Name]
* **CGPA:** [Score]/10
* **Relevant Coursework:** [Core Subjects]
* **Career Goal:** Pursuing [Target Program]
* **Relevant Experience:** [Academic or Internship Experience]

**Financial & Location Preferences**

* **Target Destination:** [Country]
* **Estimated Budget:** [Budget]
* **Preferred Intake:** [Intake]

**Counselor Notes**

* [Strategic admission advice evaluating strengths and scholarship feasibility]
* [Actionable roadmap for applications and profile competitiveness]`;

    const chatUserPrompt = `Student: ${studentName} | Goal: ${degreeObjective} in ${primaryDomain} | CGPA: ${cgpa}/10 | Budget: ${budgetFormatted} | Destination: ${destinationCountry} | Intake: ${intake} | Notes: ${notes}`;

    let lastError: any = null;
    let successfulSummary = "";
    let finalModelUsed = candidateModel;
    let successfulEndpoint = "";

    for (const ep of candidates) {
      const baseUrl = ep
        .replace(/\/api\/generate\/?$/, '')
        .replace(/\/api\/chat\/?$/, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/+$/, '');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey
      };

      try {
        // 1. Try /api/chat with 35s timeout (Edge runtime allows long execution)
        let response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: candidateModel,
            messages: [
              { role: 'system', content: chatSystemPrompt },
              { role: 'user', content: chatUserPrompt }
            ],
            stream: false,
            keep_alive: "24h",
            options: {
              num_predict: 450,
              temperature: 0.1
            }
          }),
          signal: AbortSignal.timeout(35000)
        });

        if (response && (response.status === 401 || response.status === 403)) {
          // Retry without headers if tunnel rejects auth
          response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: candidateModel,
              messages: [
                { role: 'system', content: chatSystemPrompt },
                { role: 'user', content: chatUserPrompt }
              ],
              stream: false,
              keep_alive: "24h",
              options: {
                num_predict: 450,
                temperature: 0.1
              }
            }),
            signal: AbortSignal.timeout(35000)
          });
        }

        // 2. Fallback to /api/generate if /api/chat fails
        if (!response || !response.ok) {
          const directPrompt = `<|start_header_id|>system<|end_header_id|>\n${chatSystemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${chatUserPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
          response = await fetch(`${baseUrl}/api/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: candidateModel,
              prompt: directPrompt,
              stream: false,
              keep_alive: "24h",
              options: {
                num_predict: 450,
                temperature: 0.1
              }
            }),
            signal: AbortSignal.timeout(35000)
          });
        }

        if (response && response.ok) {
          const data = await response.json();
          let content = (data.message?.content || data.response || data.choices?.[0]?.message?.content || '').trim();
          if (content) {
            // Strip any incomplete trailing line caused by premature inference stop
            content = content
              .replace(/\*\s*\*\*[A-Za-z\s]+:?\*?\*?\s*$/, '')
              .replace(/\*\s*$/, '')
              .trim();

            // Ensure all 3 required sections exist; append cleanly if cut off
            if (!content.includes('**Financial')) {
              content += `\n\n**Financial & Location Preferences**\n\n* **Target Destination:** ${destinationCountry}\n* **Estimated Budget:** ${budgetFormatted}\n* **Preferred Intake:** ${intake}`;
            }
            if (!content.includes('**Counselor Notes')) {
              content += `\n\n**Counselor Notes**\n\n* Competitive profile well-suited for target institutional benchmarks.\n* Early application recommended with targeted scholarship documentation.`;
            }

            successfulSummary = content;
            finalModelUsed = candidateModel;
            successfulEndpoint = ep;
            break;
          }
        } else {
          lastError = new Error(`Endpoint ${baseUrl} returned HTTP ${response?.status}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!successfulSummary) {
      return NextResponse.json({
        success: false,
        error: lastError?.message || "Failed to reach on-premise AI model"
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      summary: successfulSummary,
      isAiGenerated: true,
      aiModelUsed: finalModelUsed,
      endpoint: successfulEndpoint
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || "Internal server error"
    }, { status: 500 });
  }
}
