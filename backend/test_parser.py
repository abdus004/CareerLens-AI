from app.services.resume_parser import extract_text

pdf_path = "resume1.pdf"

text = extract_text(pdf_path)

print(text)