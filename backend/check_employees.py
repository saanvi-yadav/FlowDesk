from db import get_db_connection

conn = get_db_connection()
cur = conn.cursor(dictionary=True)

cur.execute('SELECT id, name, email, role, department FROM employees ORDER BY name ASC')
employees = cur.fetchall()
print(f'Total employees: {len(employees)}')
for e in employees:
    print(f"  - {e['name']} ({e['email']})")

cur.close()
conn.close()
