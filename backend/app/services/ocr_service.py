import pytesseract
from PIL import Image
import io
import os

class OCRService:
    def __init__(self):
        # Configure pytesseract path if needed
        # pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
        pass
    
    def extract_text_from_image(self, image_bytes):
        """Extract text from image using OCR"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            print(f"OCR error: {str(e)}")
            return ""
    
    def process_document_images(self, document_path):
        """Process document images and extract text"""
        if not os.path.exists(document_path):
            return ""
        
        try:
            if document_path.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif')):
                with open(document_path, 'rb') as f:
                    return self.extract_text_from_image(f.read())
            return ""
        except Exception as e:
            print(f"Document processing error: {str(e)}")
            return ""
