from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from agency.serializers import ActivityLogSerializer
import uuid
from django.contrib.auth.password_validation import validate_password

def get_jwt_token(user):
    refresh = RefreshToken.for_user(user)

    return (str(refresh), str(refresh.access_token))

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'full_name', 'role', 'is_onboarded', 'is_active', 'date_joined', 'last_login']

    def create(self, validated_data):
        """
        Create and return a new User instance, given the validated data.
        """
        password = validated_data.pop('password')
        user = User.objects.create(
            username = validated_data['username'],
            email = validated_data['email'],
            full_name = validated_data['full_name'],
            first_name = validated_data['first_name'],
            last_name = validated_data['last_name']
        )
        user.set_password(password)
        user.is_staff = True
        user.save()
        return user

    def to_representation(self, instance):
        """
        Convert `instance` into a dictionary format that can be rendered into JSON.
        """
        user_serialized_data =  super().to_representation(instance)

        '''
        # Remove UUID from username before returning
        if "_" in user_serialized_data['username']:
            user_serialized_data['username'] = user_serialized_data['username'].rsplit("_", 1)[0]

        '''

        """Get refresh and access token for user"""
        refresh, access = get_jwt_token(instance)
        # Get the role (group name)
        # role = instance.groups.first().name if instance.groups.exists() else None
        role = instance.role
        response_data =  {
            'refresh': refresh,
            'access': access,
            'user': user_serialized_data,
            'role': role,
        }
        return response_data

class SuperAdminCRMOverviewSerializer(serializers.Serializer):
    total_clients = serializers.IntegerField()
    new_clients = serializers.IntegerField()
    high_value_clients = serializers.IntegerField()
    recent_activities = ActivityLogSerializer(many=True)