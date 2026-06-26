import unittest
from unittest.mock import MagicMock, patch
from extractor import extract_text_from_pdf, clean_extracted_text, EmptyPDFError, ParserError

class TestExtractor(unittest.TestCase):
    def test_clean_extracted_text(self):
        text = "Hello\tWorld!\r\nThis   is  a\n\n\n\ntest.\x00"
        cleaned = clean_extracted_text(text)
        self.assertEqual(cleaned, "Hello World!\nThis is a\n\ntest.")

    @patch('fitz.open')
    def test_extract_text_from_pdf_success(self, mock_open):
        mock_doc = MagicMock()
        mock_page1 = MagicMock()
        mock_page1.get_text.return_value = "Page 1 content with enough text characters to pass threshold."
        mock_page2 = MagicMock()
        mock_page2.get_text.return_value = "Page 2 content also has a substantial amount of text."
        mock_doc.__iter__.return_value = [mock_page1, mock_page2]
        mock_open.return_value = mock_doc
        
        result = extract_text_from_pdf(b"dummy_pdf_bytes")
        self.assertIn("Page 1 content", result)
        self.assertIn("Page 2 content", result)
        mock_doc.close.assert_called_once()

    @patch('fitz.open')
    def test_extract_text_from_pdf_empty(self, mock_open):
        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Short"  # too short (< 50 chars)
        mock_doc.__iter__.return_value = [mock_page]
        mock_open.return_value = mock_doc
        
        with self.assertRaises(EmptyPDFError):
            extract_text_from_pdf(b"dummy_pdf_bytes")
            
    @patch('fitz.open')
    def test_extract_text_from_pdf_failure(self, mock_open):
        mock_open.side_effect = Exception("Corrupt file")
        with self.assertRaises(ParserError):
            extract_text_from_pdf(b"corrupt_bytes")

if __name__ == '__main__':
    unittest.main()
