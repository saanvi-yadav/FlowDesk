from db import get_db_connection

conn = get_db_connection()
cur = conn.cursor(dictionary=True)

# Check for Saanvi in employees table
cur.execute("SELECT id, name, email, role, department FROM employees WHERE name LIKE '%aanvi%' OR name LIKE '%Saanvi%'")
employees = cur.fetchall()
print("Employees matching 'Saanvi':")
print(employees)

# Check all employees
cur.execute("SELECT COUNT(*) as count FROM employees")
total = cur.fetchone()
print(f"\nTotal employees: {total['count']}")

# Check for any users with name containing Saanvi
cur.execute("SELECT id, name, email, role FROM users WHERE name LIKE '%aanvi%' OR name LIKE '%Saanvi%'")
users = cur.fetchall()
print("\nUsers matching 'Saanvi':")
print(users)

cur.close()
conn.close()
