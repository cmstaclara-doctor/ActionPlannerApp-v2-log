#!/usr/bin/env python3

import psycopg2
import sys

# Supabase connection details
conn_string = "host=db.ayohrbnesgstmjqbcbod.supabase.co port=5432 dbname=postgres user=postgres password='Apat3mp0@2026'"

try:
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    print("✓ Connected to Supabase")

    # Read migration SQL
    with open('supabase-migration.sql', 'r') as f:
        sql = f.read()

    # Split by semicolon
    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

    # Execute each statement
    for stmt in statements:
        try:
            cursor.execute(stmt)
            print(f"✓ {stmt[:50]}...")
        except Exception as e:
            print(f"✗ {stmt[:50]}... - {str(e)[:60]}")

    conn.commit()
    print("\n✓ Migration complete!")
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
