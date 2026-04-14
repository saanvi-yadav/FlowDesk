from db import get_db_connection

conn = get_db_connection()
cur = conn.cursor(dictionary=True)

# Find users with role 'employee' that don't have an employee record
cur.execute("""
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    LEFT JOIN employees e ON LOWER(u.email) = LOWER(e.email)
    WHERE u.role = 'employee' AND e.id IS NULL
""")

missing_employees = cur.fetchall()
print(f"Found {len(missing_employees)} users with 'employee' role missing from employees table:")
for user in missing_employees:
    print(f"  - {user['name']} ({user['email']})")

# Create employee records for these users
cur_write = conn.cursor()
for user in missing_employees:
    try:
        cur_write.execute(
            "INSERT INTO employees (name, email, role, department) VALUES (%s, %s, %s, NULL)",
            (user['name'], user['email'], 'employee')
        )
        print(f"  ✓ Created employee record for {user['name']}")
    except Exception as e:
        print(f"  ✗ Failed to create employee record for {user['name']}: {e}")

conn.commit()
cur.close()
cur_write.close()
conn.close()

print("\nSync complete!")
