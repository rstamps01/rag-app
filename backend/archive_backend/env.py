#!/usr/bin/env python3
"""
Corrected fix script for document listing issue
Run this in your ~/rag-app-07/backend directory
"""

import re
import os

def fix_documents_route():
    file_path = 'app/api/routes/documents.py'
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        print("Make sure you're running this from ~/rag-app-07/backend directory")
        return False
    
    # Read the current file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find and replace the list_documents function
    lines = content.split('\n')
    new_lines = []
    in_list_function = False
    function_indent = 0
    
    for i, line in enumerate(lines):
        if 'async def list_documents(' in line:
            in_list_function = True
            function_indent = len(line) - len(line.lstrip())
            new_lines.append(line)  # Keep the function signature
            
            # Add the new function body
            new_lines.extend([
                '    """',
                '    List uploaded documents by scanning the filesystem.',
                '    """',
                '    try:',
                '        # Get real uploaded documents from filesystem',
                '        upload_dir = "/app/data/uploads"',
                '        documents = []',
                '        ',
                '        if os.path.exists(upload_dir):',
                '            for filename in os.listdir(upload_dir):',
                '                if filename.endswith((\'.pdf\', \'.txt\', \'.docx\')):',
                '                    file_path = os.path.join(upload_dir, filename)',
                '                    file_stat = os.stat(file_path)',
                '                    ',
                '                    # Extract document ID from filename (format: id_originalname.ext)',
                '                    if \'_\' in filename:',
                '                        doc_id = filename.split(\'_\')[0]',
                '                        original_name = \'_\'.join(filename.split(\'_\')[1:])',
                '                    else:',
                '                        doc_id = filename',
                '                        original_name = filename',
                '                    ',
                '                    # Create DocumentMetadata object',
                '                    doc_metadata = DocumentMetadata(',
                '                        id=doc_id,',
                '                        filename=original_name,',
                '                        content_type="application/pdf" if filename.endswith(\'.pdf\') else "text/plain",',
                '                        size=file_stat.st_size,',
                '                        status="uploaded",',
                '                        path=file_path',
                '                    )',
                '                    documents.append(doc_metadata)',
                '        ',
                '        # Apply pagination',
                '        paginated_docs = documents[skip:skip + limit]',
                '        total_count = len(documents)',
                '        ',
                '        logger.info(f"API GET /documents - Listing documents from filesystem, skip={skip}, limit={limit}, returning {len(paginated_docs)} of {total_count}")',
                '        return {"documents": paginated_docs, "total_count": total_count}',
                '        ',
                '    except Exception as e:',
                '        logger.error(f"API GET /documents - Error listing documents: {e}", exc_info=True)',
                '        raise HTTPException(status_code=500, detail="Failed to retrieve documents")'
            ])
            continue
        elif in_list_function:
            # Skip lines until we find the next function or end of current function
            current_indent = len(line) - len(line.lstrip()) if line.strip() else function_indent + 1
            if line.strip() and current_indent <= function_indent and not line.startswith(' '):
                # We've reached the next function or end of current function
                in_list_function = False
                new_lines.append(line)
            # Skip the old function body
        else:
            new_lines.append(line)
    
    # Write the updated content back
    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))
    
    print("✅ Successfully updated documents route!")
    print("📁 Function now scans /app/data/uploads/ for real documents")
    return True

if __name__ == "__main__":
    print("🔧 Fixing documents route...")
    success = fix_documents_route()
    
    if success:
        print("\n🎯 Next steps:")
        print("1. Restart the backend container:")
        print("   cd ~/rag-app-07 && docker-compose restart backend-07")
        print("2. Test the API:")
        print("   curl -X GET http://localhost:8000/api/v1/documents/")
        print("3. Expected: JSON response with all 6 uploaded documents")
    else:
        print("❌ Fix failed. Please check that you're in the correct directory.")

