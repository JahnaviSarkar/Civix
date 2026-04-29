import os
import re

html_files = [
    "index.html",
    "login.html",
    "citizen.html",
    "admin.html",
    "crew.html"
]

base_dir = r"c:\Users\dell\Desktop\smart-waste-app\frontend"

for fname in html_files:
    fpath = os.path.join(base_dir, fname)
    if not os.path.exists(fpath):
        continue
        
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Remove space after < for opening tags
    content = re.sub(r'<\s+([a-zA-Z!/])', r'<\1', content)
    
    # Remove space after </ for closing tags
    content = re.sub(r'</\s+([a-zA-Z0-9])', r'</\1', content)
    
    # Remove space before > for closing tags, e.g., </div >
    content = re.sub(r'</([a-zA-Z0-9]+)\s+>', r'</\1>', content)
    
    # Fix broken data-role attributes
    content = content.replace("data - role", "data-role")
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed tags in {fname}")
