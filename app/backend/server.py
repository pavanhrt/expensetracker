"""
Vartā — Voice-Enabled Expense Tracker Backend
FastAPI + MongoDB + JWT auth + Whisper (STT) + Claude Sonnet 4.5 (summary/parse)
"""
import os
import io
import re
import uuid
import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------- Setup ----------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_HOURS = int(os.environ.get('JWT_EXPIRE_HOURS', 168))
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

DEFAULT_CATEGORIES = [
    "Food", "Petrol", "Shopping", "Temple", "House Rent",
    "Medical", "Education", "Investments", "Donations", "Travel", "Other"
]

app = FastAPI(title="Vartā Expense Tracker")
api = APIRouter(prefix="/api")
auth_scheme = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Models ----------
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ExpenseCreate(BaseModel):
    amount: float
    category: str
    note: Optional[str] = ""
    date: Optional[str] = None  # ISO date


class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: str
    note: str
    date: str  # ISO date (YYYY-MM-DD)
    created_at: str
    source: str  # "manual" | "voice"


class VoiceParseResult(BaseModel):
    transcript: str
    amount: Optional[float] = None
    category: Optional[str] = None
    note: Optional[str] = ""
    date: Optional[str] = None


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(auth_scheme)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing auth token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def match_category(text: str) -> str:
    """Match a raw text to one of DEFAULT_CATEGORIES (case-insensitive contains)."""
    if not text:
        return "Other"
    t = text.lower().strip()
    for c in DEFAULT_CATEGORIES:
        if c.lower() in t or t in c.lower():
            return c
    # Keyword hints
    hints = {
        "Food": ["food", "lunch", "dinner", "breakfast", "restaurant", "coffee", "tea", "snack", "grocery", "groceries"],
        "Petrol": ["petrol", "gas", "fuel", "diesel"],
        "Shopping": ["shop", "clothes", "amazon", "flipkart", "mall"],
        "Temple": ["temple", "prasad", "pooja", "puja"],
        "House Rent": ["rent", "landlord", "house"],
        "Medical": ["medical", "medicine", "doctor", "hospital", "pharmacy"],
        "Education": ["book", "course", "tuition", "school", "college", "fees"],
        "Investments": ["invest", "stock", "mutual", "sip", "fd"],
        "Donations": ["donate", "donation", "charity"],
        "Travel": ["travel", "uber", "ola", "cab", "taxi", "flight", "train", "ticket", "bus"],
    }
    for cat, words in hints.items():
        for w in words:
            if w in t:
                return cat
    return "Other"


# ---------- Auth Routes ----------
@api.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": req.name.strip(),
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id)
    return AuthResponse(token=token, user=UserPublic(id=user_id, name=doc["name"], email=doc["email"]))


@api.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return AuthResponse(token=token, user=UserPublic(id=user["id"], name=user["name"], email=user["email"]))


@api.get("/auth/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


# ---------- Categories ----------
@api.get("/categories")
async def categories(user=Depends(get_current_user)):
    return {"categories": DEFAULT_CATEGORIES}


# ---------- Expenses ----------
@api.post("/expenses", response_model=ExpenseOut)
async def create_expense(req: ExpenseCreate, user=Depends(get_current_user)):
    if req.amount is None or req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    cat = req.category if req.category in DEFAULT_CATEGORIES else match_category(req.category or "")
    date = req.date or today_iso()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": float(req.amount),
        "category": cat,
        "note": (req.note or "").strip(),
        "date": date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "manual",
    }
    await db.expenses.insert_one(doc)
    return ExpenseOut(**{k: doc[k] for k in ["id", "amount", "category", "note", "date", "created_at", "source"]})


@api.get("/expenses", response_model=List[ExpenseOut])
async def list_expenses(
    user=Depends(get_current_user),
    start: Optional[str] = None,
    end: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 500,
):
    q: dict = {"user_id": user["id"]}
    if start or end:
        q["date"] = {}
        if start:
            q["date"]["$gte"] = start
        if end:
            q["date"]["$lte"] = end
    if category and category != "All":
        q["category"] = category
    cursor = db.expenses.find(q, {"_id": 0}).sort("date", -1).limit(limit)
    docs = await cursor.to_list(limit)
    return [ExpenseOut(**{k: d.get(k, "") for k in ["id", "amount", "category", "note", "date", "created_at", "source"]}) for d in docs]


@api.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user=Depends(get_current_user)):
    res = await db.expenses.delete_one({"id": expense_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"ok": True}


# ---------- Voice ----------
def _parse_amount(text: str) -> Optional[float]:
    """Extract a numeric amount from freeform text."""
    if not text:
        return None
    # Words to digits (common)
    text_l = text.lower().replace(",", "")
    # Handle "k" e.g., "2k" -> 2000
    m = re.search(r'(\d+(?:\.\d+)?)\s*k\b', text_l)
    if m:
        return float(m.group(1)) * 1000
    m = re.search(r'(?:rs\.?|rupees?|inr|₹)\s*(\d+(?:\.\d+)?)', text_l)
    if m:
        return float(m.group(1))
    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees?|inr)', text_l)
    if m:
        return float(m.group(1))
    m = re.search(r'\b(\d{2,7}(?:\.\d+)?)\b', text_l)
    if m:
        return float(m.group(1))
    return None


@api.post("/voice/transcribe", response_model=VoiceParseResult)
async def voice_transcribe(audio: UploadFile = File(...), user=Depends(get_current_user)):
    """Accept an audio file, transcribe with Whisper, parse amount + category."""
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio")
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio too large (max 25MB)")

    # Determine file extension from filename or content type
    filename = audio.filename or "audio.webm"
    if "." not in filename:
        filename = filename + ".webm"

    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    buf = io.BytesIO(content)
    buf.name = filename
    try:
        resp = await stt.transcribe(file=buf, model="whisper-1", response_format="json", language="en")
        transcript = (resp.text or "").strip()
    except Exception as e:
        logger.exception("Whisper failed")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")

    amount = _parse_amount(transcript)
    category = match_category(transcript)

    # Compact note: strip currency numbers
    note = transcript
    return VoiceParseResult(
        transcript=transcript,
        amount=amount,
        category=category,
        note=note,
        date=today_iso(),
    )


# ---------- Stats / Summary ----------
@api.get("/stats/overview")
async def stats_overview(user=Depends(get_current_user)):
    today = today_iso()
    month_start = today[:8] + "01"
    # Previous month
    now = datetime.now(timezone.utc)
    if now.month == 1:
        prev_year, prev_month = now.year - 1, 12
    else:
        prev_year, prev_month = now.year, now.month - 1
    prev_month_start = f"{prev_year:04d}-{prev_month:02d}-01"
    prev_month_end = f"{now.year:04d}-{now.month:02d}-01"

    async def sum_between(start, end_exclusive):
        pipeline = [
            {"$match": {"user_id": user["id"], "date": {"$gte": start, "$lt": end_exclusive}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        r = await db.expenses.aggregate(pipeline).to_list(1)
        return r[0]["total"] if r else 0.0

    async def sum_eq(date):
        pipeline = [
            {"$match": {"user_id": user["id"], "date": date}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        r = await db.expenses.aggregate(pipeline).to_list(1)
        return r[0]["total"] if r else 0.0

    # month totals
    next_month_start = (datetime.strptime(month_start, "%Y-%m-%d") + timedelta(days=32)).replace(day=1).strftime("%Y-%m-%d")
    today_total = await sum_eq(today)
    month_total = await sum_between(month_start, next_month_start)
    prev_total = await sum_between(prev_month_start, prev_month_end)

    # by category current month
    cat_pipeline = [
        {"$match": {"user_id": user["id"], "date": {"$gte": month_start, "$lt": next_month_start}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
    ]
    by_cat = await db.expenses.aggregate(cat_pipeline).to_list(50)
    by_category = [{"category": x["_id"], "total": x["total"], "count": x["count"]} for x in by_cat]

    # daily trend last 30 days
    trend_start = (now - timedelta(days=29)).date().isoformat()
    daily_pipeline = [
        {"$match": {"user_id": user["id"], "date": {"$gte": trend_start}}},
        {"$group": {"_id": "$date", "total": {"$sum": "$amount"}}},
        {"$sort": {"_id": 1}},
    ]
    daily = await db.expenses.aggregate(daily_pipeline).to_list(60)
    trend = [{"date": x["_id"], "total": x["total"]} for x in daily]

    return {
        "today": today_total,
        "month_total": month_total,
        "prev_month_total": prev_total,
        "delta_pct": ((month_total - prev_total) / prev_total * 100) if prev_total > 0 else None,
        "by_category": by_category,
        "trend": trend,
        "currency": "INR",
    }


@api.get("/summary/monthly")
async def monthly_summary(user=Depends(get_current_user), month: Optional[str] = None):
    """Generate AI-powered monthly summary. month format: YYYY-MM (defaults to current)."""
    now = datetime.now(timezone.utc)
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"
    try:
        y, m = month.split("-")
        y, m = int(y), int(m)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid month format")

    start = f"{y:04d}-{m:02d}-01"
    if m == 12:
        end = f"{y+1:04d}-01-01"
    else:
        end = f"{y:04d}-{m+1:02d}-01"

    # Previous month
    if m == 1:
        py, pm = y - 1, 12
    else:
        py, pm = y, m - 1
    p_start = f"{py:04d}-{pm:02d}-01"
    p_end = start

    async def agg_by_cat(s, e):
        pipeline = [
            {"$match": {"user_id": user["id"], "date": {"$gte": s, "$lt": e}}},
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
        return await db.expenses.aggregate(pipeline).to_list(50)

    cur = await agg_by_cat(start, end)
    prev = await agg_by_cat(p_start, p_end)

    cur_total = sum(x["total"] for x in cur)
    prev_total = sum(x["total"] for x in prev)

    cur_map = {x["_id"]: x["total"] for x in cur}
    prev_map = {x["_id"]: x["total"] for x in prev}

    # Build data snapshot for Claude
    breakdown = []
    for cat in DEFAULT_CATEGORIES:
        c = cur_map.get(cat, 0)
        p = prev_map.get(cat, 0)
        if c > 0 or p > 0:
            breakdown.append({"category": cat, "current": round(c, 2), "previous": round(p, 2)})

    data_snapshot = {
        "month": month,
        "currency": "INR",
        "current_month_total": round(cur_total, 2),
        "previous_month_total": round(prev_total, 2),
        "breakdown": breakdown,
    }

    explanation = ""
    if cur_total == 0:
        explanation = "No expenses were recorded for this month. Once you start logging, I'll analyze your spending patterns here."
    else:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"summary-{user['id']}-{month}",
                system_message=(
                    "You are Vartā, a warm, concise personal-finance analyst. "
                    "Given a user's monthly expense breakdown in INR (₹), write a short, "
                    "personal, actionable summary in plain prose (no markdown headings, no bullets, no lists). "
                    "Cover: overall spending level, biggest categories, notable changes vs last month, "
                    "and one practical suggestion. Keep it under 120 words. Address the user as 'you'."
                ),
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")

            msg = UserMessage(text=f"Here is my month's data as JSON:\n{json.dumps(data_snapshot)}")
            resp = await chat.send_message(msg)
            explanation = (resp or "").strip()
        except Exception as e:
            logger.exception("Claude summary failed")
            explanation = f"Automatic summary unavailable right now. Total spent: ₹{cur_total:,.0f} across {len(breakdown)} categories."

    return {
        **data_snapshot,
        "delta_pct": ((cur_total - prev_total) / prev_total * 100) if prev_total > 0 else None,
        "explanation": explanation,
    }


# ---------- Register ----------
@api.get("/")
async def root():
    return {"service": "varta-expense-tracker", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
