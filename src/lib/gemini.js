import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });

// Old function for Quiz Generation or structured requirements
export const BASE_SYSTEM_PROMPT = `
Consider [[ ]] as section start/end and {{ }} as data places to insert;
Return ONLY a JSON-format Object with this exact structure of this JSON:
{
  "topic": "{{string}}",
  "answer": "{{markdown}}",
  "flashcards": [
    {"q": "{{string}}", "a": "{{string}}", "tags": ["cognitive_load", "transfer"]}
  ]
}

[[IDENTITY & MISSION "START"]]
You are an advanced AI educational system designed to excel in every dimension.
[[IDENTITY & MISSION "END"]]
`;

export async function askGemini(prompt, context = "") {
  try {
    const fullPrompt = `${BASE_SYSTEM_PROMPT}\n\nContext:\n${context}\n\nQuery:\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(text);
    } catch(e) {
        return { answer: text, flashcards: [], topic: "General" };
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return { answer: "Error connecting to AI. Please check your API key.", flashcards: [] };
  }
}

// NEW FUNCTION: Open conversational chat using Gemini
export async function chatGemini(prompt, history = [], context = "") {
  try {
    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    let contextInject = context ? `\n\nReference Material for Context:\n${context}\n\nStrictly base your answers on the reference material provided above if relevant. If the question is outside the scope of the material, you may use your general knowledge but mention that it is not in the text.` : '\n\nYou do not have specific reference material, so please use your general knowledge to give a detailed, structured, and helpful response.';
    const msg = `You are an expert AI learning companion. Answer the user's question clearly, concisely, and use markdown formatting (like bullet points and bold text).${contextInject}\n\nUser Question: ${prompt}`;

    const result = await chat.sendMessage(msg);
    return result.response.text();
  } catch (error) {
    console.error("Chat Error:", error);
    return "I encountered an error connecting to my brain. Have you set the `VITE_GEMINI_API_KEY` in your `.env` file?";
  }
}

// NEW FUNCTION: Dedicated to one-shot large document analysis like transcripts
export async function summarizeTranscriptGemini(prompt) {
  try {
    const msg = `You are an expert AI learning companion. Answer the user's request clearly, concisely, and use markdown formatting (like bullet points and bold text).\n\n${prompt}`;
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: msg }] }],
      generationConfig: {
        maxOutputTokens: 8192, // Maximum output token buffer for long summaries
      }
    });
    
    return result.response.text();
  } catch (error) {
    console.error("Summarize Error:", error);
    throw new Error(error.message || "Failed to analyze transcript");
  }
}

export async function generateQuizGemini(topic, count = 5) {
  try {
    const prompt = `Generate ${count} multiple-choice questions about: ${topic}. 
    Return ONLY a JSON array of objects with this structure:
    [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Quiz Error:", error);
    return [];
  }
}

export async function generatePYQQuizGemini(exam, subject, topic, yearRange, count = 5) {
  try {
    const prompt = `Generate ${count} multiple choice questions in the exact style and difficulty of ${exam} previous year papers for the topic '${topic}' from '${subject}'.
    Each question should:
    - Match the language pattern, option structure, and cognitive level of actual ${exam} questions
    - Include one correct answer and three plausible distractors
    - Include the 'typical year range' this type of question appeared: ${yearRange}
    - Include a brief 'examiner's note' explaining why this is a frequently tested concept
    Respond ONLY in this JSON structure:
    {
      "questions": [
        {
          "question": "...",
          "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
          "correct": 0,
          "explanation": "...",
          "year_range": "${yearRange}",
          "examiners_note": "..."
        }
      ]
    }`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed.questions || [];
  } catch (error) {
    console.error("PYQ Quiz Error:", error);
    return [];
  }
}

export async function generateStudyPlan(profile, performanceData = null) {
  try {
    const daysRemaining = Math.max(1, Math.ceil((new Date(profile.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
    
    let performanceContext = "";
    if (performanceData) {
      performanceContext = `
      The student has the following recent performance data:
      Quizzes taken: ${performanceData.quizzesTaken}
      Overall Accuracy: ${performanceData.accuracy}%
      Please rebalance the study plan to focus MORE on weaker areas based on this data, while maintaining progress in other subjects.
      `;
    }

    const subjectNames = profile.subjects.map(s => s.name).join(", ");

    const prompt = `You are an expert academic planner. Create a detailed, day-by-day study schedule for a student.
    
    Student Profile:
    - Target Exam: ${profile.examTarget}
    - Exam Date: ${profile.examDate} (${daysRemaining} days remaining)
    - Study Hours Available Per Day: ${profile.dailyHours}
    - Subjects & Self-Assessed Levels: ${JSON.stringify(profile.subjects)}
    
    ${performanceContext}
    
    You MUST respond with a VALID JSON object ONLY. No markdown formatted blocks, no introduction, no explanation. Just the raw JSON object.
    
    CRITICAL INSTRUCTION: You MUST ONLY use the exact subjects provided by the student: [${subjectNames}]. Do NOT use the example subjects (Physics, Chemistry, Biology) from the JSON structure below unless the student actually provided them.
    
    The JSON structure MUST exactly match this format:
    {
      "weeklySchedule": [
        {
          "day": "Monday",
          "sessions": [
            {
              "subject": "Physics",
              "topic": "Kinematics - Relative Motion",
              "duration": 90,
              "type": "Learn",
              "priority": "High",
              "rationale": "Foundation concept"
            }
          ]
        }
        // ... include all 7 days (Monday through Sunday)
      ],
      "subjectWeightage": {
        "Physics": 35,
        "Chemistry": 40,
        "Biology": 25
      },
      "weakAreaFocus": ["Topic A", "Topic B"],
      "dailyGoal": "E.g. Complete 1 new topic + 20 practice questions",
      "milestones": [
        { "week": 1, "goal": "Finish mechanics" },
        { "week": 2, "goal": "Take first mock test" }
      ]
    }
    
    Exactly 7 objects MUST be included in the weeklySchedule array. The "day" property MUST be exactly one of these strings: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday". Do NOT use "Day 1", "Day 2", etc.
    Make sure the total duration of sessions per day roughly equals the user's available ${profile.dailyHours} hours (in minutes). Distribute subjects based on their self-assessed levels (spend more time on Beginner/Intermediate, less on Advanced).`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch(parseError) {
      console.error("Failed to parse Gemini JSON:", text);
      throw new Error("Received malformed response from AI.");
    }
  } catch (error) {
    console.error("Study Plan Error:", error);
    throw error;
  }
}

export async function autoGenerateQuizGemini(subject, topic, exam = "JEE Advanced", count = 5) {
  try {
    const prompt = `Generate exactly ${count} multiple choice questions for a ${exam} student on the topic "${topic}" from "${subject}". 

Requirements for each question:
- Match the cognitive difficulty of actual ${exam} questions
- Each question must have exactly 4 options labeled A, B, C, D
- Include one definitively correct answer
- Include a clear, educational explanation for the correct answer
- Cover different sub-concepts within the topic (don't repeat the same concept ${count} times)

Respond ONLY with this exact JSON structure, no markdown, no backticks:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "questions": [
    {
      "question": "Full question text here",
      "options": ["A) option text", "B) option text", "C) option text", "D) option text"],
      "correct": 0,
      "explanation": "Clear explanation of why A is correct and why others are wrong"
    }
  ]
}`; // I explicitly asked Gemini to output correct index as integer 0-3 for compatibility.
    
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed.questions || [];
  } catch (error) {
    console.error("Auto Gen Quiz Error:", error);
    return null;
  }
}

export async function listRelevantTopicsGemini(subject, exam) {
  try {
    const prompt = `List 6 important exam topics for ${subject} for ${exam} as a JSON array of strings only. No explanation.`;
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return ["Fundamentals", "Advanced Concepts", "Core Theories", "Problem Solving", "Mock Set 1", "Mock Set 2"];
  }
}

export async function getWeakAreaInsightsGemini(performanceData) {
  try {
    const prompt = `You are a study analytics AI. Given this student's performance data:
    ${JSON.stringify(performanceData)}
    
    Identify their top 3 weak areas with specific concept-level granularity (not just 'Physics' but 'Newton's 3rd Law applications').
    For each weak area, give ONE specific actionable recommendation.
    Respond in JSON only with exactly this structure:
    {
      "weakAreas": [
        {
          "concept": "Concept name",
          "subject": "Subject name",
          "evidence": "Brief evidence why they are weak",
          "recommendation": "1 specific actionable recommendation"
        }
      ],
      "overallInsight": "Short one sentence overall insight"
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch(e) {
      console.error("Failed to parse weak area insights:", text);
      return null;
    }
  } catch (error) {
    console.error("Weak Area AI Error:", error);
    return null;
  }
}
