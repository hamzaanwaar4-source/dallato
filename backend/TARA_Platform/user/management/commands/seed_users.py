from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Seed agency users with realistic data"

    def handle(self, *args, **kwargs):
        COMMON_PASSWORD = "123456"

        users_data = [
            {
                "username": "agency",
                "email": "admin@agency.com",
                "full_name": "Agency Admin",
                "role": "Agency Admin",
                "is_staff": True,
                "is_onboarded": True,
            },
            {
                "username": "agent_ali",
                "email": "ali.khan@agency.com",
                "full_name": "Ali Khan",
                "role": "Agency Agent",
                "is_staff": False,
                "is_onboarded": True,
            },
            {
                "username": "agent_ahmed",
                "email": "ahmed.raza@agency.com",
                "full_name": "Ahmed Raza",
                "role": "Agency Agent",
                "is_staff": False,
                "is_onboarded": False,
            },
            {
                "username": "agent_sara",
                "email": "sara.iqbal@agency.com",
                "full_name": "Sara Iqbal",
                "role": "Agency Agent",
                "is_staff": False,
                "is_onboarded": True,
            },
            {
                "username": "hamzaanwaar",
                "email": "hamzaanwaar4@gmail.com",
                "full_name": "Hamza Anwaar",
                "role": "Agency Agent",
                "is_staff": False,
                "is_onboarded": True,
            }
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data["username"],
                defaults={
                    "email": user_data["email"],
                    "full_name": user_data["full_name"],
                    "role": user_data["role"],
                    "is_staff": user_data["is_staff"],
                    "is_onboarded": user_data["is_onboarded"],
                }
            )

            if created:
                user.set_password(COMMON_PASSWORD)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f"✅ Created user: {user.username}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"⚠️ User already exists: {user.username}")
                )

        self.stdout.write(self.style.SUCCESS("🎉 User seeding completed"))
