import random
import string


def random_word(length: int) -> str:
    letters = string.ascii_letters
    return "".join(random.choice(letters) for _ in range(length))


postgres_user = f"user_{random_word(10)}"
postgres_password = random_word(25)
postgres_database = random_word(10)

with open(".env", "w", encoding="utf-8") as f:
    f.write(
        f"""
POSTGRES_USER={postgres_user}
POSTGRES_PASSWORD={postgres_password}
POSTGRES_DATABASE={postgres_database}
POSTGRES_PORT=5446

DB_HOST=localhost
DB_PORT=5446
DB_USER={postgres_user}
DB_PASSWORD={postgres_password}
DB_NAME={postgres_database}
REDIS_URL=redis://localhost:6379
SESSION_TTL=24h
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost,http://localhost:5173
NGINX_FILE=local_nginx.conf

"""
    )
