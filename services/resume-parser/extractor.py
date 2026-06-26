import re
import fitz  # PyMuPDF

class ParserError(Exception):
    """Base exception class for parser-related issues."""
    pass

class EmptyPDFError(ParserError):
    """Exception raised when the PDF has no readable text content (e.g. image-only or scanned)."""
    pass

def clean_extracted_text(text: str) -> str:
    """
    Cleans raw extracted text by removing non-printable control characters,
    normalizing whitespace, and standardizing newlines.
    """
    if not text:
        return ""
        
    # Replace null bytes and other non-printable control characters (excluding tab and newline)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Normalize tabs to single spaces
    text = text.replace('\t', ' ')
    
    # Standardize newline variants
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Collapse multiple consecutive horizontal spaces to a single space
    text = re.sub(r'[ \t\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+', ' ', text)
    
    # Collapse multiple consecutive newlines to at most a double newline to preserve section boundaries
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Trim leading/trailing spacing
    return text.strip()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Reads PDF binary stream, iterates page by page, extracts text,
    and returns a cleaned plain-text string.
    
    Raises:
        EmptyPDFError: If no readable text content is found.
        ParserError: If the document is corrupted or fails to open.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ParserError(f"Failed to open PDF document: {str(e)}")
        
    extracted_pages = []
    
    try:
        for page in doc:
            page_text = page.get_text()
            if page_text:
                extracted_pages.append(page_text)
    except Exception as e:
         raise ParserError(f"Failed to extract text from PDF pages: {str(e)}")
    finally:
        doc.close()
        
    full_text = "\n".join(extracted_pages)
    cleaned_text = clean_extracted_text(full_text)
    
    # Check if the extracted text is empty or too short (typically scanned PDFs without OCR)
    # 50 characters is a reasonable threshold to distinguish a real text-based resume from metadata
    if len(cleaned_text.strip()) < 50:
        raise EmptyPDFError(
            "No readable text found. The PDF may be scanned, image-only, or empty. "
            "Please upload a text-based PDF or perform OCR first."
        )
        
    return cleaned_text
