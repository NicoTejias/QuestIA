from supabase import create_client

url = "https://wzkwmiyzszegekpuqnaz.supabase.co"
key = "sb_publishable_8SlWG-0qPUkcPMvg36hhEA_RFdk8zqb"

sb = create_client(url, key)

print("--- PROFILES / USERS ---")
res = sb.table("profiles").select("id, clerk_id, email, name, role").execute()
print("Profiles count:", len(res.data))
for p in res.data[:5]:
    print(p)

print("\n--- COURSES ---")
c_res = sb.table("courses").select("id, code, name, description, teacher_id").execute()
print("Courses count:", len(c_res.data))
for c in c_res.data:
    print(c)
