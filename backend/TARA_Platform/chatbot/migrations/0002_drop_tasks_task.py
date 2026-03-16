from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('chatbot', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL('DROP TABLE IF EXISTS tasks_task CASCADE;'),
    ]
