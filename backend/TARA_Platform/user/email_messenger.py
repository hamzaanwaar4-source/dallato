from django.conf import settings
from django.core.mail import send_mail
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
load_dotenv()

class EmailService():
    def send_email(self, email, subject, message):
        try:
            recipient_list = [email]
            send_mail(
                subject, "",
                from_email=settings.EMAIL_FROM,
                recipient_list=recipient_list,
                html_message=message,
                connection=settings.EMAIL_CONNECTION
            )
            logger.info(f"Email has sent to `{email}` for `{subject}`")
            return True
        except Exception as e:
            logger.error(f'Unablbe to send email to `{email}` for `{subject}`:\n {str(e)}')
            return False

