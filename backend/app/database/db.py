import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validate environment variables
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing in .env")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is missing in .env")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

import logging

logger = logging.getLogger(__name__)

logger.info("Supabase client initialized successfully.")