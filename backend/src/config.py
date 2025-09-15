from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="E:/the health app/TheHealthApp/backend/.env", env_file_encoding="utf-8")

    PORT: int
    DATABASE_URL: str
    JWT_SECRET: str

settings = Settings()