import os
import smtplib
from email.message import EmailMessage

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - fallback when dependency is missing
    load_dotenv = None


if load_dotenv:
    load_dotenv()


def send_email(to_email: str, subject: str, body: str):
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", user or "no-reply@eduboost.local")
    port = int(os.getenv("SMTP_PORT", "587"))

    if not host or not user or not password:
        return {
            "sent": False,
            "reason": "SMTP is not configured",
            "to": to_email,
            "subject": subject,
            "body": body,
        }

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(message)

    return {
        "sent": True,
        "to": to_email,
        "subject": subject,
        "body": body,
    }
