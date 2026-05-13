from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Incident
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os
import uuid

router = APIRouter()

REPORTS_DIR = "/app/storage/reports"
if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

@router.post("/generate/pdf")
def generate_pdf_report(db: Session = Depends(get_db)):
    # Fetch recent critical/high incidents
    incidents = db.query(Incident).filter(Incident.severity.in_(['Critical', 'High'])).order_by(Incident.timestamp.desc()).limit(10).all()
    
    if not incidents:
        raise HTTPException(status_code=400, detail="No critical or high incidents found to report.")

    filename = f"SOC_Report_{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Title Style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.darkblue,
        spaceAfter=20
    )

    story = []
    
    story.append(Paragraph("Cybersecurity Incident Report", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Executive Summary:", styles["Heading2"]))
    story.append(Paragraph("This report highlights recent high and critical severity incidents detected in the environment. Immediate remediation is required.", styles["Normal"]))
    story.append(Spacer(1, 24))
    
    story.append(Paragraph("Top Critical & High Incidents", styles["Heading2"]))
    story.append(Spacer(1, 12))

    # Table Data
    data = [["Timestamp", "Severity", "Source IP", "Event Type"]]
    for inc in incidents:
        data.append([
            inc.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            inc.severity,
            inc.source_ip,
            inc.event_type
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)

    # Build PDF
    doc.build(story)

    return {"message": "Report generated successfully", "download_url": f"/api/v1/reports/download/{filename}"}

@router.get("/download/{filename}")
def download_report(filename: str):
    filepath = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(filepath, filename=filename, media_type='application/pdf')
