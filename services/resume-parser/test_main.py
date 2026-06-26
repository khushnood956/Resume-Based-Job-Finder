import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import main
from extractor import EmptyPDFError, ParserError

class TestMain(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)
        # Configure API token for test execution
        main.API_TOKEN = "test_secret_token"

    def test_root_healthcheck(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_parse_unauthorized(self):
        response = self.client.post(
            "/api/v1/parse",
            files={"file": ("resume.pdf", b"dummy_content", "application/pdf")},
            headers={"X-API-Token": "wrong_token"}
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Unauthorized", response.json()["detail"])

    def test_parse_invalid_file_type(self):
        response = self.client.post(
            "/api/v1/parse",
            files={"file": ("resume.txt", b"dummy_content", "text/plain")},
            headers={"X-API-Token": "test_secret_token"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Only PDF documents are supported", response.json()["detail"])

    @patch('main.extract_text_from_pdf')
    @patch('main.detect_sections')
    @patch('main.extract_skills_from_text')
    def test_parse_success(self, mock_skills, mock_sections, mock_extract):
        mock_extract.return_value = "Extracted resume content from user text."
        mock_sections.return_value = {"skills": "Python, React", "experience": "Senior Developer"}
        mock_skills.return_value = [{"name": "Python", "category": "programming_languages"}]

        response = self.client.post(
            "/api/v1/parse",
            files={"file": ("resume.pdf", b"%PDF-1.4 dummy pdf bytes", "application/pdf")},
            headers={"X-API-Token": "test_secret_token"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["filename"], "resume.pdf")
        self.assertEqual(data["extracted_text"], "Extracted resume content from user text.")
        self.assertEqual(data["sections"]["skills"], "Python, React")
        self.assertEqual(data["extracted_skills"][0]["name"], "Python")

    @patch('main.extract_text_from_pdf')
    def test_parse_empty_pdf(self, mock_extract):
        mock_extract.side_effect = EmptyPDFError("No readable text found")

        response = self.client.post(
            "/api/v1/parse",
            files={"file": ("scanned.pdf", b"%PDF-1.4 scanned bytes", "application/pdf")},
            headers={"X-API-Token": "test_secret_token"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("No readable text found", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
