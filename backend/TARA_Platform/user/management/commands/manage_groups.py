from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = """
    -----Custom Admin Panel User Management Commands-----
    -> Manage user groups (list or add new groups)
    """

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("What do you want to do?"))
        self.stdout.write("1. List all groups")
        self.stdout.write("2. Add a new group")

        choice = input("Enter choice (1 or 2): ").strip()

        if choice == "1":
            self.list_groups()
        elif choice == "2":
            self.add_group()
        else:
            self.stdout.write(self.style.ERROR("Invalid choice!"))

    def list_groups(self):
        groups = Group.objects.all()
        if not groups.exists():
            self.stdout.write(self.style.WARNING("No groups found."))
        else:
            self.stdout.write(self.style.SUCCESS("Available Groups:"))
            for group in groups:
                self.stdout.write(f"- {group.id}: {group.name}")

    def add_group(self):
        name = input("Enter new group name: ").strip()
        confirm_name = input("Enter new group name again to confirm: ").strip()
        if name != confirm_name:
            self.stdout.write(self.style.ERROR("⚠️ Group names are not matching!"))
            return

        elif not name:
            self.stdout.write(self.style.ERROR("Group name cannot be empty!"))
            return

        group, created = Group.objects.get_or_create(name=name)
        if created:
            self.stdout.write(self.style.SUCCESS(f"Group '{name}' created successfully."))
        else:
            self.stdout.write(self.style.WARNING(f"Group '{name}' already exists."))
