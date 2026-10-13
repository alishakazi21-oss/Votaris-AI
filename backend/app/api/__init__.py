"""Voltaris AI – All API routes assembled under /api prefix."""

from fastapi import APIRouter

from .dashboard   import router as dashboard_router
from .forecast    import router as forecast_router
from .grid        import router as grid_router
from .alerts      import router as alerts_router
from .battery     import router as battery_router
from .ev          import router as ev_router
from .scenarios   import router as scenarios_router
from .weather     import router as weather_router
from .regions     import router as regions_router
from .cost_carbon import router as cost_carbon_router
from .microgrid   import router as microgrid_router
from .assistant   import router as assistant_router
from .model_lab   import router as model_lab_router
from .data_upload import router as upload_router

api_router = APIRouter()

api_router.include_router(dashboard_router)
api_router.include_router(forecast_router)
api_router.include_router(grid_router)
api_router.include_router(alerts_router)
api_router.include_router(battery_router)
api_router.include_router(ev_router)
api_router.include_router(scenarios_router)
api_router.include_router(weather_router)
api_router.include_router(regions_router)
api_router.include_router(cost_carbon_router)
api_router.include_router(microgrid_router)
api_router.include_router(assistant_router)
api_router.include_router(model_lab_router)
api_router.include_router(upload_router)
