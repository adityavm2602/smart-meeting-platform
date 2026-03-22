import io
from fastapi import UploadFile, HTTPException

async def extract_text(file: UploadFile) -> str:
    filename = file.filename.lower()
    content = await file.read()

    if filename.endswith(".txt"):
        return _from_txt(content)
    elif filename.endswith(".pdf"):
        return _from_pdf(content)
    elif filename.endswith(".docx"):
        return _from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use TXT, PDF, or DOCX.")

def _from_txt(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")

def _from_pdf(content: bytes) -> str:
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n".join(text_parts)
    except ImportError:
        raise HTTPException(status_code=500, detail="Install pdfplumber: pip install pdfplumber")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {e}")

def _from_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except ImportError:
        raise HTTPException(status_code=500, detail="Install python-docx: pip install python-docx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX extraction failed: {e}")