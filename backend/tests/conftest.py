import pytest

# All tests are synchronous (no async DB calls needed for unit tests).
# If you add async endpoint tests via httpx.AsyncClient, add:
# pytest_plugins = ['pytest_asyncio']
