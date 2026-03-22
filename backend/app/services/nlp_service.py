"""
NLP Service - AI Processing Pipeline
Uses Claude API for high quality summarization and action item extraction.
Falls back to rule-based methods if API key is not set.
"""
import re, os, json, requests
from typing import List, Dict, Any
from collections import Counter

# ─── Stopwords ──────────────────────────────────────────────────────────────
STOPWORDS = {
    "i","me","my","we","our","you","your","he","she","it","they","the","a","an",
    "and","or","but","in","on","at","to","for","of","with","by","from","is","was",
    "are","were","be","been","being","have","has","had","do","does","did","will",
    "would","could","should","may","might","this","that","these","those","so","if",
    "then","than","as","up","about","into","through","during","before","after",
    "above","below","between","out","off","over","under","again","further","not",
    "no","nor","only","same","just","also","well","very","too","can","all","both",
    "each","few","more","most","other","such","own","s","t","don","re","ll","ve",
    "m","d","ok","okay","yes","yeah","um","uh",
}

def preprocess_text(text: str) -> Dict[str, Any]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    tokens_raw = re.findall(r"\b[a-zA-Z']+\b", text.lower())
    tokens_filtered = [t for t in tokens_raw if t not in STOPWORDS and len(t) > 2]
    return {"sentences": sentences, "tokens": tokens_filtered,
            "word_count": len(tokens_raw), "sentence_count": len(sentences)}

def extract_keywords(tokens, top_n=12):
    freq = Counter(tokens)
    return [{"word": w, "count": c} for w, c in freq.most_common(top_n)]

# ─── Claude API ──────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

def call_claude(prompt: str, max_tokens: int = 1000) -> str:
    if not ANTHROPIC_API_KEY:
        return ""
    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": "claude-haiku-4-5-20251001", "max_tokens": max_tokens,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=30
        )
        if r.status_code == 200:
            return r.json()["content"][0]["text"].strip()
    except Exception:
        pass
    return ""

# ─── Summarization ───────────────────────────────────────────────────────────
def summarize_text(text: str) -> str:
    if ANTHROPIC_API_KEY:
        result = call_claude(f"""You are an expert meeting analyst. Read this meeting transcript and write a clear professional summary.

Rules:
- Write 4-6 sentences
- Start with what the meeting was about
- Mention key decisions made
- Mention important problems or concerns raised
- Mention what the team agreed on
- Do NOT copy sentences from the transcript
- Write in third person (e.g. "The team discussed..." not "I discussed...")

Meeting Transcript:
{text[:4000]}

Write only the summary paragraph:""", max_tokens=400)
        if result and len(result) > 80:
            return result

    # HuggingFace BART fallback
    try:
        from transformers import pipeline
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        chunks = [text[i:i+1024] for i in range(0, min(len(text), 4096), 1024)]
        parts = [summarizer(c, max_length=130, min_length=30, do_sample=False)[0]["summary_text"] for c in chunks[:3]]
        return " ".join(parts)
    except Exception:
        pass

    # Smart extractive fallback
    return _smart_extractive_summary(text)

def _smart_extractive_summary(text: str) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    if not sentences:
        return "No summary available."
    if len(sentences) <= 3:
        return " ".join(sentences)
    tokens = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    freq = Counter(t for t in tokens if t not in STOPWORDS and len(t) > 3)
    signal = {"decided","agreed","concluded","action","next","will","plan","goal",
              "issue","problem","solution","important","critical","priority","deadline"}
    scored = []
    for i, sent in enumerate(sentences):
        words = re.findall(r"\b[a-zA-Z]+\b", sent.lower())
        fs = sum(freq.get(w, 0) for w in words) / max(len(words), 1)
        ps = 1.5 if i == 0 else (1.2 if i == len(sentences)-1 else 1.0)
        ss = 1.3 if any(w in signal for w in words) else 1.0
        ls = 1.2 if 8 <= len(words) <= 35 else 0.8
        scored.append((fs*ps*ss*ls, i, sent))
    top = sorted([idx for _, idx, _ in sorted(scored, reverse=True)[:5]])
    return " ".join(sentences[i] for i in top)

# ─── Action Items ────────────────────────────────────────────────────────────
def extract_action_items(text: str, sentences: List[str]) -> List[str]:
    if ANTHROPIC_API_KEY:
        result = call_claude(f"""You are an expert meeting analyst. Extract all action items from this meeting transcript.

An action item is a specific task assigned to someone that needs to be done after the meeting.

Instructions:
- Extract ONLY clear, specific tasks
- Each action item should mention WHO will do WHAT
- If no specific person is mentioned, start with "Team should..."
- Do NOT include vague statements
- Do NOT include things already done

Meeting Transcript:
{text[:4000]}

Return ONLY a JSON array of strings. Example:
["John will send the budget report to Sarah by Friday", "The engineering team needs to fix the login bug before release", "Sarah will schedule a client call next week"]

Return only the JSON array, no other text:""", max_tokens=600)
        if result:
            try:
                result = result.strip()
                if "```" in result:
                    result = re.sub(r"```json?\n?", "", result).replace("```", "")
                items = json.loads(result.strip())
                if isinstance(items, list):
                    items = [str(i).strip() for i in items if len(str(i).strip()) > 10]
                    if items:
                        return items[:15]
            except Exception:
                pass
    return _pattern_action_items(sentences)

def _pattern_action_items(sentences):
    pat = re.compile(r"\b(will|shall|must|need to|needs to|going to|has to|have to|please|ensure|make sure|action item|follow.?up|next step|assigned to|deadline)\b", re.IGNORECASE)
    items = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent.split()) >= 5 and pat.search(sent):
            sent = re.sub(r'^[^a-zA-Z]+', '', sent)
            if len(sent) > 10:
                items.append(sent)
    return items[:15]

# ─── Sentiment ───────────────────────────────────────────────────────────────
POSITIVE_WORDS = {"great","excellent","good","positive","agree","success","wonderful","fantastic","amazing","perfect","happy","pleased","effective","productive","resolved","achieved","approved","glad","appreciate","improve","better","benefit","outstanding","helpful","excited","confident","strong","best","done","completed","accomplished","progress"}
NEGATIVE_WORDS = {"bad","issue","problem","concern","fail","failed","poor","delay","delayed","disappointed","difficult","challenge","obstacle","risk","missing","missed","wrong","error","mistake","disagree","negative","reject","incomplete","stuck","blocker","blocked","worse","worst","never","cannot","impossible","frustrated","behind","critical","broken","bug","failure","overdue","late"}

def analyze_sentiment(text: str) -> Dict[str, Any]:
    try:
        from transformers import pipeline
        clf = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        chunks = [text[i:i+512] for i in range(0, min(len(text), 2048), 512)]
        results = [clf(c)[0] for c in chunks]
        pos = sum(1 for r in results if r["label"] == "POSITIVE")
        neg = len(results) - pos
        score = (pos - neg) / max(len(results), 1)
        label = "Positive" if score > 0.15 else "Negative" if score < -0.15 else "Neutral"
        pp = round(pos / len(results) * 100)
        np_ = round(neg / len(results) * 100)
        return {"sentiment": label, "score": round(score, 3),
                "breakdown": {"positive": pp, "neutral": max(0, 100-pp-np_), "negative": np_}}
    except Exception:
        return _lexicon_sentiment(text)

def _lexicon_sentiment(text: str) -> Dict[str, Any]:
    tokens = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    score = (pos - neg) / max(pos + neg, 1)
    label = "Positive" if score > 0.1 else "Negative" if score < -0.1 else "Neutral"
    tw = max(len(tokens), 1)
    pp = round(pos / tw * 100)
    np_ = round(neg / tw * 100)
    return {"sentiment": label, "score": round(score, 3),
            "breakdown": {"positive": pp, "neutral": max(0, 100-pp-np_), "negative": np_}}

# ─── Main Pipeline ────────────────────────────────────────────────────────────
def process_transcript(text: str, title: str = "Meeting") -> Dict[str, Any]:
    pre = preprocess_text(text)
    return {
        "summary": summarize_text(text),
        "action_items": extract_action_items(text, pre["sentences"]),
        "sentiment": (s := analyze_sentiment(text))["sentiment"],
        "sentiment_score": s["score"],
        "sentiment_breakdown": s["breakdown"],
        "keywords": extract_keywords(pre["tokens"], top_n=12),
        "word_count": pre["word_count"],
    }