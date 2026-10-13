from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/voltaris.db"

    # Weather
    WEATHER_API_KEY: str = ""

    # LLM Assistant
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_MAX_TOKENS: int = 512

    # Tariffs ₹/kWh
    TARIFF_OFF_PEAK: float = 4.50
    TARIFF_MID_PEAK: float = 7.20
    TARIFF_ON_PEAK: float = 10.80

    # Emissions
    GRID_EMISSION_FACTOR_KG_PER_KWH: float = 0.82

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()
