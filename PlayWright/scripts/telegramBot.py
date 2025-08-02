import asyncio
from telegram import Bot
from datetime import datetime
import requests
from zoneinfo import ZoneInfo
import os
from supabase import create_client, Client
from dotenv import load_dotenv




# --- Config ---
load_dotenv(dotenv_path="./PlayWright/eduglobe.env")

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_OWNER = os.getenv('GITHUB_OWNER')
GITHUB_REPO = os.getenv('GITHUB_REPO')

TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

url: str = os.environ.get("SUPABASE_PROJECT_URL")
key: str = os.environ.get("SUPABASE_PROJECT_KEY")
supabase: Client = create_client(url, key)
bucket_name = "edurec-bucket"
latest_timestamp = "latest_scrape_timestamp.txt"

# --- Functions ---

def get_latest_workflow_status():

    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/runs"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    runs = response.json().get("workflow_runs", [])
    if not runs:
        return "No workflow runs found."
    
    latest = runs[0]
    name = latest.get("name", "Unnamed workflow")
    status = latest.get("conclusion", "unknown").upper()
    run_url = latest.get("html_url", "")
    created_at = latest.get("created_at", "")
    created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    sgt_dt = created_dt.astimezone(ZoneInfo("Asia/Singapore"))
    created_str = sgt_dt.strftime("%Y-%m-%d %H:%M:%S SGT")
    today_sgt = datetime.now(ZoneInfo("Asia/Singapore")).date()


    return (
        f"DAILY REPORT FOR {today_sgt} \n{GITHUB_OWNER}/{GITHUB_REPO}\n"

        f"Workflow: {name}\n"
        f"Run ended at: {created_str}\n\n"

        f"Status: {status}\n"
    )

async def debug_get_chat_id():
    bot = Bot(token=TELEGRAM_TOKEN)
    updates = await bot.get_updates()
    for update in updates:
        print("Chat ID:", update.message.chat.id)
        print("Chat Title:", update.message.chat.title if update.message.chat.title else "Private Chat")

async def send_telegram_message(text):
    bot = Bot(token=TELEGRAM_TOKEN)
    await bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=text)

def get_timestamp_file_contents():

    # Download the file from Supabase storage
    response = supabase.storage.from_(bucket_name).download(latest_timestamp)

    if response is not None:
        # Decode from bytes to string
        return response.decode('utf-8').strip()
    else:
        return "Failed to retrieve timestamp file."

def get_latest_session_status(timestamp):
    file_path = f"{timestamp}/alerts/SESSION_STATUS.txt"
    response = supabase.storage.from_(bucket_name).download(file_path)

    if response is not None:
        # Decode from bytes to string
        return response.decode('utf-8')
    else:
        return "Failed to retrieve SESSION_STATUS file."

def get_pu_status(timestamp):
    possible_files = ["NEW_PUs.txt", "NO_NEW_PUs.txt"]

    for pu_file_name in possible_files:
        file_path = f"{timestamp}/alerts/{pu_file_name}"

        try:
            result = supabase.storage.from_(bucket_name).download(file_path)
            if result is not None:
                return result.decode('utf-8')
        except Exception as e:
            # Optional: log which one failed
            print(f"Could not find {file_path}: {e}")
            continue
    else:
        return "No PU status text files found."

 
# --- Main ---

async def main():
    report = get_latest_workflow_status()
    timestamp = get_timestamp_file_contents()
    session_status = get_latest_session_status(timestamp)

    PU_STATUS = get_pu_status(timestamp) if session_status.strip().lower() == "active" else "Unknown"


    message = f"{report}\nSession: {session_status}\nNew PUs: {PU_STATUS}"
    await send_telegram_message(message)


if __name__ == "__main__":
    asyncio.run(main())
