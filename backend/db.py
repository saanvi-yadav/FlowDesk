import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "your_password"),
    "database": os.getenv("DB_NAME", "company_management_system"),
    "auth_plugin": "mysql_native_password",
}



try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="flowdesk_pool",
        pool_size=5,
        pool_reset_session=True,
        **DB_CONFIG,
    )
except mysql.connector.Error as err:
    connection_pool = None
    print(f"[DB Pool Init Error] {err}")


def get_db_connection():
    if connection_pool is None:
        raise RuntimeError("Database connection pool was not initialized")

    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        raise RuntimeError(f"Failed to get DB connection: {err}") from err
    
