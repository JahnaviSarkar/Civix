import os
import re

base_dir = r"c:\Users\dell\Desktop\smart-waste-app\frontend"

files_to_fix = [
    ("style.css", "style.css"),
    ("index.html", "index.html"),
    ("login.js", "login.html"),
    (r"js\auth.js", "auth.js"),
    ("citizen.html", "citizen.html"),
    ("admin.html", "admin.html"),
    ("crew.html", "crew.html"),
]

for src, dest in files_to_fix:
    src_path = os.path.join(base_dir, src)
    dest_path = os.path.join(base_dir, dest)
    
    if not os.path.exists(src_path):
        print(f"Skipping {src_path}, not found.")
        continue
        
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the start
    start_idx = -1
    if "/* ===========================================" in content:
        start_idx = content.find("/* ===========================================")
    elif "<!DOCTYPE html>" in content:
        start_idx = content.find("<!DOCTYPE html>")
    elif "/* ============================================" in content:
        start_idx = content.find("/* ============================================")
        
    # Find the end
    end_idx = content.rfind('"\nObservation:')
    if end_idx == -1:
        end_idx = content.rfind('"\n Observation:')
        
    if start_idx != -1 and end_idx != -1:
        clean_content = content[start_idx:end_idx]
    else:
        clean_content = content
        
    # Clean escape sequences
    clean_content = clean_content.replace(r'\"', '"')
    
    # Fix paths
    clean_content = clean_content.replace('href="/style.css"', 'href="style.css"')
    clean_content = clean_content.replace('href="/login.html"', 'href="login.html"')
    clean_content = clean_content.replace('href="/"', 'href="index.html"')
    clean_content = clean_content.replace('src="/auth.js"', 'src="auth.js"')
    
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(clean_content)
    
    print(f"Fixed {dest}")
