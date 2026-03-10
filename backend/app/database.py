# database.py
from supabase import create_client
from supabase._async.client import AsyncClient as AsyncSupabaseClient
from app.config import get_settings
import httpx

_settings = get_settings()

# ==================== SYNC CLIENT (for regular operations) ====================

def _create_sync_client():
    """Create sync Supabase client with HTTP/1.1 to avoid HTTP/2 issues"""
    client = create_client(
        _settings.supabase_url,
        _settings.supabase_service_role_key
    )
    
    # Force HTTP/1.1 to avoid RemoteProtocolError
    client.postgrest.session = httpx.Client(
        http1=True,
        http2=False,
        timeout=30.0,
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
    )
    return client

# Global sync client
admin = _create_sync_client()


def get_admin_client():
    """Get fresh sync client (useful if connection fails)"""
    return _create_sync_client()


# ==================== ASYNC CLIENT (for async operations) ====================

_async_admin_client = None

async def get_async_admin_client():
    """Get or create async Supabase client with HTTP/1.1"""
    global _async_admin_client
    
    if _async_admin_client is None:
        _async_admin_client = await AsyncSupabaseClient.create(
            _settings.supabase_url,
            _settings.supabase_service_role_key
        )
        
        # Force HTTP/1.1 to avoid HTTP/2 connection issues
        _async_admin_client.postgrest.session = httpx.AsyncClient(
            http1=True,
            http2=False,
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    return _async_admin_client


async def close_async_client():
    """Close async client on shutdown"""
    global _async_admin_client
    if _async_admin_client:
        await _async_admin_client.postgrest.session.aclose()
        _async_admin_client = None