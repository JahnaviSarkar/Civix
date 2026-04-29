import os
import re

def clean_file(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove wrappers
    if "Action: file_editor" in content:
        content = re.sub(r'(?s).*?--file - text "(.*)".*', r'\1', content)
        content = re.sub(r'(?s).*?--file-text "(.*)".*', r'\1', content)
        content = re.sub(r'Observation: .*', '', content)
    
    # Unescape
    content = content.replace(r'\"', '"').replace(r'\n', '\n')
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"Cleaned {fpath}")

js_dir = r"c:\Users\dell\Desktop\smart-waste-app\frontend\js"
for root, _, files in os.walk(js_dir):
    for fname in files:
        if fname.endswith('.js'):
            clean_file(os.path.join(root, fname))

