import re

# Read the file
with open('app/api/routes/documents.py', 'r') as f:
    content = f.read()

# Find and replace the documents list more precisely
# Look for the specific pattern and replace it
old_section = '''        documents = [
            {
                "id": "14cc6797-d762-4af4-87ed-4671e844c1eb",
                "filename": "vast-whitepaper.pdf",
                "status": "failed",  # Based on the logs
                "upload_timestamp": "2025-07-09T11:31:21.856000",
                "file_size": 8543715,
                "processing_time": None,'''

new_section = '''        documents = [
            {
                "id": "14cc6797-d762-4af4-87ed-4671e844c1eb",
                "filename": "vast-whitepaper.pdf",
                "content_type": "application/pdf",
                "size": 8543715,
                "upload_date": "2025-07-09T11:31:21.856000",
                "status": "failed",
                "path": "/app/data/uploads/14cc6797-d762-4af4-87ed-4671e844c1eb_vast-whitepaper.pdf",'''

if old_section in content:
    content = content.replace(old_section, new_section)
    print("Replacement made!")
else:
    print("Pattern not found, showing current content around documents:")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'documents = [' in line:
            for j in range(max(0, i-2), min(len(lines), i+10)):
                print(f"{j+1}: {lines[j]}")
            break

with open('app/api/routes/documents.py', 'w') as f:
    f.write(content)
